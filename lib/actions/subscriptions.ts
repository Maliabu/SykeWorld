"use server";

import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema/bookings";
import { requireAuth, requireStaff } from "@/lib/auth/session";
import { eq } from "drizzle-orm";
import { logActivity } from "@/lib/utils/activityLog";

// Get all subscriptions (staff/admin only)
export async function getAllSubscriptions() {
  try {
    await requireStaff();

    const allSubscriptions = await db
      .select()
      .from(subscriptions)
      .orderBy(subscriptions.createdAt);

    return { success: true, subscriptions: allSubscriptions };
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Staff")) {
      return { error: "Unauthorized: Staff access required" };
    }
    return { error: "Failed to fetch subscriptions" };
  }
}

// Get user's own subscriptions (for logged-in users)
export async function getUserSubscriptions() {
  try {
    const session = await requireAuth();

    // For now, return all subscriptions for any logged-in user
    // You can filter by user if needed in the future
    const userSubscriptions = await db
      .select()
      .from(subscriptions)
      .orderBy(subscriptions.createdAt);

    return { success: true, subscriptions: userSubscriptions };
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    return { error: "Failed to fetch subscriptions" };
  }
}

// Delete subscription (admin only)
export async function deleteSubscription(subscriptionId: string) {
  try {
    const session = await requireStaff();

    // Get subscription before deleting for logging
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, subscriptionId))
      .limit(1);

    if (!subscription) {
      return { error: "Subscription not found" };
    }

    await db.delete(subscriptions).where(eq(subscriptions.id, subscriptionId));

    // Log activity
    await logActivity({
      action: "DELETE_SUBSCRIPTION",
      entityType: "subscription",
      entityId: subscriptionId,
      description: `Deleted subscription for ${subscription.email}`,
      metadata: { email: subscription.email, name: subscription.name },
    });

    return { success: true };
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Staff")) {
      return { error: "Unauthorized: Staff access required" };
    }
    return { error: "Failed to delete subscription" };
  }
}



