import {
  pgTable,
  text,
  varchar,
  decimal,
  timestamp,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";

const createdAt = timestamp("created_at").notNull().defaultNow();
const updatedAt = timestamp("updated_at")
  .notNull()
  .$onUpdate(() => new Date());

// Menu Categories (e.g., Starters, Main Course, Desserts)
export const menuCategories = pgTable("menu_categories", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt,
  updatedAt,
});

// Menu Items (Dishes)
export const menuItems = pgTable("menu_items", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  categoryId: text("category_id")
    .notNull()
    .references(() => menuCategories.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  localName: varchar("local_name", { length: 255 }), // Optional local name
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  image: text("image"), // URL or path to image
  isAvailable: boolean("is_available").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt,
  updatedAt,
});

// Drink Categories (e.g., Soft Drinks, Alcoholic, Hot Beverages)
export const drinkCategories = pgTable("drink_categories", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt,
  updatedAt,
});

// Drinks
export const drinks = pgTable("drinks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  categoryId: text("category_id")
    .notNull()
    .references(() => drinkCategories.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  localName: varchar("local_name", { length: 255 }), // Optional local name
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  image: text("image"), // URL or path to image
  isAvailable: boolean("is_available").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt,
  updatedAt,
});

// POS Orders (for storing receipts)
export const posOrders = pgTable("pos_orders", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  items: text("items").notNull(), // JSON string of items
  receiptData: text("receipt_data"), // JSON string of receipt data
  isPrinted: boolean("is_printed").notNull().default(false),
  createdAt,
  updatedAt,
});

// Relations
export const menuCategoriesRelations = relations(menuCategories, ({ many }) => ({
  menuItems: many(menuItems),
}));

export const menuItemsRelations = relations(menuItems, ({ one }) => ({
  category: one(menuCategories, {
    fields: [menuItems.categoryId],
    references: [menuCategories.id],
  }),
}));

export const drinkCategoriesRelations = relations(drinkCategories, ({ many }) => ({
  drinks: many(drinks),
}));

export const drinksRelations = relations(drinks, ({ one }) => ({
  category: one(drinkCategories, {
    fields: [drinks.categoryId],
    references: [drinkCategories.id],
  }),
}));

export const posOrdersRelations = relations(posOrders, ({ one }) => ({
  user: one(users, {
    fields: [posOrders.userId],
    references: [users.id],
  }),
}));

