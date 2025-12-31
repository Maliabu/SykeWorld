"use server";

import { db } from "@/lib/db";
import { payments, transactions } from "@/lib/db/schema/payments";
import { bookings } from "@/lib/db/schema/bookings";
import { users } from "@/lib/db/schema/users";
import { requireAdmin } from "@/lib/auth/session";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";

// Get monthly earnings data for chart
export async function getMonthlyEarnings(months: number = 12) {
  try {
    await requireAdmin();

    // Get completed payments grouped by month
    const monthlyData = await db
      .select({
        month: sql<string>`TO_CHAR(${payments.created}, 'YYYY-MM')`,
        total: sql<number>`SUM(CAST(${payments.amount} AS DECIMAL))`,
        count: sql<number>`COUNT(*)`,
      })
      .from(payments)
      .where(eq(payments.status, "COMPLETED"))
      .groupBy(sql`TO_CHAR(${payments.created}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${payments.created}, 'YYYY-MM') DESC`)
      .limit(months);

    // Also get from transactions
    const transactionData = await db
      .select({
        month: sql<string>`TO_CHAR(${transactions.created}, 'YYYY-MM')`,
        total: sql<number>`SUM(CAST(${transactions.amount} AS DECIMAL))`,
        count: sql<number>`COUNT(*)`,
      })
      .from(transactions)
      .where(eq(transactions.status, "COMPLETED"))
      .groupBy(sql`TO_CHAR(${transactions.created}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${transactions.created}, 'YYYY-MM') DESC`)
      .limit(months);

    // Combine and aggregate data
    const combined: Record<string, { total: number; count: number }> = {};

    monthlyData.forEach((item) => {
      const month = item.month;
      if (!combined[month]) {
        combined[month] = { total: 0, count: 0 };
      }
      combined[month].total += Number(item.total) || 0;
      combined[month].count += Number(item.count) || 0;
    });

    transactionData.forEach((item) => {
      const month = item.month;
      if (!combined[month]) {
        combined[month] = { total: 0, count: 0 };
      }
      combined[month].total += Number(item.total) || 0;
      combined[month].count += Number(item.count) || 0;
    });

    // Convert to array and format
    const result = Object.entries(combined)
      .map(([month, data]) => ({
        month,
        total: data.total,
        count: data.count,
        formattedMonth: new Date(month + "-01").toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
        }),
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return { success: true, data: result };
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Admin")) {
      return { error: "Unauthorized: Admin access required" };
    }
    console.error("Monthly earnings error:", error);
    return { error: "Failed to fetch monthly earnings" };
  }
}

// Get detailed monthly report
export async function getMonthlyReport(
  year?: number,
  month?: number,
  startDate?: string,
  endDate?: string
) {
  try {
    await requireAdmin();

    let query = db
      .select({
        id: payments.id,
        amount: payments.amount,
        status: payments.status,
        created: payments.created,
        bookingId: payments.bookingId,
        userId: payments.userId,
        pesapalOrderTrackingId: payments.pesapalOrderTrackingId,
        pesapalMerchantReference: payments.pesapalMerchantReference,
        user: {
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          username: users.username,
        },
        booking: {
          checkIn: bookings.checkIn,
          checkOut: bookings.checkOut,
          guests: bookings.guests,
        },
      })
      .from(payments)
      .leftJoin(users, eq(payments.userId, users.id))
      .leftJoin(bookings, eq(payments.bookingId, bookings.id));

    // Apply date filters
    if (year && month) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      query = query.where(
        and(
          gte(payments.created, start),
          lte(payments.created, end)
        )
      ) as any;
    } else if (startDate && endDate) {
      query = query.where(
        and(
          gte(payments.created, new Date(startDate)),
          lte(payments.created, new Date(endDate))
        )
      ) as any;
    }

    const paymentsData = await query.orderBy(desc(payments.created));

    // Also get transactions
    let transactionQuery = db
      .select({
        id: transactions.id,
        amount: transactions.amount,
        status: transactions.status,
        created: transactions.created,
        bookingId: transactions.bookingId,
        userId: transactions.userId,
        paymentMethod: transactions.paymentMethod,
        pesapalReference: transactions.pesapalReference,
        merchantReference: transactions.merchantReference,
        user: {
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          username: users.username,
        },
        booking: {
          checkIn: bookings.checkIn,
          checkOut: bookings.checkOut,
          guests: bookings.guests,
        },
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.userId, users.id))
      .leftJoin(bookings, eq(transactions.bookingId, bookings.id));

    if (year && month) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      transactionQuery = transactionQuery.where(
        and(
          gte(transactions.created, start),
          lte(transactions.created, end)
        )
      ) as any;
    } else if (startDate && endDate) {
      transactionQuery = transactionQuery.where(
        and(
          gte(transactions.created, new Date(startDate)),
          lte(transactions.created, new Date(endDate))
        )
      ) as any;
    }

    const transactionsData = await transactionQuery.orderBy(desc(transactions.created));

    // Calculate totals
    const totalEarnings = [
      ...paymentsData.filter((p) => p.status === "COMPLETED"),
      ...transactionsData.filter((t) => t.status === "COMPLETED"),
    ].reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    const totalTransactions = paymentsData.length + transactionsData.length;
    const completedTransactions = [
      ...paymentsData.filter((p) => p.status === "COMPLETED"),
      ...transactionsData.filter((t) => t.status === "COMPLETED"),
    ].length;

    return {
      success: true,
      payments: paymentsData.map((p) => ({
        ...p,
        amount: parseFloat(p.amount) || 0,
      })),
      transactions: transactionsData.map((t) => ({
        ...t,
        amount: parseFloat(t.amount) || 0,
      })),
      summary: {
        totalEarnings,
        totalTransactions,
        completedTransactions,
        pendingTransactions: totalTransactions - completedTransactions,
      },
    };
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Admin")) {
      return { error: "Unauthorized: Admin access required" };
    }
    console.error("Monthly report error:", error);
    return { error: "Failed to fetch monthly report" };
  }
}



