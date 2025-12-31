import { z } from "zod";

export const createNotificationSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  message: z.string().min(1, "Message is required").max(1000, "Message must be less than 1000 characters"),
});

export const updateNotificationStatusSchema = z.object({
  notificationId: z.string().min(1, "Notification ID is required"),
  status: z.enum(["new", "read"]),
});



