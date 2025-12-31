import { z } from "zod";

export const createMenuCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().optional(),
  displayOrder: z.number().int().default(0),
});

export const updateMenuCategorySchema = createMenuCategorySchema.extend({
  id: z.string().uuid(),
  isActive: z.boolean().optional(),
});

export const createMenuItemSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(1, "Name is required").max(255),
  localName: z.string().max(255).optional(),
  description: z.string().optional(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
  image: z.string().url().optional().or(z.literal("")),
  displayOrder: z.number().int().default(0),
});

export const updateMenuItemSchema = createMenuItemSchema.extend({
  id: z.string().uuid(),
  isAvailable: z.boolean().optional(),
});

export const createDrinkCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().optional(),
  displayOrder: z.number().int().default(0),
});

export const updateDrinkCategorySchema = createDrinkCategorySchema.extend({
  id: z.string().uuid(),
  isActive: z.boolean().optional(),
});

export const createDrinkSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(1, "Name is required").max(255),
  localName: z.string().max(255).optional(),
  description: z.string().optional(),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid price format"),
  image: z.string().url().optional().or(z.literal("")),
  displayOrder: z.number().int().default(0),
});

export const updateDrinkSchema = createDrinkSchema.extend({
  id: z.string().uuid(),
  isAvailable: z.boolean().optional(),
});

export const createPosOrderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      type: z.enum(["menu", "drink"]),
      price: z.string(),
      quantity: z.number().int().min(1),
    })
  ),
  totalAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid total amount"),
});



