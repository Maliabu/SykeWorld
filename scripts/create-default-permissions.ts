/**
 * Script to create default permission definitions for the dashboard
 * Run this once to set up common permissions for your hotel management system
 * 
 * Usage: You can call these functions from a page or run them manually
 */

import { createPermissionDefinition } from "@/lib/actions/permissions";

/**
 * Create all default permission definitions for the dashboard
 */
export async function createDefaultPermissions() {
  const permissions = [
    // Rooms
    {
      name: "rooms_add",
      displayName: "Add Rooms",
      description: "Create and add new rooms to the system",
      pagePath: "/admin/dashboard/rooms",
      category: "Rooms",
    },
    {
      name: "rooms_view",
      displayName: "View Rooms",
      description: "View and browse all rooms",
      pagePath: "/admin/dashboard/rooms/view",
      category: "Rooms",
    },
    {
      name: "rooms_types",
      displayName: "Manage Room Types",
      description: "Create, edit, and delete room types",
      pagePath: "/admin/dashboard/rooms/types",
      category: "Rooms",
    },
    {
      name: "rooms_services",
      displayName: "Manage Room Services",
      description: "Create, edit, and delete room services",
      pagePath: "/admin/dashboard/rooms/services",
      category: "Rooms",
    },
    
    // Bookings
    {
      name: "bookings_view",
      displayName: "View Bookings",
      description: "View all bookings and booking details",
      pagePath: "/admin/dashboard/bookings",
      category: "Bookings",
    },
    {
      name: "bookings_manage",
      displayName: "Manage Bookings",
      description: "Create, update, and cancel bookings",
      pagePath: "/admin/dashboard/bookings",
      category: "Bookings",
    },
    
    // Payments
    {
      name: "payments_view",
      displayName: "View Payments",
      description: "View payment records and transactions",
      pagePath: "/admin/dashboard/payments",
      category: "Payments",
    },
    {
      name: "payments_manage",
      displayName: "Manage Payments",
      description: "Process and manage payments",
      pagePath: "/admin/dashboard/payments",
      category: "Payments",
    },
    
    // Reviews
    {
      name: "reviews_view",
      displayName: "View Reviews",
      description: "View customer reviews",
      pagePath: "/admin/dashboard/reviews",
      category: "Reviews",
    },
    {
      name: "reviews_manage",
      displayName: "Manage Reviews",
      description: "Delete and moderate reviews",
      pagePath: "/admin/dashboard/reviews",
      category: "Reviews",
    },
    
    // Gallery
    {
      name: "gallery_view",
      displayName: "View Gallery",
      description: "View gallery images",
      pagePath: "/admin/dashboard/gallery",
      category: "Gallery",
    },
    {
      name: "gallery_manage",
      displayName: "Manage Gallery",
      description: "Add, edit, and delete gallery images",
      pagePath: "/admin/dashboard/gallery",
      category: "Gallery",
    },
    
    // POS System
    {
      name: "pos_terminal",
      displayName: "POS Terminal",
      description: "Access the Point of Sale terminal",
      pagePath: "/admin/dashboard/pos",
      category: "POS",
    },
    {
      name: "pos_receipts",
      displayName: "View POS Receipts",
      description: "View and manage POS receipts",
      pagePath: "/admin/dashboard/pos/receipts",
      category: "POS",
    },
    {
      name: "pos_menu_categories",
      displayName: "POS Menu Categories",
      description: "Manage POS menu categories",
      pagePath: "/admin/dashboard/pos/menu-categories",
      category: "POS",
    },
    {
      name: "pos_menu_items",
      displayName: "POS Menu Items",
      description: "Manage POS menu items",
      pagePath: "/admin/dashboard/pos/menu-items",
      category: "POS",
    },
    {
      name: "pos_drink_categories",
      displayName: "POS Drink Categories",
      description: "Manage POS drink categories",
      pagePath: "/admin/dashboard/pos/drink-categories",
      category: "POS",
    },
    {
      name: "pos_drinks",
      displayName: "POS Drinks",
      description: "Manage POS drinks",
      pagePath: "/admin/dashboard/pos/drinks",
      category: "POS",
    },
    
    // Staff
    {
      name: "staff_view",
      displayName: "View Staff",
      description: "View staff members",
      pagePath: "/admin/dashboard/staff",
      category: "Staff",
    },
    {
      name: "staff_manage",
      displayName: "Manage Staff",
      description: "Add, edit, and delete staff members",
      pagePath: "/admin/dashboard/staff",
      category: "Staff",
    },
    {
      name: "staff_roles",
      displayName: "Manage Roles",
      description: "Create and manage staff roles",
      pagePath: "/admin/dashboard/staff/roles",
      category: "Staff",
    },
    {
      name: "staff_tasks",
      displayName: "Manage Tasks",
      description: "Assign and manage staff tasks",
      pagePath: "/admin/dashboard/staff/tasks",
      category: "Staff",
    },
    
    // Newsletter
    {
      name: "newsletter_send",
      displayName: "Send Newsletter",
      description: "Compose and send newsletters",
      pagePath: "/admin/dashboard/newsletter",
      category: "Marketing",
    },
    {
      name: "newsletter_subscriptions",
      displayName: "Manage Subscriptions",
      description: "View and manage newsletter subscriptions",
      pagePath: "/admin/dashboard/subscriptions",
      category: "Marketing",
    },
    
    // Notifications
    {
      name: "notifications_view",
      displayName: "View Notifications",
      description: "View system notifications",
      pagePath: "/admin/dashboard/notifications",
      category: "System",
    },
    {
      name: "notifications_manage",
      displayName: "Manage Notifications",
      description: "Create and manage notifications",
      pagePath: "/admin/dashboard/notifications",
      category: "System",
    },
    
    // Tickets
    {
      name: "tickets_view",
      displayName: "View Tickets",
      description: "View support tickets",
      pagePath: "/admin/dashboard/tickets",
      category: "System",
    },
    {
      name: "tickets_manage",
      displayName: "Manage Tickets",
      description: "Create, respond to, and close tickets",
      pagePath: "/admin/dashboard/tickets",
      category: "System",
    },
  ];

  const results = [];
  for (const perm of permissions) {
    try {
      const result = await createPermissionDefinition(perm);
      results.push({ permission: perm.name, success: result.success, error: result.error });
    } catch (error: any) {
      results.push({ permission: perm.name, success: false, error: error.message });
    }
  }

  return results;
}



