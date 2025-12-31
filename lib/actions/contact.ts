"use server";

import { db } from "@/lib/db";
import { contactMessages } from "@/lib/db/schema/users";
import { contactMessageSchema } from "@/lib/validations/bookings";
import { requireAuth } from "@/lib/auth/session";
import { desc, eq } from "drizzle-orm";

export async function createContactMessage(data: unknown) {
  try {
    const validated = contactMessageSchema.parse(data);

    const [message] = await db
      .insert(contactMessages)
      .values({
        name: validated.name,
        email: validated.email,
        message: validated.message,
      })
      .returning();

    return {
      success: true,
      message: {
        id: message.id,
        name: message.name,
        email: message.email,
        createdAt: message.created,
      },
    };
  } catch (error: any) {
    if (error.name === "ZodError") {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to send message" };
  }
}

export async function getAllContactMessages() {
  try {
    await requireAuth();

    const messages = await db
      .select()
      .from(contactMessages)
      .orderBy(desc(contactMessages.created));

    return {
      success: true,
      messages: messages.map((msg) => ({
        id: msg.id,
        name: msg.name,
        email: msg.email,
        message: msg.message,
        createdAt: msg.created,
      })),
    };
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    return { error: "Failed to fetch messages" };
  }
}

export async function deleteContactMessage(messageId: string) {
  try {
    await requireAuth();

    await db.delete(contactMessages).where(eq(contactMessages.id, messageId));

    return { success: true };
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    return { error: "Failed to delete message" };
  }
}




