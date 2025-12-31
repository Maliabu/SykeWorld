import {
  pgTable,
  text,
  varchar,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { roles } from "./staff";

const createdAt = timestamp("created_at").notNull().defaultNow();
const updatedAt = timestamp("updated_at")
  .notNull()
  .$onUpdate(() => new Date());

// Permission definitions (pages/features)
export const permissionDefinitions = pgTable("permission_definitions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }).notNull().unique(), // e.g., "pos_menu_categories", "pos_menu_items"
  displayName: varchar("display_name", { length: 255 }).notNull(), // e.g., "POS Menu Categories"
  description: text("description"),
  pagePath: varchar("page_path", { length: 500 }), // e.g., "/admin/dashboard/pos/menu-categories"
  category: varchar("category", { length: 255 }), // e.g., "POS", "Rooms", "Bookings"
  isActive: boolean("is_active").notNull().default(true),
  createdAt,
  updatedAt,
});

// User permissions (direct assignment to users)
export const userPermissions = pgTable("user_permissions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  permissionId: text("permission_id")
    .notNull()
    .references(() => permissionDefinitions.id, { onDelete: "cascade" }),
  grantedBy: text("granted_by")
    .references(() => users.id, { onDelete: "set null" }), // Admin who granted this
  createdAt,
  updatedAt,
});

// Role permissions (assignment to roles)
export const rolePermissions = pgTable("role_permissions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  roleId: text("role_id")
    .notNull()
    .references(() => roles.id, { onDelete: "cascade" }),
  permissionId: text("permission_id")
    .notNull()
    .references(() => permissionDefinitions.id, { onDelete: "cascade" }),
  grantedBy: text("granted_by")
    .references(() => users.id, { onDelete: "set null" }),
  createdAt,
  updatedAt,
});

// Permission requests (users requesting access)
export const permissionRequests = pgTable("permission_requests", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  permissionId: text("permission_id")
    .notNull()
    .references(() => permissionDefinitions.id, { onDelete: "cascade" }),
  reason: text("reason"), // Why they need access
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, approved, rejected
  reviewedBy: text("reviewed_by")
    .references(() => users.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  createdAt,
  updatedAt,
});

// Relations
export const permissionDefinitionsRelations = relations(permissionDefinitions, ({ many }) => ({
  userPermissions: many(userPermissions),
  rolePermissions: many(rolePermissions),
  permissionRequests: many(permissionRequests),
}));

export const userPermissionsRelations = relations(userPermissions, ({ one }) => ({
  user: one(users, {
    fields: [userPermissions.userId],
    references: [users.id],
  }),
  permission: one(permissionDefinitions, {
    fields: [userPermissions.permissionId],
    references: [permissionDefinitions.id],
  }),
  grantedByUser: one(users, {
    fields: [userPermissions.grantedBy],
    references: [users.id],
  }),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissionDefinitions, {
    fields: [rolePermissions.permissionId],
    references: [permissionDefinitions.id],
  }),
  grantedByUser: one(users, {
    fields: [rolePermissions.grantedBy],
    references: [users.id],
  }),
}));

export const permissionRequestsRelations = relations(permissionRequests, ({ one }) => ({
  user: one(users, {
    fields: [permissionRequests.userId],
    references: [users.id],
  }),
  permission: one(permissionDefinitions, {
    fields: [permissionRequests.permissionId],
    references: [permissionDefinitions.id],
  }),
  reviewer: one(users, {
    fields: [permissionRequests.reviewedBy],
    references: [users.id],
  }),
}));

