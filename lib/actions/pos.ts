"use server";

import { db } from "@/lib/db";
import {
  menuCategories,
  menuItems,
  drinkCategories,
  drinks,
  posOrders,
} from "@/lib/db/schema";
import {
  createMenuCategorySchema,
  updateMenuCategorySchema,
  createMenuItemSchema,
  updateMenuItemSchema,
  createDrinkCategorySchema,
  updateDrinkCategorySchema,
  createDrinkSchema,
  updateDrinkSchema,
  createPosOrderSchema,
} from "@/lib/validations/pos";
import { eq, and, desc, asc } from "drizzle-orm";
import { users } from "@/lib/db/schema/users";
import { requireAuth } from "@/lib/auth/session";
import { requirePermission } from "@/lib/auth/permissions";
import { logActivity } from "@/lib/utils/activityLog";

// Menu Categories
export async function getAllMenuCategories() {
  try {
    const categories = await db
      .select()
      .from(menuCategories)
      .where(eq(menuCategories.isActive, true))
      .orderBy(asc(menuCategories.displayOrder), asc(menuCategories.name));
    return { success: true, categories };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createMenuCategory(data: unknown) {
  try {
    const session = await requirePermission("pos_menu_categories");
    const validated = createMenuCategorySchema.parse(data);
    
    const [category] = await db
      .insert(menuCategories)
      .values({
        name: validated.name,
        description: validated.description || null,
        displayOrder: validated.displayOrder,
      })
      .returning();

    await logActivity({
      action: "create",
      entityType: "menu_category",
      entityId: category.id,
      description: `Created menu category: ${category.name}`,
    });

    return { success: true, category };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateMenuCategory(data: unknown) {
  try {
    const session = await requirePermission("pos_menu_categories");
    const validated = updateMenuCategorySchema.parse(data);
    
    const [category] = await db
      .update(menuCategories)
      .set({
        name: validated.name,
        description: validated.description || null,
        displayOrder: validated.displayOrder,
        isActive: validated.isActive ?? true,
      })
      .where(eq(menuCategories.id, validated.id))
      .returning();

    await logActivity({
      action: "update",
      entityType: "menu_category",
      entityId: category.id,
      description: `Updated menu category: ${category.name}`,
    });

    return { success: true, category };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteMenuCategory(id: string) {
  try {
    const session = await requirePermission("pos_menu_categories");
    
    const [category] = await db
      .delete(menuCategories)
      .where(eq(menuCategories.id, id))
      .returning();

    await logActivity({
      action: "delete",
      entityType: "menu_category",
      entityId: id,
      description: `Deleted menu category: ${category?.name || id}`,
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Menu Items
export async function getAllMenuItems() {
  try {
    const items = await db
      .select({
        id: menuItems.id,
        categoryId: menuItems.categoryId,
        name: menuItems.name,
        localName: menuItems.localName,
        description: menuItems.description,
        price: menuItems.price,
        image: menuItems.image,
        isAvailable: menuItems.isAvailable,
        displayOrder: menuItems.displayOrder,
        category: {
          id: menuCategories.id,
          name: menuCategories.name,
        },
      })
      .from(menuItems)
      .leftJoin(menuCategories, eq(menuItems.categoryId, menuCategories.id))
      .where(and(eq(menuItems.isAvailable, true), eq(menuCategories.isActive, true)))
      .orderBy(asc(menuItems.displayOrder), asc(menuItems.name));
    
    return { success: true, items };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getMenuItemsByCategory(categoryId: string) {
  try {
    const items = await db
      .select()
      .from(menuItems)
      .where(and(eq(menuItems.categoryId, categoryId), eq(menuItems.isAvailable, true)))
      .orderBy(asc(menuItems.displayOrder), asc(menuItems.name));
    
    return { success: true, items };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createMenuItem(data: unknown) {
  try {
    const session = await requirePermission("pos_menu_items");
    const validated = createMenuItemSchema.parse(data);
    
    const [item] = await db
      .insert(menuItems)
      .values({
        categoryId: validated.categoryId,
        name: validated.name,
        localName: validated.localName || null,
        description: validated.description || null,
        price: validated.price,
        image: validated.image || null,
        displayOrder: validated.displayOrder,
      })
      .returning();

    await logActivity({
      action: "create",
      entityType: "menu_item",
      entityId: item.id,
      description: `Created menu item: ${item.name}`,
    });

    return { success: true, item };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateMenuItem(data: unknown) {
  try {
    const session = await requirePermission("pos_menu_items");
    const validated = updateMenuItemSchema.parse(data);
    
    const [item] = await db
      .update(menuItems)
      .set({
        categoryId: validated.categoryId,
        name: validated.name,
        localName: validated.localName || null,
        description: validated.description || null,
        price: validated.price,
        image: validated.image || null,
        displayOrder: validated.displayOrder,
        isAvailable: validated.isAvailable ?? true,
      })
      .where(eq(menuItems.id, validated.id))
      .returning();

    await logActivity({
      action: "update",
      entityType: "menu_item",
      entityId: item.id,
      description: `Updated menu item: ${item.name}`,
    });

    return { success: true, item };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteMenuItem(id: string) {
  try {
    const session = await requirePermission("pos_menu_items");
    
    const [item] = await db
      .delete(menuItems)
      .where(eq(menuItems.id, id))
      .returning();

    await logActivity({
      action: "delete",
      entityType: "menu_item",
      entityId: id,
      description: `Deleted menu item: ${item?.name || id}`,
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Drink Categories
export async function getAllDrinkCategories() {
  try {
    const categories = await db
      .select()
      .from(drinkCategories)
      .where(eq(drinkCategories.isActive, true))
      .orderBy(asc(drinkCategories.displayOrder), asc(drinkCategories.name));
    return { success: true, categories };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createDrinkCategory(data: unknown) {
  try {
    const session = await requirePermission("pos_drink_categories");
    const validated = createDrinkCategorySchema.parse(data);
    
    const [category] = await db
      .insert(drinkCategories)
      .values({
        name: validated.name,
        description: validated.description || null,
        displayOrder: validated.displayOrder,
      })
      .returning();

    await logActivity({
      action: "create",
      entityType: "drink_category",
      entityId: category.id,
      description: `Created drink category: ${category.name}`,
    });

    return { success: true, category };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateDrinkCategory(data: unknown) {
  try {
    const session = await requirePermission("pos_drink_categories");
    const validated = updateDrinkCategorySchema.parse(data);
    
    const [category] = await db
      .update(drinkCategories)
      .set({
        name: validated.name,
        description: validated.description || null,
        displayOrder: validated.displayOrder,
        isActive: validated.isActive ?? true,
      })
      .where(eq(drinkCategories.id, validated.id))
      .returning();

    await logActivity({
      action: "update",
      entityType: "drink_category",
      entityId: category.id,
      description: `Updated drink category: ${category.name}`,
    });

    return { success: true, category };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteDrinkCategory(id: string) {
  try {
    const session = await requirePermission("pos_drink_categories");
    
    const [category] = await db
      .delete(drinkCategories)
      .where(eq(drinkCategories.id, id))
      .returning();

    await logActivity({
      action: "delete",
      entityType: "drink_category",
      entityId: id,
      description: `Deleted drink category: ${category?.name || id}`,
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Drinks
export async function getAllDrinks() {
  try {
    const items = await db
      .select({
        id: drinks.id,
        categoryId: drinks.categoryId,
        name: drinks.name,
        localName: drinks.localName,
        description: drinks.description,
        price: drinks.price,
        image: drinks.image,
        isAvailable: drinks.isAvailable,
        displayOrder: drinks.displayOrder,
        category: {
          id: drinkCategories.id,
          name: drinkCategories.name,
        },
      })
      .from(drinks)
      .leftJoin(drinkCategories, eq(drinks.categoryId, drinkCategories.id))
      .where(and(eq(drinks.isAvailable, true), eq(drinkCategories.isActive, true)))
      .orderBy(asc(drinks.displayOrder), asc(drinks.name));
    
    return { success: true, items };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getDrinksByCategory(categoryId: string) {
  try {
    const items = await db
      .select()
      .from(drinks)
      .where(and(eq(drinks.categoryId, categoryId), eq(drinks.isAvailable, true)))
      .orderBy(asc(drinks.displayOrder), asc(drinks.name));
    
    return { success: true, items };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createDrink(data: unknown) {
  try {
    const session = await requirePermission("pos_drinks");
    const validated = createDrinkSchema.parse(data);
    
    const [item] = await db
      .insert(drinks)
      .values({
        categoryId: validated.categoryId,
        name: validated.name,
        localName: validated.localName || null,
        description: validated.description || null,
        price: validated.price,
        image: validated.image || null,
        displayOrder: validated.displayOrder,
      })
      .returning();

    await logActivity({
      action: "create",
      entityType: "drink",
      entityId: item.id,
      description: `Created drink: ${item.name}`,
    });

    return { success: true, item };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateDrink(data: unknown) {
  try {
    const session = await requirePermission("pos_drinks");
    const validated = updateDrinkSchema.parse(data);
    
    const [item] = await db
      .update(drinks)
      .set({
        categoryId: validated.categoryId,
        name: validated.name,
        localName: validated.localName || null,
        description: validated.description || null,
        price: validated.price,
        image: validated.image || null,
        displayOrder: validated.displayOrder,
        isAvailable: validated.isAvailable ?? true,
      })
      .where(eq(drinks.id, validated.id))
      .returning();

    await logActivity({
      action: "update",
      entityType: "drink",
      entityId: item.id,
      description: `Updated drink: ${item.name}`,
    });

    return { success: true, item };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteDrink(id: string) {
  try {
    const session = await requirePermission("pos_drinks");
    
    const [item] = await db
      .delete(drinks)
      .where(eq(drinks.id, id))
      .returning();

    await logActivity({
      action: "delete",
      entityType: "drink",
      entityId: id,
      description: `Deleted drink: ${item?.name || id}`,
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// POS Orders
export async function createPosOrder(data: unknown) {
  try {
    const session = await requireAuth();
    const validated = createPosOrderSchema.parse(data);
    
    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const [order] = await db
      .insert(posOrders)
      .values({
        userId: session.userId,
        orderNumber,
        totalAmount: validated.totalAmount,
        items: JSON.stringify(validated.items),
        receiptData: JSON.stringify({
          orderNumber,
          items: validated.items,
          totalAmount: validated.totalAmount,
          createdAt: new Date().toISOString(),
        }),
      })
      .returning();

    await logActivity({
      action: "create",
      entityType: "pos_order",
      entityId: order.id,
      description: `Created POS order: ${orderNumber}`,
    });

    return { success: true, order };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAllPosOrders() {
  try {
    // Try permission first, fallback to staff access
    let session;
    try {
      session = await requirePermission("pos_orders_view");
    } catch {
      session = await requireStaff();
    }
    const orders = await db
      .select({
        id: posOrders.id,
        userId: posOrders.userId,
        orderNumber: posOrders.orderNumber,
        totalAmount: posOrders.totalAmount,
        items: posOrders.items,
        receiptData: posOrders.receiptData,
        isPrinted: posOrders.isPrinted,
        createdAt: posOrders.createdAt,
        updatedAt: posOrders.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(posOrders)
      .leftJoin(users, eq(posOrders.userId, users.id))
      .orderBy(desc(posOrders.createdAt));
    
    return { success: true, orders };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function markOrderAsPrinted(orderId: string) {
  try {
    const session = await requirePermission("pos_orders");
    const [order] = await db
      .update(posOrders)
      .set({ isPrinted: true })
      .where(eq(posOrders.id, orderId))
      .returning();
    
    return { success: true, order };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

