"use server";

import { db } from "@/lib/db";
import {
  roles,
  staffProfiles,
  staffTasks,
  taskStatuses,
  permissions,
} from "@/lib/db/schema/staff";
import { users } from "@/lib/db/schema/users";
import {
  createRoleSchema,
  createStaffSchema,
  createTaskSchema,
} from "@/lib/validations/staff";
import { eq, inArray } from "drizzle-orm";
import { requireStaff } from "@/lib/auth/session";

export async function createRole(data: unknown) {
  try {
    await requireStaff();
    const validated = createRoleSchema.parse(data);

    const [role] = await db
      .insert(roles)
      .values({
        name: validated.name,
        description: validated.description,
      })
      .returning();

    return { success: true, role };
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Staff")) {
      return { error: "Unauthorized: Staff access required" };
    }
    if (error.name === "ZodError") {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to create role" };
  }
}

export async function createStaff(data: unknown) {
  try {
    await requireStaff();
    const validated = createStaffSchema.parse(data);

    const [staff] = await db
      .insert(staffProfiles)
      .values({
        userId: validated.userId,
        roleId: validated.roleId,
        active: true,
      })
      .returning();

    return { success: true, staff };
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Staff")) {
      return { error: "Unauthorized: Staff access required" };
    }
    if (error.name === "ZodError") {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to create staff profile" };
  }
}

export async function getAllStaff() {
  try {
    await requireStaff();

    console.log("getAllStaff: Starting query...");

    // First, get all staff profiles (without joins to see what we have)
    const allStaffProfiles = await db
      .select()
      .from(staffProfiles);

    console.log("getAllStaff: Found", allStaffProfiles.length, "staff profiles in database");

    // Also get users who have isStaff = true but might not have staff profiles
    const staffUsers = await db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        isStaff: users.isStaff,
        userType: users.userType,
      })
      .from(users)
      .where(eq(users.isStaff, true));

    console.log("getAllStaff: Found", staffUsers.length, "users with isStaff=true");

    // If no staff profiles exist but we have staff users, we should still show them
    if (allStaffProfiles.length === 0 && staffUsers.length === 0) {
      console.log("getAllStaff: No staff profiles or staff users found - returning empty array");
      return { success: true, staff: [] };
    }

    // Get all user IDs from staff profiles
    const profileUserIds = allStaffProfiles.map(s => s.userId).filter(Boolean);
    // Also include staff users who might not have profiles
    const allUserIds = [...new Set([...profileUserIds, ...staffUsers.map(u => u.id)])];
    console.log("getAllStaff: Total unique user IDs to fetch:", allUserIds.length);

    // Get all users (from profiles + staff users)
    const userMap = new Map();
    
    // Add staff users we already fetched
    staffUsers.forEach(user => userMap.set(user.id, user));
    
    // Fetch any additional users from profiles that we don't have yet
    const missingUserIds = profileUserIds.filter(id => !userMap.has(id));
    if (missingUserIds.length > 0) {
      console.log("getAllStaff: Fetching", missingUserIds.length, "additional users from profiles");
      const additionalUsers = await db
        .select({
          id: users.id,
          email: users.email,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          dateJoined: users.dateJoined,
        })
        .from(users)
        .where(inArray(users.id, missingUserIds));
      
      console.log("getAllStaff: Found", additionalUsers.length, "additional users");
      additionalUsers.forEach(user => userMap.set(user.id, user));
    }
    
    console.log("getAllStaff: Total users in map:", userMap.size);

    // Get all roles
    const allRoles = await db.select().from(roles);
    const roleMap = new Map();
    allRoles.forEach(role => roleMap.set(role.id, role));
    console.log("getAllStaff: Found", allRoles.length, "roles");

    // Combine staff profiles with user and role data
    const staffFromProfiles = allStaffProfiles.map(profile => {
      const user = userMap.get(profile.userId);
      const role = roleMap.get(profile.roleId);
      
      return {
        id: profile.id,
        userId: profile.userId,
        active: profile.active,
        hiredDate: profile.hiredDate,
        role: role ? {
          id: role.id,
          name: role.name,
          description: role.description,
        } : null,
        user: user ? {
          ...user,
          dateJoined: user.dateJoined || null,
        } : null,
      };
    });

    // Also create staff entries for users with isStaff=true who don't have profiles
    const usersWithoutProfiles = staffUsers.filter(user => !allStaffProfiles.some(profile => profile.userId === user.id));
    
    // Fetch dateJoined for users without profiles
    const userDetailsMap = new Map();
    if (usersWithoutProfiles.length > 0) {
      const userIdsToFetch = usersWithoutProfiles.map(u => u.id);
      const userDetails = await db
        .select({
          id: users.id,
          dateJoined: users.dateJoined,
        })
        .from(users)
        .where(inArray(users.id, userIdsToFetch));
      
      userDetails.forEach(u => userDetailsMap.set(u.id, u));
    }
    
    const staffFromUsers = usersWithoutProfiles.map(user => {
      const userDetail = userDetailsMap.get(user.id);
      const fullUser = userMap.get(user.id) || user;
      return {
        id: `user-${user.id}`, // Temporary ID for users without profiles
        userId: user.id,
        active: true, // Default to active
        hiredDate: userDetail?.dateJoined || null, // Use dateJoined as hiredDate
        role: null, // No role assigned yet
        user: {
          ...fullUser,
          dateJoined: userDetail?.dateJoined || fullUser?.dateJoined || null,
        },
      };
    });

    const allStaff = [...staffFromProfiles, ...staffFromUsers];
    
    console.log("getAllStaff: Returning", allStaff.length, "staff members");
    console.log("getAllStaff: - From profiles:", staffFromProfiles.length);
    console.log("getAllStaff: - From users (no profile):", staffFromUsers.length);
    
    if (allStaff.length > 0) {
      console.log("getAllStaff: Sample staff:", JSON.stringify(allStaff[0], null, 2));
    }
    
    return { success: true, staff: allStaff };
  } catch (error: any) {
    console.error("getAllStaff error:", error);
    console.error("getAllStaff error message:", error.message);
    console.error("getAllStaff error stack:", error.stack);
    if (error.message === "Unauthorized" || error.message.includes("Staff")) {
      return { error: "Unauthorized: Staff access required" };
    }
    return { error: `Failed to fetch staff: ${error.message}` };
  }
}

export async function createTask(data: unknown) {
  try {
    await requireStaff();
    const validated = createTaskSchema.parse(data);

    const [task] = await db
      .insert(staffTasks)
      .values({
        staffId: validated.staffId,
        roomId: validated.roomId,
        title: validated.title,
        details: validated.details,
        dueDate: validated.dueDate
          ? new Date(validated.dueDate).toISOString().split("T")[0]
          : undefined,
        statusId: validated.statusId,
      })
      .returning();

    return { success: true, task };
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Staff")) {
      return { error: "Unauthorized: Staff access required" };
    }
    if (error.name === "ZodError") {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to create task" };
  }
}

export async function getAllTasks() {
  try {
    await requireStaff();

    const allTasks = await db
      .select({
        id: staffTasks.id,
        title: staffTasks.title,
        details: staffTasks.details,
        assignedDate: staffTasks.assignedDate,
        dueDate: staffTasks.dueDate,
        roomId: staffTasks.roomId,
        staff: {
          id: staffProfiles.id,
          userId: staffProfiles.userId,
        },
        status: {
          id: taskStatuses.id,
          status: taskStatuses.status,
        },
      })
      .from(staffTasks)
      .innerJoin(staffProfiles, eq(staffTasks.staffId, staffProfiles.id))
      .innerJoin(taskStatuses, eq(staffTasks.statusId, taskStatuses.id));

    return { success: true, tasks: allTasks };
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Staff")) {
      return { error: "Unauthorized: Staff access required" };
    }
    return { error: "Failed to fetch tasks" };
  }
}

export async function getAllRoles() {
  try {
    await requireStaff();

    const allRoles = await db.select().from(roles);
    return { success: true, roles: allRoles };
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Staff")) {
      return { error: "Unauthorized: Staff access required" };
    }
    return { error: "Failed to fetch roles" };
  }
}

export async function getAllTaskStatuses() {
  try {
    await requireStaff();

    const allStatuses = await db.select().from(taskStatuses);
    return { success: true, statuses: allStatuses };
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Staff")) {
      return { error: "Unauthorized: Staff access required" };
    }
    return { error: "Failed to fetch task statuses" };
  }
}

// Get task count for current user (non-completed tasks)
export async function getUserTaskCount() {
  try {
    const session = await requireAuth();
    
    // First, find the staff profile for this user
    const [staffProfile] = await db
      .select({ id: staffProfiles.id })
      .from(staffProfiles)
      .where(eq(staffProfiles.userId, session.userId))
      .limit(1);

    if (!staffProfile) {
      // User doesn't have a staff profile, so no tasks
      return { success: true, count: 0 };
    }

    // Get all tasks for this staff member with their statuses
    const allTasks = await db
      .select({
        taskId: staffTasks.id,
        status: taskStatuses.status,
      })
      .from(staffTasks)
      .innerJoin(taskStatuses, eq(staffTasks.statusId, taskStatuses.id))
      .where(eq(staffTasks.staffId, staffProfile.id));

    // Count tasks that are NOT completed
    const nonCompletedTasks = allTasks.filter(t => 
      t.status?.toLowerCase() !== "completed"
    );
    
    return { success: true, count: nonCompletedTasks.length };
  } catch (error: any) {
    console.error("getUserTaskCount error:", error);
    // Don't fail if user doesn't have staff profile
    if (error.message === "Unauthorized") {
      return { success: false, error: "Unauthorized" };
    }
    return { success: true, count: 0 };
  }
}

export async function updateRole(roleId: string, data: unknown) {
  try {
    await requireStaff();
    const validated = createRoleSchema.partial().parse(data);

    const [updatedRole] = await db
      .update(roles)
      .set(validated)
      .where(eq(roles.id, roleId))
      .returning();

    if (!updatedRole) {
      return { error: "Role not found" };
    }

    return { success: true, role: updatedRole };
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Staff")) {
      return { error: "Unauthorized: Staff access required" };
    }
    if (error.name === "ZodError") {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to update role" };
  }
}

export async function deleteRole(roleId: string) {
  try {
    await requireStaff();

    const [deletedRole] = await db
      .delete(roles)
      .where(eq(roles.id, roleId))
      .returning();

    if (!deletedRole) {
      return { error: "Role not found" };
    }

    return { success: true, role: deletedRole };
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Staff")) {
      return { error: "Unauthorized: Staff access required" };
    }
    return { error: "Failed to delete role" };
  }
}

export async function updateStaff(staffId: string, data: unknown) {
  try {
    await requireStaff();
    const validated = createStaffSchema.partial().parse(data);

    const [updatedStaff] = await db
      .update(staffProfiles)
      .set(validated)
      .where(eq(staffProfiles.id, staffId))
      .returning();

    if (!updatedStaff) {
      return { error: "Staff member not found" };
    }

    return { success: true, staff: updatedStaff };
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Staff")) {
      return { error: "Unauthorized: Staff access required" };
    }
    if (error.name === "ZodError") {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to update staff member" };
  }
}

export async function deleteStaff(staffId: string) {
  try {
    await requireStaff();

    const [deletedStaff] = await db
      .delete(staffProfiles)
      .where(eq(staffProfiles.id, staffId))
      .returning();

    if (!deletedStaff) {
      return { error: "Staff member not found" };
    }

    return { success: true, staff: deletedStaff };
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Staff")) {
      return { error: "Unauthorized: Staff access required" };
    }
    return { error: "Failed to delete staff member" };
  }
}

export async function updateTask(taskId: string, data: unknown) {
  try {
    await requireStaff();
    const validated = createTaskSchema.partial().parse(data);

    const [updatedTask] = await db
      .update(staffTasks)
      .set(validated)
      .where(eq(staffTasks.id, taskId))
      .returning();

    if (!updatedTask) {
      return { error: "Task not found" };
    }

    return { success: true, task: updatedTask };
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Staff")) {
      return { error: "Unauthorized: Staff access required" };
    }
    if (error.name === "ZodError") {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to update task" };
  }
}

export async function deleteTask(taskId: string) {
  try {
    await requireStaff();

    const [deletedTask] = await db
      .delete(staffTasks)
      .where(eq(staffTasks.id, taskId))
      .returning();

    if (!deletedTask) {
      return { error: "Task not found" };
    }

    return { success: true, task: deletedTask };
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Staff")) {
      return { error: "Unauthorized: Staff access required" };
    }
    return { error: "Failed to delete task" };
  }
}


