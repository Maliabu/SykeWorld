import {
  pgTable,
  text,
  varchar,
  boolean,
  date,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roles = pgTable("roles", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"), // Note: In Django model this was ForeignKey to Room, which seems wrong. Using text instead.
});

export const staffProfiles = pgTable("staff_profiles", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().unique(),
  roleId: text("role_id")
    .notNull()
    .references(() => roles.id, { onDelete: "cascade" }),
  active: boolean("active").notNull().default(true),
  hiredDate: date("hired_date").notNull().defaultNow(),
});

export const taskStatuses = pgTable("task_statuses", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  status: varchar("status", { length: 255 }).notNull().default("pending"),
});

export const staffTasks = pgTable("staff_tasks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  staffId: text("staff_id")
    .notNull()
    .references(() => staffProfiles.id, { onDelete: "cascade" }),
  roomId: text("room_id"),
  title: varchar("title", { length: 255 }).notNull(),
  details: text("details"),
  assignedDate: timestamp("assigned_date").notNull().defaultNow(),
  dueDate: date("due_date"),
  statusId: text("status_id")
    .notNull()
    .references(() => taskStatuses.id, { onDelete: "cascade" }),
});

export const permissions = pgTable("permissions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }).notNull(),
  roleId: text("role_id").references(() => roles.id, { onDelete: "cascade" }),
});

export const rolesRelations = relations(roles, ({ many }) => ({
  staffProfiles: many(staffProfiles),
  permissions: many(permissions),
}));

export const staffProfilesRelations = relations(staffProfiles, ({ one, many }) => ({
  role: one(roles, {
    fields: [staffProfiles.roleId],
    references: [roles.id],
  }),
  tasks: many(staffTasks),
}));

export const staffTasksRelations = relations(staffTasks, ({ one }) => ({
  staff: one(staffProfiles, {
    fields: [staffTasks.staffId],
    references: [staffProfiles.id],
  }),
  status: one(taskStatuses, {
    fields: [staffTasks.statusId],
    references: [taskStatuses.id],
  }),
}));

export const taskStatusesRelations = relations(taskStatuses, ({ many }) => ({
  tasks: many(staffTasks),
}));

export const permissionsRelations = relations(permissions, ({ one }) => ({
  role: one(roles, {
    fields: [permissions.roleId],
    references: [roles.id],
  }),
}));

