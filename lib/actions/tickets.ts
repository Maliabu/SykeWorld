"use server";

import { db } from "@/lib/db";
import { tickets, ticketMessages } from "@/lib/db/schema/tickets";
import { users } from "@/lib/db/schema/users";
import { createTicketSchema, addTicketMessageSchema, updateTicketStatusSchema } from "@/lib/validations/tickets";
import { requireAuth, requireAdmin, getSession } from "@/lib/auth/session";
import { eq, desc, and } from "drizzle-orm";
import { logActivity } from "@/lib/utils/activityLog";

// Create ticket
export async function createTicket(data: unknown) {
  try {
    const session = await requireAuth();
    const validated = createTicketSchema.parse(data);

    const [ticket] = await db
      .insert(tickets)
      .values({
        userId: session.userId,
        title: validated.title,
        status: "open",
      })
      .returning();

    // Add initial message
    await db
      .insert(ticketMessages)
      .values({
        ticketId: ticket.id,
        userId: session.userId,
        message: validated.message,
      });

    await logActivity({
      action: "CREATE",
      entityType: "ticket",
      entityId: ticket.id,
      description: `Created ticket: ${validated.title}`,
      metadata: { title: validated.title },
    });

    return { success: true, ticket };
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    if (error.name === "ZodError") {
      return { error: error.errors[0].message };
    }
    console.error("Create ticket error:", error);
    return { error: "Failed to create ticket" };
  }
}

// Get user's tickets
export async function getUserTickets() {
  try {
    const session = await requireAuth();

    const userTickets = await db
      .select({
        id: tickets.id,
        title: tickets.title,
        status: tickets.status,
        createdAt: tickets.createdAt,
        closedAt: tickets.closedAt,
      })
      .from(tickets)
      .where(eq(tickets.userId, session.userId))
      .orderBy(desc(tickets.createdAt));

    return { success: true, tickets: userTickets };
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    return { error: "Failed to fetch tickets" };
  }
}

// Get open tickets count
export async function getOpenTicketsCount() {
  try {
    const session = await requireAuth();

    // If admin, count all open tickets; otherwise count user's open tickets
    const isAdmin = session.isSuperuser || session.userType === "admin";
    
    const openTickets = await db
      .select({ id: tickets.id })
      .from(tickets)
      .where(
        isAdmin
          ? eq(tickets.status, "open")
          : and(
              eq(tickets.userId, session.userId),
              eq(tickets.status, "open")
            )
      );

    return { success: true, count: openTickets.length };
  } catch (error: any) {
    return { success: true, count: 0 };
  }
}

// Get ticket by ID with messages
export async function getTicketById(ticketId: string) {
  try {
    const session = await requireAuth();

    const [ticket] = await db
      .select({
        id: tickets.id,
        title: tickets.title,
        status: tickets.status,
        createdAt: tickets.createdAt,
        closedAt: tickets.closedAt,
        userId: tickets.userId,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          username: users.username,
        },
      })
      .from(tickets)
      .leftJoin(users, eq(tickets.userId, users.id))
      .where(eq(tickets.id, ticketId))
      .limit(1);

    if (!ticket) {
      return { error: "Ticket not found" };
    }

    // Check if user has access (owner or admin)
    const isAdmin = session.isSuperuser || session.userType === "admin";
    if (ticket.userId !== session.userId && !isAdmin) {
      return { error: "Unauthorized" };
    }

    // Get messages
    const messages = await db
      .select({
        id: ticketMessages.id,
        message: ticketMessages.message,
        createdAt: ticketMessages.createdAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          username: users.username,
        },
      })
      .from(ticketMessages)
      .leftJoin(users, eq(ticketMessages.userId, users.id))
      .where(eq(ticketMessages.ticketId, ticketId))
      .orderBy(ticketMessages.createdAt);

    return { success: true, ticket: { ...ticket, messages } };
  } catch (error: any) {
    console.error("Get ticket error:", error);
    return { error: "Failed to fetch ticket" };
  }
}

// Add message to ticket
export async function addTicketMessage(data: unknown) {
  try {
    const session = await requireAuth();
    const validated = addTicketMessageSchema.parse(data);

    // Verify ticket exists and user has access
    const [ticket] = await db
      .select({ userId: tickets.userId, status: tickets.status })
      .from(tickets)
      .where(eq(tickets.id, validated.ticketId))
      .limit(1);

    if (!ticket) {
      return { error: "Ticket not found" };
    }

    const isAdmin = session.isSuperuser || session.userType === "admin";
    if (ticket.userId !== session.userId && !isAdmin) {
      return { error: "Unauthorized" };
    }

    if (ticket.status === "closed") {
      return { error: "Cannot add message to closed ticket" };
    }

    await db
      .insert(ticketMessages)
      .values({
        ticketId: validated.ticketId,
        userId: session.userId,
        message: validated.message,
      });

    return { success: true };
  } catch (error: any) {
    if (error.name === "ZodError") {
      return { error: error.errors[0].message };
    }
    console.error("Add ticket message error:", error);
    return { error: "Failed to add message" };
  }
}

// Close ticket (admin only)
export async function closeTicket(ticketId: string) {
  try {
    await requireAdmin();
    const session = await getSession();

    if (!session) {
      return { error: "Unauthorized" };
    }

    await db
      .update(tickets)
      .set({
        status: "closed",
        closedBy: session.userId,
        closedAt: new Date(),
      })
      .where(eq(tickets.id, ticketId));

    await logActivity({
      action: "UPDATE",
      entityType: "ticket",
      entityId: ticketId,
      description: `Closed ticket: ${ticketId}`,
    });

    return { success: true };
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Admin")) {
      return { error: "Unauthorized: Admin access required" };
    }
    return { error: "Failed to close ticket" };
  }
}

// Get all tickets (admin only)
export async function getAllTickets() {
  try {
    await requireAdmin();

    const allTickets = await db
      .select({
        id: tickets.id,
        title: tickets.title,
        status: tickets.status,
        createdAt: tickets.createdAt,
        closedAt: tickets.closedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          username: users.username,
        },
      })
      .from(tickets)
      .leftJoin(users, eq(tickets.userId, users.id))
      .orderBy(desc(tickets.createdAt));

    return { success: true, tickets: allTickets };
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Admin")) {
      return { error: "Unauthorized: Admin access required" };
    }
    return { error: "Failed to fetch tickets" };
  }
}

// Delete ticket (admin only)
export async function deleteTicket(ticketId: string) {
  try {
    await requireAdmin();

    await db
      .delete(tickets)
      .where(eq(tickets.id, ticketId));

    await logActivity({
      action: "DELETE",
      entityType: "ticket",
      entityId: ticketId,
      description: `Deleted ticket: ${ticketId}`,
    });

    return { success: true };
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Admin")) {
      return { error: "Unauthorized: Admin access required" };
    }
    return { error: "Failed to delete ticket" };
  }
}



