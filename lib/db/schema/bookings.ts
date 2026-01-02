// db/schema.ts
import {
  pgTable,
  text,
  varchar,
  integer,
  decimal,
  timestamp,
  date,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* ================================
   SHARED TIMESTAMPS
================================ */

const createdAt = timestamp("created_at").notNull().defaultNow();
const updatedAt = timestamp("updated_at")
  .notNull()
  .$onUpdate(() => new Date());

/* ================================
   ENUMS
================================ */

export const roomStatusEnum = pgEnum("room_status", [
  "available",
  "occupied",
  "cleaning",
  "maintenance",
  "unavailable",
]);

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "checked_in",
  "checked_out",
  "cancelled",
]);

/* ================================
   ROOM SERVICES
================================ */

export const roomServices = pgTable("room_services", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  icon: text("icon"),
});

/* ================================
   ROOM TYPES
================================ */

/* ================================
   ROOM TYPE SERVICES
   (many-to-many)
================================ */

export const roomTypeServices = pgTable("room_type_services", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),

  roomTypeId: text("room_type_id")
    .notNull()
    .references(() => roomTypes.id, { onDelete: "cascade" }),

  roomServiceId: text("room_service_id")
    .notNull()
    .references(() => roomServices.id, { onDelete: "cascade" }),

  createdAt,
  updatedAt,
});

/* ================================
   ROOMS
================================ */

/* ================================
   ROOM IMAGES
================================ */
/* ================================
   BOOKINGS
================================ */

export const bookings = pgTable("bookings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),

  userId: text("user_id").notNull(),

  roomId: text("room_id")
    .notNull()
    .references(() => rooms.id, { onDelete: "restrict" }),

  checkIn: date("check_in"),
  checkOut: date("check_out"),
  guests: integer("guests").notNull().default(1),

  specialRequests: text("special_requests"),

  totalPrice: decimal("total_price", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),

  status: bookingStatusEnum("status").notNull().default("pending"),

  createdAt,
  updatedAt,
});

/* ================================
   ROOM REVIEWS
================================ */

export const roomReviews = pgTable("room_reviews", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),

  roomId: text("room_id")
    .notNull()
    .references(() => rooms.id, { onDelete: "cascade" }),

  userId: text("user_id").notNull(),
  stars: integer("stars").notNull(),
  comment: text("comment"),

  createdAt,
  updatedAt,
});

/* ================================
   SUBSCRIPTIONS
================================ */

export const subscriptions = pgTable("subscriptions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  createdAt,
  updatedAt,
});

/* ================================
   GALLERY CATEGORIES
================================ */

export const galleryCategories = pgTable("gallery_categories", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  createdAt,
  updatedAt,
});

/* ================================
   GALLERY IMAGES
================================ */

export const galleryImages = pgTable("gallery_images", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),

  categoryId: text("category_id")
    .notNull()
    .references(() => galleryCategories.id, { onDelete: "cascade" }),

  image: text("image").notNull(),
  caption: varchar("caption", { length: 255 }),

  createdAt,
  updatedAt,
});
export const roomTypes = pgTable("room_types", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  maxGuests: integer("max_guests").notNull(),
  created: timestamp("created").notNull().defaultNow(), // matches your DB
});

/* ================================
   ROOMS
================================ */

export const rooms = pgTable("rooms", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  roomNumber: varchar("room_number", { length: 50 }).notNull(),
  roomTypeId: text("room_type_id")
    .notNull()
    .references(() => roomTypes.id),
  floor: integer("floor").notNull(),
  status: roomStatusEnum("status").notNull(),
  bookingCount: integer("booking_count").notNull().default(0), // Tracks how many times room has been booked
  created: timestamp("created").notNull().defaultNow(), // matches DB
});

/* ================================
   ROOM IMAGES
================================ */

export const roomImages = pgTable("room_images", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  roomId: text("room_id")
    .notNull()
    .references(() => rooms.id, { onDelete: "cascade" }),
  image: text("image").notNull(),
  caption: varchar("caption", { length: 255 }),
  createdAt,
  updatedAt,
});

/* ================================
   RELATIONS
================================ */

/* ================================
   TYPES
================================ */

export type InsertRoomType = typeof roomTypes.$inferInsert;
export type SelectRoomType = typeof roomTypes.$inferSelect;

export type InsertRoom = typeof rooms.$inferInsert;
export type SelectRoom = typeof rooms.$inferSelect;

export type InsertRoomImage = typeof roomImages.$inferInsert;
export type SelectRoomImage = typeof roomImages.$inferSelect;

/* ================================
   RELATIONS
================================ */

export const roomTypesRelations = relations(roomTypes, ({ many }) => ({
  rooms: many(rooms),
  services: many(roomTypeServices),
}));

export const roomTypeServicesRelations = relations(
  roomTypeServices,
  ({ one }) => ({
    roomType: one(roomTypes, {
      fields: [roomTypeServices.roomTypeId],
      references: [roomTypes.id],
    }),
    service: one(roomServices, {
      fields: [roomTypeServices.roomServiceId],
      references: [roomServices.id],
    }),
  })
);

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  roomType: one(roomTypes, {
    fields: [rooms.roomTypeId],
    references: [roomTypes.id],
  }),

  images: many(roomImages),
  bookings: many(bookings),
  reviews: many(roomReviews),
}));

export const roomImagesRelations = relations(roomImages, ({ one }) => ({
  room: one(rooms, {
    fields: [roomImages.roomId],
    references: [rooms.id],
  }),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  room: one(rooms, {
    fields: [bookings.roomId],
    references: [rooms.id],
  }),
}));

export const roomReviewsRelations = relations(roomReviews, ({ one }) => ({
  room: one(rooms, {
    fields: [roomReviews.roomId],
    references: [rooms.id],
  }),
}));

export const galleryCategoriesRelations = relations(
  galleryCategories,
  ({ many }) => ({
    images: many(galleryImages),
  })
);

export const galleryImagesRelations = relations(galleryImages, ({ one }) => ({
  category: one(galleryCategories, {
    fields: [galleryImages.categoryId],
    references: [galleryCategories.id],
  }),
}));

/* ================================
   TYPES (ALL TABLES)
================================ */

export type InsertRoomService = typeof roomServices.$inferInsert;
export type SelectRoomService = typeof roomServices.$inferSelect;

export type InsertRoomTypeService = typeof roomTypeServices.$inferInsert;
export type SelectRoomTypeService = typeof roomTypeServices.$inferSelect;

export type InsertBooking = typeof bookings.$inferInsert;
export type SelectBooking = typeof bookings.$inferSelect;

export type InsertRoomReview = typeof roomReviews.$inferInsert;
export type SelectRoomReview = typeof roomReviews.$inferSelect;

export type InsertSubscription = typeof subscriptions.$inferInsert;
export type SelectSubscription = typeof subscriptions.$inferSelect;

export type InsertGalleryCategory = typeof galleryCategories.$inferInsert;
export type SelectGalleryCategory = typeof galleryCategories.$inferSelect;

export type InsertGalleryImage = typeof galleryImages.$inferInsert;
export type SelectGalleryImage = typeof galleryImages.$inferSelect;
