"use server";

import { db } from "@/lib/db";
import {
  permissionDefinitions,
  userPermissions,
  rolePermissions,
  permissionRequests,
} from "@/lib/db/schema";
import { staffProfiles, roles } from "@/lib/db/schema/staff";
import { users } from "@/lib/db/schema/users";
import { eq, and, or, desc } from "drizzle-orm";
import { requireAdmin, getSession } from "@/lib/auth/session";
import { logActivity } from "@/lib/utils/activityLog";
import { hasPermission as checkPermission } from "@/lib/auth/permissions";

/**
 * Server action to check if current user has a permission
 */
export async function checkUserPermission(permissionName: string): Promise<{ hasPermission: boolean }> {
  try {
    const session = await getSession();
    if (!session) {
      return { hasPermission: false };
    }

    // Admins have all permissions
    if (session.userType === "admin" || session.isSuperuser) {
      return { hasPermission: true };
    }

    const hasAccess = await checkPermission(session.userId, permissionName);
    return { hasPermission: hasAccess };
  } catch (error) {
    console.error("Error checking permission:", error);
    return { hasPermission: false };
  }
}

// Permission Definitions
export async function getAllPermissionDefinitions() {
  try {
    const permissions = await db
      .select()
      .from(permissionDefinitions)
      .orderBy(desc(permissionDefinitions.createdAt));
    return { success: true, permissions };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createPermissionDefinition(data: {
  name: string;
  displayName: string;
  description?: string;
  pagePath?: string;
  category?: string;
}) {
  try {
    const session = await requireAdmin();
    
    const [permission] = await db
      .insert(permissionDefinitions)
      .values({
        name: data.name,
        displayName: data.displayName,
        description: data.description || null,
        pagePath: data.pagePath || null,
        category: data.category || null,
        isActive: true,
      })
      .returning();

    await logActivity({
      action: "create",
      entityType: "permission_definition",
      entityId: permission.id,
      description: `Created permission: ${permission.displayName}`,
    });

    return { success: true, permission };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// User Permissions
export async function grantUserPermission(userId: string, permissionId: string) {
  try {
    const session = await requireAdmin();
    
    const [userPerm] = await db
      .insert(userPermissions)
      .values({
        userId,
        permissionId,
        grantedBy: session.userId,
      })
      .returning();

    await logActivity({
      action: "grant",
      entityType: "user_permission",
      entityId: userPerm.id,
      description: `Granted permission to user`,
    });

    return { success: true, userPermission: userPerm };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function revokeUserPermission(userId: string, permissionId: string) {
  try {
    const session = await requireAdmin();
    
    await db
      .delete(userPermissions)
      .where(
        and(
          eq(userPermissions.userId, userId),
          eq(userPermissions.permissionId, permissionId)
        )
      );

    await logActivity({
      action: "revoke",
      entityType: "user_permission",
      entityId: `${userId}-${permissionId}`,
      description: `Revoked permission from user`,
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getUserPermissions(userId: string) {
  try {
    const session = await requireAdmin();
    
    const userPerms = await db
      .select({
        id: userPermissions.id,
        permission: {
          id: permissionDefinitions.id,
          name: permissionDefinitions.name,
          displayName: permissionDefinitions.displayName,
        },
      })
      .from(userPermissions)
      .innerJoin(
        permissionDefinitions,
        eq(userPermissions.permissionId, permissionDefinitions.id)
      )
      .where(eq(userPermissions.userId, userId));

    return { success: true, permissions: userPerms };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Role Permissions
export async function grantRolePermission(roleId: string, permissionId: string) {
  try {
    const session = await requireAdmin();
    
    const [rolePerm] = await db
      .insert(rolePermissions)
      .values({
        roleId,
        permissionId,
        grantedBy: session.userId,
      })
      .returning();

    await logActivity({
      action: "grant",
      entityType: "role_permission",
      entityId: rolePerm.id,
      description: `Granted permission to role`,
    });

    return { success: true, rolePermission: rolePerm };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function revokeRolePermission(roleId: string, permissionId: string) {
  try {
    const session = await requireAdmin();
    
    await db
      .delete(rolePermissions)
      .where(
        and(
          eq(rolePermissions.roleId, roleId),
          eq(rolePermissions.permissionId, permissionId)
        )
      );

    await logActivity({
      action: "revoke",
      entityType: "role_permission",
      entityId: `${roleId}-${permissionId}`,
      description: `Revoked permission from role`,
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getRolePermissions(roleId: string) {
  try {
    const session = await requireAdmin();
    
    const rolePerms = await db
      .select({
        id: rolePermissions.id,
        permission: {
          id: permissionDefinitions.id,
          name: permissionDefinitions.name,
          displayName: permissionDefinitions.displayName,
          description: permissionDefinitions.description,
          pagePath: permissionDefinitions.pagePath,
          category: permissionDefinitions.category,
        },
      })
      .from(rolePermissions)
      .innerJoin(
        permissionDefinitions,
        eq(rolePermissions.permissionId, permissionDefinitions.id)
      )
      .where(
        and(
          eq(rolePermissions.roleId, roleId),
          eq(permissionDefinitions.isActive, true)
        )
      );

    return { success: true, permissions: rolePerms };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Permission Requests
export async function getAllPermissionRequests() {
  try {
    const session = await requireAdmin();
    
    const requests = await db
      .select({
        id: permissionRequests.id,
        userId: permissionRequests.userId,
        permissionId: permissionRequests.permissionId,
        reason: permissionRequests.reason,
        status: permissionRequests.status,
        reviewedBy: permissionRequests.reviewedBy,
        reviewedAt: permissionRequests.reviewedAt,
        reviewNotes: permissionRequests.reviewNotes,
        createdAt: permissionRequests.createdAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        },
        permission: {
          id: permissionDefinitions.id,
          name: permissionDefinitions.name,
          displayName: permissionDefinitions.displayName,
        },
      })
      .from(permissionRequests)
      .leftJoin(users, eq(permissionRequests.userId, users.id))
      .leftJoin(
        permissionDefinitions,
        eq(permissionRequests.permissionId, permissionDefinitions.id)
      )
      .orderBy(desc(permissionRequests.createdAt));

    return { success: true, requests };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function approvePermissionRequest(requestId: string, notes?: string) {
  try {
    const session = await requireAdmin();
    
    const [request] = await db
      .select()
      .from(permissionRequests)
      .where(eq(permissionRequests.id, requestId))
      .limit(1);

    if (!request) {
      return { success: false, error: "Request not found" };
    }

    // Grant permission
    await grantUserPermission(request.userId, request.permissionId);

    // Update request status
    await db
      .update(permissionRequests)
      .set({
        status: "approved",
        reviewedBy: session.userId,
        reviewedAt: new Date(),
        reviewNotes: notes || null,
      })
      .where(eq(permissionRequests.id, requestId));

    await logActivity({
      action: "approve",
      entityType: "permission_request",
      entityId: requestId,
      description: `Approved permission request`,
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function rejectPermissionRequest(requestId: string, notes?: string) {
  try {
    const session = await requireAdmin();
    
    await db
      .update(permissionRequests)
      .set({
        status: "rejected",
        reviewedBy: session.userId,
        reviewedAt: new Date(),
        reviewNotes: notes || null,
      })
      .where(eq(permissionRequests.id, requestId));

    await logActivity({
      action: "reject",
      entityType: "permission_request",
      entityId: requestId,
      description: `Rejected permission request`,
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
