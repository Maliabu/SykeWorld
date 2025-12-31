import { z } from "zod";

export const createTicketSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  message: z.string().min(1, "Message is required").max(2000, "Message must be less than 2000 characters"),
});

export const addTicketMessageSchema = z.object({
  ticketId: z.string().min(1, "Ticket ID is required"),
  message: z.string().min(1, "Message is required").max(2000, "Message must be less than 2000 characters"),
});

export const updateTicketStatusSchema = z.object({
  ticketId: z.string().min(1, "Ticket ID is required"),
  status: z.enum(["open", "closed"]),
});



