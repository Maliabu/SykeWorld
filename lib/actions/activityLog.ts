"use server";

import { db } from "@/lib/db";
import { activityLogs } from "@/lib/db/schema/activityLog";
import { users } from "@/lib/db/schema/users";
import { requireAdmin } from "@/lib/auth/session";
import { eq, desc, sql, count } from "drizzle-orm";

// Get all activity logs (admin only)
export async function getAllActivityLogs(limit: number = 100, offset: number = 0) {
  try {
    await requireAdmin();

    const logs = await db
      .select({
        id: activityLogs.id,
        action: activityLogs.action,
        entityType: activityLogs.entityType,
        entityId: activityLogs.entityId,
        description: activityLogs.description,
        metadata: activityLogs.metadata,
        ipAddress: activityLogs.ipAddress,
        userAgent: activityLogs.userAgent,
        createdAt: activityLogs.createdAt,
        user: {
          id: users.id,
          email: users.email,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(activityLogs)
      .innerJoin(users, eq(activityLogs.userId, users.id))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(activityLogs);

    return {
      success: true,
      logs: logs.map((log) => ({
        ...log,
        metadata: log.metadata ? JSON.parse(log.metadata) : null,
        userName: log.user.firstName && log.user.lastName
          ? `${log.user.firstName} ${log.user.lastName}`
          : log.user.username || log.user.email,
      })),
      total: Number(count),
    };
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Admin")) {
      return { error: "Unauthorized: Admin access required" };
    }
    console.error("Activity log error:", error);
    return { error: "Failed to fetch activity logs" };
  }
}

// Get activity logs by user (admin only)
export async function getActivityLogsByUser(userId: string, limit: number = 50) {
  try {
    await requireAdmin();

    const logs = await db
      .select({
        id: activityLogs.id,
        action: activityLogs.action,
        entityType: activityLogs.entityType,
        entityId: activityLogs.entityId,
        description: activityLogs.description,
        metadata: activityLogs.metadata,
        createdAt: activityLogs.createdAt,
        user: {
          id: users.id,
          email: users.email,
          username: users.username,
        },
      })
      .from(activityLogs)
      .innerJoin(users, eq(activityLogs.userId, users.id))
      .where(eq(activityLogs.userId, userId))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);

    return {
      success: true,
      logs: logs.map((log) => ({
        ...log,
        metadata: log.metadata ? JSON.parse(log.metadata) : null,
      })),
    };
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Admin")) {
      return { error: "Unauthorized: Admin access required" };
    }
    return { error: "Failed to fetch activity logs" };
  }
}

// Get user activity statistics (count of activities per user) - all users
export async function getUserActivityStats() {
  try {
    await requireAdmin();

    const stats = await db
      .select({
        userId: activityLogs.userId,
        activityCount: sql<number>`count(*)::int`,
        user: {
          id: users.id,
          email: users.email,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          profilePicture: users.profilePicture,
        },
      })
      .from(activityLogs)
      .innerJoin(users, eq(activityLogs.userId, users.id))
      .groupBy(activityLogs.userId, users.id, users.email, users.username, users.firstName, users.lastName, users.profilePicture)
      .orderBy(desc(sql<number>`count(*)`));

    return {
      success: true,
      stats: stats.map((stat) => ({
        userId: stat.userId,
        activityCount: Number(stat.activityCount),
        userName: stat.user.firstName && stat.user.lastName
          ? `${stat.user.firstName} ${stat.user.lastName}`
          : stat.user.username || stat.user.email,
        email: stat.user.email,
        profilePicture: stat.user.profilePicture,
        username: stat.user.username,
      })),
    };
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Admin")) {
      return { error: "Unauthorized: Admin access required" };
    }
    console.error("User activity stats error:", error);
    return { error: "Failed to fetch user activity statistics" };
  }
}

