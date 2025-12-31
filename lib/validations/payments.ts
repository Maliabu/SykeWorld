import { z } from "zod";

export const createPaymentSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
  amount: z.string().or(z.number()).transform((val) => String(val)),
});

export const createTransactionSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
  pesapalReference: z.string().min(1, "Pesapal reference is required"),
  merchantReference: z.string().min(1, "Merchant reference is required"),
  amount: z.string().or(z.number()).transform((val) => String(val)),
  status: z.string().default("PENDING"),
  paymentMethod: z.string().optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;




