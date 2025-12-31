"use server";

import { db } from "@/lib/db";
import { payments, transactions, paymentLogs } from "@/lib/db/schema/payments";
import { createPaymentSchema, createTransactionSchema } from "@/lib/validations/payments";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth/session";

export async function createPayment(data: unknown) {
  try {
    const session = await requireAuth();
    const validated = createPaymentSchema.parse(data);

    const [payment] = await db
      .insert(payments)
      .values({
        bookingId: validated.bookingId,
        userId: session.userId,
        amount: validated.amount,
        status: "PENDING",
      })
      .returning();

    return { success: true, payment };
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    if (error.name === "ZodError") {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to create payment" };
  }
}

export async function createTransaction(data: unknown) {
  try {
    const session = await requireAuth();
    const validated = createTransactionSchema.parse(data);

    const [transaction] = await db
      .insert(transactions)
      .values({
        bookingId: validated.bookingId,
        userId: session.userId,
        pesapalReference: validated.pesapalReference,
        merchantReference: validated.merchantReference,
        amount: validated.amount,
        status: validated.status,
        paymentMethod: validated.paymentMethod,
      })
      .returning();

    return { success: true, transaction };
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    if (error.name === "ZodError") {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to create transaction" };
  }
}

export async function getUserPayments() {
  try {
    const session = await requireAuth();

    const userPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.userId, session.userId));

    return { success: true, payments: userPayments };
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    return { error: "Failed to fetch payments" };
  }
}

export async function getUserTransactions() {
  try {
    const session = await requireAuth();

    const userTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, session.userId));

    return { success: true, transactions: userTransactions };
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    return { error: "Failed to fetch transactions" };
  }
}

export async function updatePaymentStatus(
  paymentId: string,
  status: string,
  message?: string
) {
  try {
    await requireAuth();

    await db
      .update(payments)
      .set({ status })
      .where(eq(payments.id, paymentId));

    if (message) {
      await db.insert(paymentLogs).values({
        paymentId,
        status: status as any,
        message,
      });
    }

    return { success: true };
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    return { error: "Failed to update payment status" };
  }
}

export async function updateTransactionStatus(
  transactionId: string,
  status: string
) {
  try {
    await requireAuth();

    await db
      .update(transactions)
      .set({ status, updated: new Date() })
      .where(eq(transactions.id, transactionId));

    return { success: true };
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    return { error: "Failed to update transaction status" };
  }
}

// Get All Payments (Admin)
export async function getAllPayments() {
  try {
    await requireAuth();

    const allPayments = await db
      .select()
      .from(payments)
      .orderBy(payments.created);

    return { success: true, payments: allPayments };
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    return { error: "Failed to fetch payments" };
  }
}

// Get All Transactions (Admin)
export async function getAllTransactions() {
  try {
    await requireAuth();

    const allTransactions = await db
      .select()
      .from(transactions)
      .orderBy(transactions.created);

    return { success: true, transactions: allTransactions };
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    return { error: "Failed to fetch transactions" };
  }
}


