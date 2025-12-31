"use server";

import { db } from "@/lib/db";
import {
  roomTypes,
  rooms,
  roomImages,
  bookings,
  roomReviews,
  roomServices,
  roomTypeServices,
  subscriptions,
  galleryCategories,
  galleryImages,
} from "@/lib/db/schema";
import { users } from "@/lib/db/schema/users";
import {
  createRoomTypeSchema,
  createRoomSchema,
  createBookingSchema,
  createDashboardBookingSchema,
  createReviewSchema,
  checkAvailabilitySchema,
  subscribeSchema,
} from "@/lib/validations/bookings";
import { eq, and, or, gte, lte, sql, inArray } from "drizzle-orm";
import { requireAuth, getSession } from "@/lib/auth/session";
import { z } from "zod";
import { logActivity } from "@/lib/utils/activityLog";
import { sendBookingReceipt } from "@/mail/nodemailer";
import { notifyAllAdmins } from "@/lib/actions/notifications";

export async function getAllRooms() {
  try {
    const allRooms = await db
      .select({
        id: rooms.id,
        roomNumber: rooms.roomNumber,
        floor: rooms.floor,
        status: rooms.status,
        roomType: {
          id: roomTypes.id,
          name: roomTypes.name,
          description: roomTypes.description,
          basePrice: roomTypes.basePrice,
          maxGuests: roomTypes.maxGuests,
        },
      })
      .from(rooms)
      .innerJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id));

    // If no rooms, return empty array
    if (!allRooms || allRooms.length === 0) {
      return { success: true, rooms: [] };
    }

    // Get images and services for each room
    const roomsWithImages = await Promise.all(
      allRooms.map(async (room) => {
        try {
          const images = await db
            .select()
            .from(roomImages)
            .where(eq(roomImages.roomId, room.id));

          // Get services for room type
          let services: any[] = [];
          try {
            const serviceIds = await db
              .select({ serviceId: roomTypeServices.roomServiceId })
              .from(roomTypeServices)
              .where(eq(roomTypeServices.roomTypeId, room.roomType.id));

            if (serviceIds.length > 0) {
              const serviceIdValues = serviceIds.map((s) => s.serviceId);
              services = await db
                .select()
                .from(roomServices)
                .where(inArray(roomServices.id, serviceIdValues));
            }
          } catch (serviceError) {
            console.error("Error fetching services for room:", serviceError);
            // Continue without services if there's an error
          }

          return {
            ...room,
            images: images || [],
            services: services || [],
          };
        } catch (roomError) {
          console.error(`Error processing room ${room.id}:`, roomError);
          // Return room without images/services if there's an error
          return {
            ...room,
            images: [],
            services: [],
          };
        }
      })
    );

    return { success: true, rooms: roomsWithImages };
  } catch (error: any) {
    console.error("getAllRooms error:", error);
    return { 
      error: error?.message || "Failed to fetch rooms",
      details: error?.stack 
    };
  }
}

export async function getRoomById(roomId: string) {
  try {
    const [room] = await db
      .select({
        id: rooms.id,
        roomNumber: rooms.roomNumber,
        floor: rooms.floor,
        status: rooms.status,
        roomType: {
          id: roomTypes.id,
          name: roomTypes.name,
          description: roomTypes.description,
          basePrice: roomTypes.basePrice,
          maxGuests: roomTypes.maxGuests,
        },
      })
      .from(rooms)
      .innerJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id))
      .where(eq(rooms.id, roomId))
      .limit(1);

    if (!room) {
      return { error: "Room not found" };
    }

    const images = await db
      .select()
      .from(roomImages)
      .where(eq(roomImages.roomId, room.id));

    const serviceIds = await db
      .select({ serviceId: roomTypeServices.roomServiceId })
      .from(roomTypeServices)
      .where(eq(roomTypeServices.roomTypeId, room.roomType.id));

    const services = serviceIds.length > 0
      ? await db
          .select()
          .from(roomServices)
          .where(
            sql`${roomServices.id} IN (${sql.join(
              serviceIds.map((s) => sql`${s.serviceId}`),
              sql`, `
            )})`
          )
      : [];

    return {
      success: true,
      room: {
        ...room,
        images,
        services,
      },
    };
  } catch (error) {
    return { error: "Failed to fetch room" };
  }
}

export async function getAllServices() {
  try {
    const services = await db.select().from(roomServices);
    return { success: true, services };
  } catch (error) {
    return { error: "Failed to fetch services" };
  }
}

export async function createRoomType(data: unknown) {
  try {
    await requireAuth();
    const validated = createRoomTypeSchema.parse(data);

    const [roomType] = await db
      .insert(roomTypes)
      .values({
        name: validated.name,
        description: validated.description,
        basePrice: validated.basePrice,
        maxGuests: validated.maxGuests,
      })
      .returning();

    // Log activity
    await logActivity({
      action: "CREATE_ROOM_TYPE",
      entityType: "room_type",
      entityId: roomType.id,
      description: `Created room type: ${validated.name}`,
      metadata: { name: validated.name, basePrice: validated.basePrice },
    });

    return { success: true, roomType };
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    if (error.name === "ZodError") {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to create room type" };
  }
}

export async function createRoom(data: unknown) {
  try {
    await requireAuth();
    const validated = createRoomSchema.parse(data);

    const [room] = await db
      .insert(rooms)
      .values({
        roomNumber: validated.roomNumber,
        roomTypeId: validated.roomTypeId,
        floor: validated.floor,
        status: validated.status,
      })
      .returning();

    // Log activity
    await logActivity({
      action: "CREATE_ROOM",
      entityType: "room",
      entityId: room.id,
      description: `Created room: ${validated.roomNumber}`,
      metadata: { roomNumber: validated.roomNumber, floor: validated.floor },
    });

    return { success: true, room };
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    if (error.name === "ZodError") {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to create room" };
  }
}

export async function addRoomImage(roomId: string, imageUrl: string, caption?: string) {
  try {
    await requireAuth();
    
    if (!roomId || !imageUrl) {
      return { error: "Room ID and image URL are required" };
    }

    const [image] = await db
      .insert(roomImages)
      .values({
        roomId,
        image: imageUrl,
        caption: caption || null,
      })
      .returning();

    return { success: true, image };
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    return { error: "Failed to add room image" };
  }
}

export async function getAllRoomTypes() {
  try {
    const types = await db.select().from(roomTypes);
    return { success: true, roomTypes: types };
  } catch (error) {
    return { error: "Failed to fetch room types" };
  }
}

export async function createRoomService(data: unknown) {
  try {
    await requireAuth();
    const validated = z.object({
      name: z.string().min(1, "Name is required"),
      description: z.string().optional(),
      icon: z.string().optional(),
    }).parse(data);

    const [service] = await db
      .insert(roomServices)
      .values({
        name: validated.name,
        description: validated.description || null,
        icon: validated.icon || null,
      })
      .returning();

    return { success: true, service };
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    if (error.name === "ZodError") {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to create service" };
  }
}

export async function createBooking(data: unknown) {
  try {
    // Try to get session (works with custom JWT session)
    const session = await getSession();
    const validated = createBookingSchema.parse(data);
    
    // If no custom session, user might be signed in via NextAuth
    // But we need a userId to create the booking, so we require authentication
    if (!session) {
      return { error: "Please sign in to create a booking. If you're already signed in, please try signing out and signing in again." };
    }

    // Check if room exists and is available
    const [room] = await db
      .select()
      .from(rooms)
      .where(eq(rooms.id, validated.roomId))
      .limit(1);

    if (!room) return { error: "Room not found" };
    if (room.status !== "available") return { error: "Room is not available" };

    // Convert Dates to YYYY-MM-DD strings for PgDateString columns
    const checkInStr = new Date(validated.checkIn).toISOString().split("T")[0];
    const checkOutStr = new Date(validated.checkOut).toISOString().split("T")[0];

    // Check for overlapping bookings
    const overlappingBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.roomId, validated.roomId),
          eq(bookings.status, "confirmed"),
          or(
            and(gte(bookings.checkIn, checkInStr), lte(bookings.checkIn, checkOutStr)),
            and(gte(bookings.checkOut, checkInStr), lte(bookings.checkOut, checkOutStr)),
            and(lte(bookings.checkIn, checkInStr), gte(bookings.checkOut, checkOutStr))
          )
        )
      );

    if (overlappingBookings.length > 0) return { error: "Room is already booked for these dates" };

    // Get room type for pricing
    const [roomType] = await db
      .select()
      .from(roomTypes)
      .where(eq(roomTypes.id, room.roomTypeId))
      .limit(1);

    if (!roomType) return { error: "Room type not found" };

    // Calculate total price
    const nights = Math.ceil(
      (new Date(validated.checkOut).getTime() - new Date(validated.checkIn).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const totalPrice = (parseFloat(roomType.basePrice) * nights).toFixed(2);

    // Create booking
    const [booking] = await db
      .insert(bookings)
      .values({
        userId: session.userId,
        roomId: validated.roomId,
        checkIn: checkInStr,
        checkOut: checkOutStr,
        guests: validated.guests,
        specialRequests: validated.specialRequests,
        totalPrice,
        status: "pending",
      })
      .returning();

    // Get user details for notification
    const [customer] = await db
      .select({
        firstName: users.firstName,
        lastName: users.lastName,
        username: users.username,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    const customerName = customer?.firstName && customer?.lastName
      ? `${customer.firstName} ${customer.lastName}`
      : customer?.username || customer?.email?.split("@")[0] || "Guest";

    // Notify all admins about the new booking
    try {
      await notifyAllAdmins(
        "New Booking Created",
        `A new booking has been created by ${customerName} (${customer?.email || "N/A"}) for Room ${room.roomNumber} from ${checkInStr} to ${checkOutStr}.`,
        session.userId
      );
    } catch (notificationError) {
      // Don't fail booking creation if notification fails
      console.error("Failed to send booking notification to admins:", notificationError);
    }

    return { success: true, booking };
  } catch (error: any) {
    if (error.message === "Unauthorized") return { error: "Unauthorized" };
    if (error.name === "ZodError") return { error: error.errors[0].message };
    console.error(error);
    return { error: "Failed to create booking" };
  }
}

export async function getUserBookings() {
  try {
    const session = await requireAuth();

    const userBookings = await db
      .select({
        id: bookings.id,
        checkIn: bookings.checkIn,
        checkOut: bookings.checkOut,
        guests: bookings.guests,
        specialRequests: bookings.specialRequests,
        totalPrice: bookings.totalPrice,
        status: bookings.status,
        created: bookings.createdAt,
        room: {
          id: rooms.id,
          roomNumber: rooms.roomNumber,
          floor: rooms.floor,
          status: rooms.status,
        },
        roomType: {
          id: roomTypes.id,
          name: roomTypes.name,
          basePrice: roomTypes.basePrice,
        },
      })
      .from(bookings)
      .innerJoin(rooms, eq(bookings.roomId, rooms.id))
      .innerJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id))
      .where(eq(bookings.userId, session.userId));

    return { success: true, bookings: userBookings };
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    return { error: "Failed to fetch bookings" };
  }
}

export async function checkAvailability(data: unknown) {
  try {
    const validated = checkAvailabilitySchema.parse(data);
    const checkIn = new Date(validated.checkIn);
    const checkOut = new Date(validated.checkOut);
    const checkInStr = checkIn.toISOString().split("T")[0];
    const checkOutStr = checkOut.toISOString().split("T")[0];

    // Get all rooms or filter by room type
    let allRooms;
    if (validated.roomTypeId) {
      allRooms = await db
        .select({
          id: rooms.id,
          roomNumber: rooms.roomNumber,
          floor: rooms.floor,
          status: rooms.status,
          roomType: {
            id: roomTypes.id,
            name: roomTypes.name,
            description: roomTypes.description,
            basePrice: roomTypes.basePrice,
            maxGuests: roomTypes.maxGuests,
          },
        })
        .from(rooms)
        .innerJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id))
        .where(
          and(
            eq(rooms.status, "available"),
            eq(roomTypes.id, validated.roomTypeId)
          )
        );
    } else {
      allRooms = await db
        .select({
          id: rooms.id,
          roomNumber: rooms.roomNumber,
          floor: rooms.floor,
          status: rooms.status,
          roomType: {
            id: roomTypes.id,
            name: roomTypes.name,
            description: roomTypes.description,
            basePrice: roomTypes.basePrice,
            maxGuests: roomTypes.maxGuests,
          },
        })
        .from(rooms)
        .innerJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id))
        .where(eq(rooms.status, "available"));
    }

    // Filter out rooms with overlapping bookings
    const availableRooms = await Promise.all(
      allRooms.map(async (room) => {
        const overlappingBookings = await db
          .select()
          .from(bookings)
          .where(
            and(
              eq(bookings.roomId, room.id),
              or(
                eq(bookings.status, "confirmed"),
                eq(bookings.status, "checked_in")
              ),
              or(
                and(
                  gte(bookings.checkIn, checkInStr),
                  lte(bookings.checkIn, checkOutStr)
                ),
                and(
                  gte(bookings.checkOut, checkInStr),
                  lte(bookings.checkOut, checkOutStr)
                ),
                and(
                  lte(bookings.checkIn, checkInStr),
                  gte(bookings.checkOut, checkOutStr)
                )
              )
            )
          );

        return overlappingBookings.length === 0 ? room : null;
      })
    );

    const filtered = availableRooms.filter((room) => room !== null) as typeof allRooms;

    return { success: true, rooms: filtered };
  } catch (error: any) {
    if (error.name === "ZodError") {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to check availability" };
  }
}

export async function createReview(data: unknown) {
  try {
    const session = await requireAuth();
    const validated = createReviewSchema.parse(data);

    // Check if user has a completed booking for this room
    const [completedBooking] = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.userId, session.userId),
          eq(bookings.roomId, validated.roomId),
          or(eq(bookings.status, "checked_out"), eq(bookings.status, "confirmed"))
        )
      )
      .limit(1);

    if (!completedBooking) {
      return { error: "You must have a completed booking to review this room" };
    }

    const [review] = await db
      .insert(roomReviews)
      .values({
        roomId: validated.roomId,
        userId: session.userId,
        stars: validated.stars,
        comment: validated.comment,
      })
      .returning();

    return { success: true, review };
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    if (error.name === "ZodError") {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to create review" };
  }
}

export async function getRoomReviews(roomId: string) {
  try {
    const reviews = await db
      .select({
        id: roomReviews.id,
        stars: roomReviews.stars,
        comment: roomReviews.comment,
        created: roomReviews.createdAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(roomReviews)
      .innerJoin(users, eq(roomReviews.userId, users.id))
      .where(eq(roomReviews.roomId, roomId));

    return { success: true, reviews };
  } catch (error) {
    return { error: "Failed to fetch reviews" };
  }
}

export async function subscribe(data: unknown) {
  try {
    const validated = subscribeSchema.parse(data);

    // Check if email already subscribed
    const [existing] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.email, validated.email))
      .limit(1);

    if (existing) {
      return { error: "Email already subscribed" };
    }

    const [subscription] = await db
      .insert(subscriptions)
      .values({
        name: validated.name,
        email: validated.email,
      })
      .returning();

    return { success: true, subscription };
  } catch (error: any) {
    if (error.name === "ZodError") {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to subscribe" };
  }
}

export async function getAllGalleryCategories() {
  try {
    const categories = await db.select().from(galleryCategories);
    return { success: true, categories };
  } catch (error) {
    return { error: "Failed to fetch gallery categories" };
  }
}

export async function getGalleryImages(categoryId?: string) {
  try {
    let query = db
      .select({
        id: galleryImages.id,
        image: galleryImages.image,
        caption: galleryImages.caption,
        created: galleryImages.createdAt,
        category: {
          id: galleryCategories.id,
          name: galleryCategories.name,
          description: galleryCategories.description,
        },
      })
      .from(galleryImages)
      .innerJoin(
        galleryCategories,
        eq(galleryImages.categoryId, galleryCategories.id)
      );

    if (categoryId) {
      query = query.where(eq(galleryImages.categoryId, categoryId)) as any;
    }

    const images = await query;
    return { success: true, images };
  } catch (error) {
    return { error: "Failed to fetch gallery images" };
  }
}

// Update Room
export async function updateRoom(roomId: string, data: unknown) {
  try {
    await requireAuth();
    const validated = createRoomSchema.partial().parse(data);

    const [updated] = await db
      .update(rooms)
      .set(validated)
      .where(eq(rooms.id, roomId))
      .returning();

    // Log activity
    await logActivity({
      action: "UPDATE_ROOM",
      entityType: "room",
      entityId: roomId,
      description: `Updated room: ${updated.roomNumber}`,
      metadata: validated,
    });

    return { success: true, room: updated };
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    if (error.name === "ZodError") {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to update room" };
  }
}

// Delete Room
export async function deleteRoom(roomId: string) {
  try {
    await requireAuth();

    // Get room info before deleting for logging
    const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId)).limit(1);
    
    await db.delete(rooms).where(eq(rooms.id, roomId));

    // Log activity
    if (room) {
      await logActivity({
        action: "DELETE_ROOM",
        entityType: "room",
        entityId: roomId,
        description: `Deleted room: ${room.roomNumber}`,
        metadata: { roomNumber: room.roomNumber },
      });
    }

    return { success: true };
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    return { error: "Failed to delete room" };
  }
}

// Update Room Type
export async function updateRoomType(roomTypeId: string, data: unknown) {
  try {
    await requireAuth();
    const validated = createRoomTypeSchema.partial().parse(data);

    const [updated] = await db
      .update(roomTypes)
      .set(validated)
      .where(eq(roomTypes.id, roomTypeId))
      .returning();

    return { success: true, roomType: updated };
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    if (error.name === "ZodError") {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to update room type" };
  }
}

// Delete Room Type
export async function deleteRoomType(roomTypeId: string) {
  try {
    await requireAuth();

    await db.delete(roomTypes).where(eq(roomTypes.id, roomTypeId));

    return { success: true };
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    return { error: "Failed to delete room type" };
  }
}

// Update Room Service
export async function updateRoomService(serviceId: string, data: unknown) {
  try {
    await requireAuth();
    const validated = z.object({
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      icon: z.string().optional(),
    }).parse(data);

    const [updated] = await db
      .update(roomServices)
      .set(validated)
      .where(eq(roomServices.id, serviceId))
      .returning();

    return { success: true, service: updated };
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    if (error.name === "ZodError") {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to update service" };
  }
}

// Delete Room Service
export async function deleteRoomService(serviceId: string) {
  try {
    await requireAuth();

    await db.delete(roomServices).where(eq(roomServices.id, serviceId));

    return { success: true };
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    return { error: "Failed to delete service" };
  }
}

// Delete Room Image
export async function deleteRoomImage(imageId: string) {
  try {
    await requireAuth();

    await db.delete(roomImages).where(eq(roomImages.id, imageId));

    return { success: true };
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    return { error: "Failed to delete image" };
  }
}

// Get All Bookings
export async function getAllBookings(status?: string) {
  try {
    await requireAuth();

    let query = db
      .select({
        id: bookings.id,
        checkIn: bookings.checkIn,
        checkOut: bookings.checkOut,
        guests: bookings.guests,
        status: bookings.status,
        specialRequests: bookings.specialRequests,
        totalPrice: bookings.totalPrice,
        room: {
          id: rooms.id,
          roomNumber: rooms.roomNumber,
          floor: rooms.floor,
        },
        roomType: {
          id: roomTypes.id,
          name: roomTypes.name,
          basePrice: roomTypes.basePrice,
        },
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          username: users.username,
          email: users.email,
        },
      })
      .from(bookings)
      .innerJoin(rooms, eq(bookings.roomId, rooms.id))
      .innerJoin(roomTypes, eq(rooms.roomTypeId, roomTypes.id))
      .innerJoin(users, eq(bookings.userId, users.id));

    if (status) {
      query = query.where(eq(bookings.status, status as any)) as any;
    }

    const allBookings = await query;
    return { success: true, bookings: allBookings };
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    return { error: "Failed to fetch bookings" };
  }
}

// Update Booking Status
export async function updateBookingStatus(bookingId: string, status: string) {
  try {
    await requireAuth();

    const [updated] = await db
      .update(bookings)
      .set({ status: status as any })
      .where(eq(bookings.id, bookingId))
      .returning();

    return { success: true, booking: updated };
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    return { error: "Failed to update booking" };
  }
}

// Get All Reviews
export async function getAllReviews() {
  try {
    await requireAuth();

    const allReviews = await db
      .select({
        id: roomReviews.id,
        stars: roomReviews.stars,
        comment: roomReviews.comment,
        created: roomReviews.createdAt,
        room: {
          id: rooms.id,
          roomNumber: rooms.roomNumber,
        },
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          username: users.username,
          email: users.email,
        },
      })
      .from(roomReviews)
      .innerJoin(rooms, eq(roomReviews.roomId, rooms.id))
      .innerJoin(users, eq(roomReviews.userId, users.id));

    return { success: true, reviews: allReviews };
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    return { error: "Failed to fetch reviews" };
  }
}

// Delete Review
export async function deleteReview(reviewId: string) {
  try {
    await requireAuth();

    await db.delete(roomReviews).where(eq(roomReviews.id, reviewId));

    return { success: true };
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    return { error: "Failed to delete review" };
  }
}

// Create Gallery Category
export async function createGalleryCategory(data: unknown) {
  try {
    await requireAuth();
    const validated = z.object({
      name: z.string().min(1, "Name is required"),
      description: z.string().optional(),
    }).parse(data);

    const [category] = await db
      .insert(galleryCategories)
      .values({
        name: validated.name,
        description: validated.description || null,
      })
      .returning();

    return { success: true, category };
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    if (error.name === "ZodError") {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to create category" };
  }
}

// Add Gallery Image
export async function addGalleryImage(data: unknown) {
  try {
    await requireAuth();
    const validated = z.object({
      categoryId: z.string().min(1, "Category is required"),
      image: z.string().min(1, "Image URL is required"),
      caption: z.string().optional(),
    }).parse(data);

    const [image] = await db
      .insert(galleryImages)
      .values({
        categoryId: validated.categoryId,
        image: validated.image,
        caption: validated.caption || null,
      })
      .returning();

    return { success: true, image };
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    if (error.name === "ZodError") {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to add image" };
  }
}

// Delete Gallery Image
export async function deleteGalleryImage(imageId: string) {
  try {
    await requireAuth();

    await db.delete(galleryImages).where(eq(galleryImages.id, imageId));

    return { success: true };
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    return { error: "Failed to delete image" };
  }
}

// Add Service to Room Type
export async function addServiceToRoomType(roomTypeId: string, serviceId: string) {
  try {
    await requireAuth();

    // Check if already exists
    const [existing] = await db
      .select()
      .from(roomTypeServices)
      .where(
        and(
          eq(roomTypeServices.roomTypeId, roomTypeId),
          eq(roomTypeServices.roomServiceId, serviceId)
        )
      )
      .limit(1);

    if (existing) {
      return { success: true, message: "Service already added" };
    }

    const [roomTypeService] = await db
      .insert(roomTypeServices)
      .values({
        roomTypeId,
        roomServiceId: serviceId,
      })
      .returning();

    return { success: true, roomTypeService };
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    return { error: "Failed to add service to room type" };
  }
}

// Remove Service from Room Type
export async function removeServiceFromRoomType(roomTypeId: string, serviceId: string) {
  try {
    await requireAuth();

    await db
      .delete(roomTypeServices)
      .where(
        and(
          eq(roomTypeServices.roomTypeId, roomTypeId),
          eq(roomTypeServices.roomServiceId, serviceId)
        )
      );

    return { success: true };
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    return { error: "Failed to remove service from room type" };
  }
}

// Get Services for Room Type
export async function getRoomTypeServices(roomTypeId: string) {
  try {
    const serviceIds = await db
      .select({ serviceId: roomTypeServices.roomServiceId })
      .from(roomTypeServices)
      .where(eq(roomTypeServices.roomTypeId, roomTypeId));

    if (serviceIds.length === 0) {
      return { success: true, services: [] };
    }

    const serviceIdValues = serviceIds.map((s) => s.serviceId);
    const services = await db
      .select()
      .from(roomServices)
      .where(inArray(roomServices.id, serviceIdValues));

    return { success: true, services };
  } catch (error) {
    return { error: "Failed to fetch room type services" };
  }
}

// Create Booking from Dashboard (for staff at reception)
export async function createDashboardBooking(data: unknown) {
  try {
    const session = await requireAuth();
    const validated = createDashboardBookingSchema.parse(data);

    // Check if room exists and is available
    const [room] = await db
      .select()
      .from(rooms)
      .where(eq(rooms.id, validated.roomId))
      .limit(1);

    if (!room) return { error: "Room not found" };
    if (room.status !== "available") return { error: "Room is not available" };

    // Convert Dates to YYYY-MM-DD strings for PgDateString columns
    const checkInStr = new Date(validated.checkIn).toISOString().split("T")[0];
    const checkOutStr = new Date(validated.checkOut).toISOString().split("T")[0];

    // Check for overlapping bookings
    const overlappingBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.roomId, validated.roomId),
          or(
            eq(bookings.status, "confirmed"),
            eq(bookings.status, "checked_in")
          ),
          or(
            and(gte(bookings.checkIn, checkInStr), lte(bookings.checkIn, checkOutStr)),
            and(gte(bookings.checkOut, checkInStr), lte(bookings.checkOut, checkOutStr)),
            and(lte(bookings.checkIn, checkInStr), gte(bookings.checkOut, checkOutStr))
          )
        )
      );

    if (overlappingBookings.length > 0) return { error: "Room is already booked for these dates" };

    // Get room type for pricing
    const [roomType] = await db
      .select()
      .from(roomTypes)
      .where(eq(roomTypes.id, room.roomTypeId))
      .limit(1);

    if (!roomType) return { error: "Room type not found" };

    // Calculate total price
    const nights = Math.ceil(
      (new Date(validated.checkOut).getTime() - new Date(validated.checkIn).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const totalPrice = (parseFloat(roomType.basePrice) * nights).toFixed(2);

    // Find or create user by email
    let customerUser = await db
      .select()
      .from(users)
      .where(eq(users.email, validated.customerEmail))
      .limit(1);

    let userId = session.userId; // Default to staff user

    if (customerUser.length === 0) {
      // Create guest user if doesn't exist
      const nameParts = validated.customerName.split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || null;
      
      const [newUser] = await db
        .insert(users)
        .values({
          email: validated.customerEmail,
          firstName: firstName,
          lastName: lastName,
          username: validated.customerEmail.split("@")[0],
          password: "guest", // Temporary password, user can reset if needed
          userType: "guest",
          isVerified: true, // Auto-verify reception guests
        })
        .returning();
      userId = newUser.id;
    } else {
      userId = customerUser[0].id;
    }

    // Create booking with confirmed status if cash payment, pending for all online payments
    const bookingStatus = validated.paymentMethod === "cash" ? "confirmed" : "pending";
    
    // Map payment method for display
    const paymentMethodDisplay = validated.paymentMethod === "cash" ? "Cash" :
      validated.paymentMethod === "mtn_mobile_money" ? "MTN Mobile Money" :
      validated.paymentMethod === "airtel_money" ? "Airtel Money" :
      validated.paymentMethod === "visa" ? "Visa" :
      validated.paymentMethod === "mastercard" ? "Mastercard" : "Online Payment";

    const [booking] = await db
      .insert(bookings)
      .values({
        userId: userId,
        roomId: validated.roomId,
        checkIn: checkInStr,
        checkOut: checkOutStr,
        guests: validated.guests,
        specialRequests: validated.specialRequests,
        totalPrice,
        status: bookingStatus,
      })
      .returning();

    // Log activity
    await logActivity({
      action: "CREATE_BOOKING",
      entityType: "booking",
      entityId: booking.id,
      description: `Created booking for ${validated.customerName} (${paymentMethodDisplay})`,
      metadata: { 
        customerName: validated.customerName,
        customerEmail: validated.customerEmail,
        paymentMethod: validated.paymentMethod,
        paymentMethodDisplay,
        roomId: validated.roomId,
      },
    });

    // Send receipt email
    try {
      await sendBookingReceipt(validated.customerEmail, validated.customerName, {
        bookingId: booking.id,
        roomNumber: room.roomNumber,
        roomType: roomType.name,
        checkIn: checkInStr,
        checkOut: checkOutStr,
        nights,
        guests: validated.guests,
        totalPrice,
        paymentMethod: paymentMethodDisplay,
        specialRequests: validated.specialRequests || undefined,
      });
    } catch (emailError) {
      console.error("Failed to send receipt email:", emailError);
      // Don't fail the booking if email fails
    }

    // Notify all admins about the new booking
    try {
      await notifyAllAdmins(
        "New Booking Created",
        `A new booking has been created for ${validated.customerName} (${validated.customerEmail}) for Room ${room.roomNumber} from ${checkInStr} to ${checkOutStr}. Payment: ${paymentMethodDisplay}.`,
        session.userId
      );
    } catch (notificationError) {
      // Don't fail booking creation if notification fails
      console.error("Failed to send booking notification to admins:", notificationError);
    }

    return { success: true, booking, customerEmail: validated.customerEmail, customerName: validated.customerName, totalPrice, nights, roomType: roomType.name, roomNumber: room.roomNumber, paymentMethod: validated.paymentMethod };
  } catch (error: any) {
    if (error.message === "Unauthorized") return { error: "Unauthorized" };
    if (error.name === "ZodError") return { error: error.errors[0].message };
    console.error(error);
    return { error: "Failed to create booking" };
  }
}

