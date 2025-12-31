import {
  pgTable,
  text,
  varchar,
  decimal,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "processing",
  "success",
  "failed",
  "refunded",
]);

export const payments = pgTable("payments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  bookingId: text("booking_id").notNull(),
  userId: text("user_id").notNull(),
  pesapalOrderTrackingId: varchar("pesapal_order_tracking_id", {
    length: 255,
  }),
  pesapalMerchantReference: varchar("pesapal_merchant_reference", {
    length: 255,
  }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("PENDING"),
  created: timestamp("created").notNull().defaultNow(),
});

export const paymentLogs = pgTable("payment_logs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  paymentId: text("payment_id")
    .notNull()
    .references(() => payments.id, { onDelete: "cascade" }),
  status: paymentStatusEnum("status").notNull(),
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  bookingId: text("booking_id").notNull(),
  userId: text("user_id").notNull(),
  pesapalReference: varchar("pesapal_reference", { length: 200 })
    .notNull()
    .unique(),
  merchantReference: varchar("merchant_reference", { length: 200 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("PENDING"),
  paymentMethod: varchar("payment_method", { length: 50 }),
  created: timestamp("created").notNull().defaultNow(),
  updated: timestamp("updated").notNull().defaultNow(),
});

export const paymentsRelations = relations(payments, ({ many }) => ({
  logs: many(paymentLogs),
}));

export const paymentLogsRelations = relations(paymentLogs, ({ one }) => ({
  payment: one(payments, {
    fields: [paymentLogs.paymentId],
    references: [payments.id],
  }),
}));

export const transactionsRelations = relations(transactions, () => ({}));

