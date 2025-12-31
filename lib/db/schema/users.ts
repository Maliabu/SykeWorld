import { pgTable, text, boolean, timestamp, varchar, date, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

const createdAt = timestamp('created_at').notNull().defaultNow()
const updatedAt = timestamp('updated_at')
  .notNull()
  .$onUpdate(() => new Date())

export const userTypeEnum = pgEnum("user_type", ["guest", "staff", "admin"]);
export const genderEnum = pgEnum("gender", ["male", "female"]);

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: varchar("email", { length: 255 }).notNull().unique(),
  username: varchar("username", { length: 150 }).notNull(),
  password: text("password").notNull(),
  firstName: varchar("first_name", { length: 150 }),
  lastName: varchar("last_name", { length: 150 }),
  userType: userTypeEnum("user_type").notNull().default("guest"),
  phone: varchar("phone", { length: 20 }).unique(),
  gender: genderEnum("gender"),
  address: varchar("address", { length: 255 }),
  profilePicture: text("profile_picture").default("default.jpg"),
  birthDate: date("birth_date"),
  isVerified: boolean("is_verified").notNull().default(false),
  isDisabled: boolean("is_disabled").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  isStaff: boolean("is_staff").notNull().default(false),
  isLoggedIn: boolean('is_logged_in').notNull().default(false),
  isSuperuser: boolean("is_superuser").notNull().default(false),
  dateJoined: timestamp("date_joined").notNull().defaultNow(),
  lastLogin: timestamp("last_login"),
  createdAt,
  updatedAt
});

export const usersRelations = relations(users, ({ many }) => ({
  contactMessages: many(contactMessages),
}));

export const contactMessages = pgTable("contact_messages", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  message: text("message").notNull(),
  createdAt,
  updatedAt
});

export const contactMessagesRelations = relations(contactMessages, ({ one }) => ({
  user: one(users, {
    fields: [contactMessages.email],
    references: [users.email],
  }),
}));

export const userRelations = relations(users, ({many}) => ({
  activity: many(activityTable)
}))

export const activityTable = pgTable('activity', {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  user: text("user_id").notNull().references(() => users.id, {onDelete: 'cascade'}),
  activity: text('value').notNull(),
    createdAt,
    updatedAt,
});

export const activityRelations = relations(activityTable, ({ one }) => ({
	users: one(users, { fields: [activityTable.user], references: [users.id] }),
}));

// db/schema.ts
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
