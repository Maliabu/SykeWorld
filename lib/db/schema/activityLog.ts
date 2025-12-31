import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { users } from "./users";

export const activityLogs = pgTable("activity_logs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  action: varchar("action", { length: 100 }).notNull(), // e.g., "CREATE_ROOM", "DELETE_USER", "UPDATE_BOOKING"
  entityType: varchar("entity_type", { length: 100 }).notNull(), // e.g., "room", "user", "booking"
  entityId: text("entity_id"), // ID of the affected entity
  description: text("description").notNull(), // Human-readable description
  metadata: text("metadata"), // JSON string for additional data
  ipAddress: varchar("ip_address", { length: 45 }), // IPv4 or IPv6
  userAgent: text("user_agent"), // Browser/client info
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type InsertActivityLog = typeof activityLogs.$inferInsert;
export type SelectActivityLog = typeof activityLogs.$inferSelect;



