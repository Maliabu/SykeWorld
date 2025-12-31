"use server";

import { db } from "@/lib/db";
import { activityLogs } from "@/lib/db/schema/activityLog";
import { getSession } from "@/lib/auth/session";
import { headers } from "next/headers";

export interface ActivityLogData {
  action: string; // e.g., "CREATE_ROOM", "DELETE_USER", "UPDATE_BOOKING"
  entityType: string; // e.g., "room", "user", "booking"
  entityId?: string; // ID of the affected entity
  description: string; // Human-readable description
  metadata?: Record<string, any>; // Additional data
}

/**
 * Log an activity to the activity log table
 * This should be called after successful operations (create, update, delete)
 */
export async function logActivity(data: ActivityLogData): Promise<void> {
  try {
    const session = await getSession();
    
    // Only log if user is authenticated
    if (!session) {
      return;
    }

    // Get request headers for IP and user agent
    const headersList = await headers();
    const ipAddress = 
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

    await db.insert(activityLogs).values({
      userId: session.userId,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId || null,
      description: data.description,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    // Don't throw - logging should never break the main operation
    console.error("Failed to log activity:", error);
  }
}


