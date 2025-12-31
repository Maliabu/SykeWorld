import { getSession, SessionUser } from "./session";
import { db } from "@/lib/db";
import { 
  permissionDefinitions, 
  userPermissions, 
  rolePermissions,
  permissionRequests,
} from "@/lib/db/schema";
import { staffProfiles } from "@/lib/db/schema/staff";
import { eq, and, or } from "drizzle-orm";

/**
 * Check if a user has a specific permission
 */
export async function hasPermission(
  userId: string,
  permissionName: string
): Promise<boolean> {
  try {
    // Get user session to check if admin
    const session = await getSession();
    if (!session || session.userId !== userId) {
      return false;
    }

    // Admins have all permissions
    if (session.userType === "admin" || session.isSuperuser) {
      return true;
    }

    // Get permission definition
    const [permission] = await db
      .select()
      .from(permissionDefinitions)
      .where(eq(permissionDefinitions.name, permissionName))
      .limit(1);

    if (!permission || !permission.isActive) {
      return false;
    }

    // Check direct user permissions
    const [userPerm] = await db
      .select()
      .from(userPermissions)
      .where(
        and(
          eq(userPermissions.userId, userId),
          eq(userPermissions.permissionId, permission.id)
        )
      )
      .limit(1);

    if (userPerm) {
      return true;
    }

    // Check role permissions
    const [staffProfile] = await db
      .select()
      .from(staffProfiles)
      .where(eq(staffProfiles.userId, userId))
      .limit(1);

    if (staffProfile) {
      const [rolePerm] = await db
        .select()
        .from(rolePermissions)
        .where(
          and(
            eq(rolePermissions.roleId, staffProfile.roleId),
            eq(rolePermissions.permissionId, permission.id)
          )
        )
        .limit(1);

      if (rolePerm) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("Error checking permission:", error);
    return false;
  }
}

/**
 * Require a specific permission (throws if user doesn't have it)
 */
export async function requirePermission(
  permissionName: string
): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  // Admins and superusers have all permissions - check this first
  if (session.userType === "admin" || session.isSuperuser === true) {
    return session;
  }

  // Check if permission definition exists
  const [permission] = await db
    .select()
    .from(permissionDefinitions)
    .where(eq(permissionDefinitions.name, permissionName))
    .limit(1);

  // If permission doesn't exist in DB yet, allow staff/admins (for backward compatibility)
  if (!permission) {
    if (session.userType === "staff" || session.userType === "admin" || session.isStaff || session.isSuperuser) {
      return session;
    }
    throw new Error(`Forbidden: Permission '${permissionName}' required`);
  }

  const hasAccess = await hasPermission(session.userId, permissionName);
  if (!hasAccess) {
    throw new Error(`Forbidden: Permission '${permissionName}' required`);
  }

  return session;
}

/**
 * Get all permissions for a user
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
  try {
    const session = await getSession();
    if (!session || session.userId !== userId) {
      return [];
    }

    // Admins have all permissions
    if (session.userType === "admin" || session.isSuperuser) {
      const allPerms = await db
        .select({ name: permissionDefinitions.name })
        .from(permissionDefinitions)
        .where(eq(permissionDefinitions.isActive, true));
      return allPerms.map((p) => p.name);
    }

    const permissions: string[] = [];

    // Get direct user permissions
    const userPerms = await db
      .select({
        name: permissionDefinitions.name,
      })
      .from(userPermissions)
      .innerJoin(
        permissionDefinitions,
        eq(userPermissions.permissionId, permissionDefinitions.id)
      )
      .where(
        and(
          eq(userPermissions.userId, userId),
          eq(permissionDefinitions.isActive, true)
        )
      );

    permissions.push(...userPerms.map((p) => p.name));

    // Get role permissions
    const [staffProfile] = await db
      .select()
      .from(staffProfiles)
      .where(eq(staffProfiles.userId, userId))
      .limit(1);

    if (staffProfile) {
      const rolePerms = await db
        .select({
          name: permissionDefinitions.name,
        })
        .from(rolePermissions)
        .innerJoin(
          permissionDefinitions,
          eq(rolePermissions.permissionId, permissionDefinitions.id)
        )
        .where(
          and(
            eq(rolePermissions.roleId, staffProfile.roleId),
            eq(permissionDefinitions.isActive, true)
          )
        );

      permissions.push(...rolePerms.map((p) => p.name));
    }

    // Remove duplicates
    return [...new Set(permissions)];
  } catch (error) {
    console.error("Error getting user permissions:", error);
    return [];
  }
}

/**
 * Request permission access
 */
export async function requestPermission(
  userId: string,
  permissionName: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const [permission] = await db
      .select()
      .from(permissionDefinitions)
      .where(eq(permissionDefinitions.name, permissionName))
      .limit(1);

    if (!permission) {
      return { success: false, error: "Permission not found" };
    }

    // Check if already has permission
    const hasAccess = await hasPermission(userId, permissionName);
    if (hasAccess) {
      return { success: false, error: "You already have this permission" };
    }

    // Check if request already exists
    const [existingRequest] = await db
      .select()
      .from(permissionRequests)
      .where(
        and(
          eq(permissionRequests.userId, userId),
          eq(permissionRequests.permissionId, permission.id),
          eq(permissionRequests.status, "pending")
        )
      )
      .limit(1);

    if (existingRequest) {
      return { success: false, error: "Request already pending" };
    }

    // Create request
    await db.insert(permissionRequests).values({
      userId,
      permissionId: permission.id,
      reason: reason || null,
      status: "pending",
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

