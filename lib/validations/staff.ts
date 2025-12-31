import { z } from "zod";

export const createRoleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

export const createStaffSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  roleId: z.string().min(1, "Role ID is required"),
});

export const createTaskSchema = z.object({
  staffId: z.string().min(1, "Staff ID is required"),
  roomId: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  details: z.string().optional(),
  dueDate: z.string().or(z.date()).optional(),
  statusId: z.string().min(1, "Status ID is required"),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;




