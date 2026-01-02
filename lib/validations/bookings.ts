import { z } from "zod";

export const roomServiceSchema = z.object({
  name: z.string().min(1, "Service name required"),
  icon: z.string().optional(),
  description: z.string().optional(),
});

export const roomTypeSchema = z.object({
  name: z.string().min(1, "Room type name required"),
  description: z.string().optional(),
  basePrice: z.number().min(0),
  maxGuests: z.number().min(1),
  services: z.array(roomServiceSchema).optional(),
});

export const roomImageSchema = z.object({
  image: z.any(),
  caption: z.string().optional(),
});

export const roomSchema = z.object({
  roomNumber: z.string().min(1),
  floor: z.number().min(0),
  status: z.enum(["available", "occupied", "maintenance"]),
  roomTypeId: z.string().min(1),
  images: z.array(roomImageSchema).optional(),
  services: z.array(roomServiceSchema).optional(),
});

export const createRoomTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  basePrice: z.string().or(z.number()).transform((val) => String(val)),
  maxGuests: z.number().int().positive().default(2),
});

export const createRoomSchema = z.object({
  roomNumber: z.string().min(1, "Room number is required"),
  roomTypeId: z.string().min(1, "Room type is required"),
  floor: z.number().int().positive(),
  status: z.enum(["available", "occupied", "cleaning", "maintenance", "unavailable"]),
});

export const createBookingSchema = z.object({
  roomId: z.string().min(1, "Room is required"),
  checkIn: z.string().or(z.date()),
  checkOut: z.string().or(z.date()),
  guests: z.number().int().positive().default(1),
  specialRequests: z.string().optional(),
});

export const createDashboardBookingSchema = z.object({
  roomId: z.string().min(1, "Room is required"),
  checkIn: z.string().or(z.date()),
  checkOut: z.string().or(z.date()),
  guests: z.number().int().positive().default(1),
  specialRequests: z.string().optional(),
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: z.string().email("Valid email is required"),
  customerPhone: z.string().optional(),
  paymentMethod: z.enum(["cash", "mtn_mobile_money", "airtel_money", "visa", "mastercard"]).default("cash"),
  cardNumber: z.string().optional(),
  cardholderName: z.string().optional(),
  expiryDate: z.string().optional(),
  cvv: z.string().optional(),
}).refine((data) => {
  // If payment is visa or mastercard, card details are required
  if (data.paymentMethod === "visa" || data.paymentMethod === "mastercard") {
    return data.cardNumber && data.cardholderName && data.expiryDate && data.cvv;
  }
  return true;
}, {
  message: "Card details are required for Visa/Mastercard payments",
  path: ["cardNumber"],
});

export const createReviewSchema = z.object({
  roomId: z.string().min(1, "Room is required"),
  stars: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

export const checkAvailabilitySchema = z.object({
  checkIn: z.string().or(z.date()),
  checkOut: z.string().or(z.date()),
  guests: z.number().int().positive().default(1).optional(),
  roomTypeId: z.string().optional(),
});

export const subscribeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
});

export const contactMessageSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  message: z.string().min(1, "Message is required"),
});

export type CreateRoomTypeInput = z.infer<typeof createRoomTypeSchema>;
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CreateDashboardBookingInput = z.infer<typeof createDashboardBookingSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type CheckAvailabilityInput = z.infer<typeof checkAvailabilitySchema>;
export type SubscribeInput = z.infer<typeof subscribeSchema>;
export type ContactMessageInput = z.infer<typeof contactMessageSchema>;



