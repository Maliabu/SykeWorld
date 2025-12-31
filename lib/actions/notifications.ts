"use server";

import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema/notifications";
import { users } from "@/lib/db/schema/users";
import { createNotificationSchema, updateNotificationStatusSchema } from "@/lib/validations/notifications";
import { requireAuth, requireAdmin, getSession } from "@/lib/auth/session";
import { eq, desc, and, or } from "drizzle-orm";
import { logActivity } from "@/lib/utils/activityLog";

// Get user's notifications
export async function getUserNotifications() {
  try {
    const session = await requireAuth();

    const userNotifications = await db
      .select({
        id: notifications.id,
        title: notifications.title,
        message: notifications.message,
        status: notifications.status,
        createdAt: notifications.createdAt,
        createdBy: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          username: users.username,
        },
      })
      .from(notifications)
      .leftJoin(users, eq(notifications.createdBy, users.id))
      .where(eq(notifications.userId, session.userId))
      .orderBy(desc(notifications.createdAt));

    return { success: true, notifications: userNotifications };
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    console.error("Get notifications error:", error);
    return { error: "Failed to fetch notifications" };
  }
}

// Get new notifications count
export async function getNewNotificationsCount() {
  try {
    const session = await requireAuth();

    const newNotifications = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, session.userId),
          eq(notifications.status, "new")
        )
      );

    return { success: true, count: newNotifications.length };
  } catch (error: any) {
    return { success: true, count: 0 };
  }
}

// Get new notifications for popup on login
export async function getNewNotificationsForPopup() {
  try {
    const session = await requireAuth();

    const newNotifications = await db
      .select({
        id: notifications.id,
        title: notifications.title,
        message: notifications.message,
      })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, session.userId),
          eq(notifications.status, "new")
        )
      )
      .orderBy(desc(notifications.createdAt))
      .limit(10);

    return { success: true, notifications: newNotifications };
  } catch (error: any) {
    return { success: true, notifications: [] };
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string) {
  try {
    const session = await requireAuth();

    await db
      .update(notifications)
      .set({ status: "read" })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, session.userId)
        )
      );

    return { success: true };
  } catch (error: any) {
    console.error("Mark notification as read error:", error);
    return { error: "Failed to mark notification as read" };
  }
}

// Helper function to get all admin users
async function getAllAdminUsers() {
  try {
    const adminUsers = await db
      .select({
        id: users.id,
        email: users.email,
      })
      .from(users)
      .where(
        or(
          eq(users.userType, "admin"),
          eq(users.isSuperuser, true)
        )
      );

    return adminUsers;
  } catch (error) {
    console.error("Error fetching admin users:", error);
    return [];
  }
}

// Helper function to notify all admins
export async function notifyAllAdmins(title: string, message: string, createdBy?: string) {
  try {
    const adminUsers = await getAllAdminUsers();
    
    if (adminUsers.length === 0) {
      console.log("No admin users found to notify");
      return { success: true, notified: 0 };
    }

    // Use system user ID or first admin as creator if not provided
    let creatorId = createdBy;
    if (!creatorId && adminUsers.length > 0) {
      creatorId = adminUsers[0].id;
    }

    if (!creatorId) {
      console.error("No creator ID available for notifications");
      return { error: "No creator ID available" };
    }

    // Create notification for each admin
    const notificationPromises = adminUsers.map((admin) =>
      db.insert(notifications).values({
        userId: admin.id,
        createdBy: creatorId,
        title,
        message,
        status: "new",
      })
    );

    await Promise.all(notificationPromises);

    console.log(`Created notifications for ${adminUsers.length} admin users`);
    return { success: true, notified: adminUsers.length };
  } catch (error: any) {
    console.error("Error notifying admins:", error);
    return { error: "Failed to notify admins" };
  }
}

// Create notification (admin only)
export async function createNotification(data: unknown) {
  try {
    await requireAdmin();
    const validated = createNotificationSchema.parse(data);
    const session = await getSession();

    if (!session) {
      return { error: "Unauthorized" };
    }

    const [notification] = await db
      .insert(notifications)
      .values({
        userId: validated.userId,
        createdBy: session.userId,
        title: validated.title,
        message: validated.message,
        status: "new",
      })
      .returning();

    await logActivity({
      action: "CREATE",
      entityType: "notification",
      entityId: notification.id,
      description: `Created notification for user: ${validated.userId}`,
      metadata: { title: validated.title },
    });

    return { success: true, notification };
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Admin")) {
      return { error: "Unauthorized: Admin access required" };
    }
    if (error.name === "ZodError") {
      return { error: error.errors[0].message };
    }
    console.error("Create notification error:", error);
    return { error: "Failed to create notification" };
  }
}

// Get all notifications (admin only)
export async function getAllNotifications() {
  try {
    await requireAdmin();

    const allNotifications = await db
      .select({
        id: notifications.id,
        title: notifications.title,
        message: notifications.message,
        status: notifications.status,
        createdAt: notifications.createdAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          username: users.username,
        },
        creator: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          username: users.username,
        },
      })
      .from(notifications)
      .leftJoin(users, eq(notifications.userId, users.id))
      .orderBy(desc(notifications.createdAt));

    return { success: true, notifications: allNotifications };
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Admin")) {
      return { error: "Unauthorized: Admin access required" };
    }
    return { error: "Failed to fetch notifications" };
  }
}

// Delete notification (admin only)
export async function deleteNotification(notificationId: string) {
  try {
    await requireAdmin();

    await db
      .delete(notifications)
      .where(eq(notifications.id, notificationId));

    await logActivity({
      action: "DELETE",
      entityType: "notification",
      entityId: notificationId,
      description: `Deleted notification: ${notificationId}`,
    });

    return { success: true };
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Admin")) {
      return { error: "Unauthorized: Admin access required" };
    }
    return { error: "Failed to delete notification" };
  }
}


