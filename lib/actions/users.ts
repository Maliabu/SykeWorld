"use server";

import { db } from "@/lib/db";
import { users, passwordResetTokens } from "@/lib/db/schema/users";
import { requireAdmin, requireAuth, requireStaff, getSession } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/utils";
import { eq, desc, sql, or, and, gt, inArray } from "drizzle-orm";
import { z } from "zod";
import { logActivity } from "@/lib/utils/activityLog";
import { generateResetToken, hashToken } from "@/server/token";
import { sendWelcomeEmailWithResetLink } from "@/mail/nodemailer";

const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  userType: z.enum(["guest", "staff"]).default("guest"),
  phone: z.string().optional(),
  isStaff: z.boolean().default(false),
  isSuperuser: z.boolean().default(false),
});

const updateUserSchema = createUserSchema.partial().extend({
  id: z.string().min(1),
});

export async function getAllUsers() {
  try {
    // Allow both admin and staff to view users (for notifications, etc.)
    const session = await requireAuth();
    if (session.userType !== "admin" && session.userType !== "staff" && !session.isSuperuser && !session.isStaff) {
      return { error: "Unauthorized: Staff or Admin access required" };
    }

    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        userType: users.userType,
        phone: users.phone,
        profilePicture: users.profilePicture,
        isVerified: users.isVerified,
        isDisabled: users.isDisabled,
        isActive: users.isActive,
        isStaff: users.isStaff,
        isSuperuser: users.isSuperuser,
        dateJoined: users.dateJoined,
        lastLogin: users.lastLogin,
        isLoggedIn: users.isLoggedIn,
      })
      .from(users)
      .orderBy(users.dateJoined);

    return { success: true, users: allUsers };
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return { error: "Unauthorized: Staff or Admin access required" };
    }
    return { error: "Failed to fetch users" };
  }
}

// Get logged in users (staff/admin only)
export async function getLoggedInUsers() {
  try {
    // Try to get session, but don't require it
    const session = await getSession();
    
    // If no session, return empty array (for public pages)
    if (!session) {
      return { success: true, users: [] };
    }
    
    // Only staff and admins can view logged in users
    if (session.userType !== "staff" && session.userType !== "admin" && !session.isSuperuser && !session.isStaff) {
      // Return empty array instead of error for non-staff users
      return { success: true, users: [] };
    }

    // First, try to get users with isLoggedIn = true
    let loggedInUsers = await db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        userType: users.userType,
        profilePicture: users.profilePicture,
        lastLogin: users.lastLogin,
        isStaff: users.isStaff,
        isSuperuser: users.isSuperuser,
        isLoggedIn: users.isLoggedIn,
      })
      .from(users)
      .where(eq(users.isLoggedIn, true))
      .orderBy(desc(users.lastLogin));

    // If no users found with isLoggedIn = true, check for users who logged in recently (within last 1 hour)
    // This is a fallback in case the flag isn't being set properly
    if (loggedInUsers.length === 0) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const recentUsers = await db
        .select({
          id: users.id,
          email: users.email,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          userType: users.userType,
          profilePicture: users.profilePicture,
          lastLogin: users.lastLogin,
          isStaff: users.isStaff,
          isSuperuser: users.isSuperuser,
          isLoggedIn: users.isLoggedIn,
        })
        .from(users)
        .where(
          and(
            sql`${users.lastLogin} IS NOT NULL`,
            sql`${users.lastLogin} > ${sql.raw(`'${oneHourAgo.toISOString()}'`)}`
          )
        )
        .orderBy(desc(users.lastLogin));

      // Update isLoggedIn for these users
      if (recentUsers.length > 0) {
        const userIdsToUpdate = recentUsers.map(u => u.id);
        await db
          .update(users)
          .set({ isLoggedIn: true })
          .where(inArray(users.id, userIdsToUpdate));
        
        loggedInUsers = recentUsers.map(u => ({ ...u, isLoggedIn: true }));
      }
    }

    console.log("getLoggedInUsers found:", loggedInUsers.length, "users");
    return { success: true, users: loggedInUsers };
  } catch (error: any) {
    console.error("getLoggedInUsers error:", error);
    // Return empty array instead of error for unauthorized users
    // This allows the function to be called from public pages without breaking
    if (error.message === "Unauthorized" || error.message.includes("Staff") || error.message.includes("Unauthorized")) {
      return { success: true, users: [] };
    }
    // For other errors, still return empty array to prevent breaking the UI
    return { success: true, users: [] };
  }
}

// Get recently added users (staff/admin only)
export async function getRecentlyAddedUsers(limit: number = 10) {
  try {
    await requireStaff();

    const recentUsers = await db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        userType: users.userType,
        profilePicture: users.profilePicture,
        dateJoined: users.dateJoined,
        isStaff: users.isStaff,
        isSuperuser: users.isSuperuser,
      })
      .from(users)
      .orderBy(desc(users.dateJoined))
      .limit(limit);

    return { success: true, users: recentUsers };
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Staff")) {
      return { error: "Unauthorized: Staff access required" };
    }
    return { error: "Failed to fetch recently added users" };
  }
}

export async function createUser(data: unknown) {
  try {
    await requireAdmin();
    const validated = createUserSchema.parse(data);

    // Check if email already exists
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, validated.email))
      .limit(1);

    if (existing) {
      return { error: "Email already exists" };
    }

    // Check if username already exists
    const [existingUsername] = await db
      .select()
      .from(users)
      .where(eq(users.username, validated.username))
      .limit(1);

    if (existingUsername) {
      return { error: "Username already exists" };
    }

    // Hash password
    const hashedPassword = await hashPassword(validated.password);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email: validated.email,
        username: validated.username,
        password: hashedPassword,
        firstName: validated.firstName || null,
        lastName: validated.lastName || null,
        userType: validated.userType,
        phone: validated.phone || null,
        isStaff: validated.isStaff,
        isSuperuser: validated.isSuperuser,
      })
      .returning({
        id: users.id,
        email: users.email,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        userType: users.userType,
      });

    // Log activity
    await logActivity({
      action: "CREATE_USER",
      entityType: "user",
      entityId: newUser.id,
      description: `Created user: ${validated.email}`,
      metadata: { email: validated.email, userType: validated.userType },
    });

    // Generate password reset token for welcome email
    try {
      const rawToken = generateResetToken();
      const tokenHash = hashToken(rawToken);
      
      // Store token in DB (expires in 24 hours for new user setup)
      await db.insert(passwordResetTokens).values({
        userId: newUser.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        createdAt: new Date(),
      });

      // Build reset link
      const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const resetLink = `${baseUrl}/reset-password?token=${rawToken}`;

      // Send welcome email with password reset link
      const userName = validated.firstName && validated.lastName 
        ? `${validated.firstName} ${validated.lastName}`
        : validated.username || validated.email.split("@")[0];
      
      await sendWelcomeEmailWithResetLink(validated.email, userName, resetLink);
    } catch (emailError: any) {
      console.error("Failed to send welcome email:", emailError);
      // Don't fail user creation if email fails, just log it
    }

    return { success: true, user: newUser };
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return { error: "Unauthorized: Admin access required" };
    }
    if (error.name === "ZodError") {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to create user" };
  }
}

export async function updateUser(data: unknown) {
  try {
    await requireAdmin();
    const validated = updateUserSchema.parse(data);

    const updateData: any = {};
    if (validated.email) updateData.email = validated.email;
    if (validated.username) updateData.username = validated.username;
    if (validated.firstName !== undefined) updateData.firstName = validated.firstName || null;
    if (validated.lastName !== undefined) updateData.lastName = validated.lastName || null;
    if (validated.userType) updateData.userType = validated.userType;
    if (validated.phone !== undefined) updateData.phone = validated.phone || null;
    if (validated.isStaff !== undefined) updateData.isStaff = validated.isStaff;
    if (validated.isSuperuser !== undefined) updateData.isSuperuser = validated.isSuperuser;
    if (validated.password) {
      updateData.password = await hashPassword(validated.password);
    }

    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, validated.id))
      .returning({
        id: users.id,
        email: users.email,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        userType: users.userType,
      });

    // Log activity
    await logActivity({
      action: "UPDATE_USER",
      entityType: "user",
      entityId: validated.id,
      description: `Updated user: ${updated.email}`,
      metadata: updateData,
    });

    return { success: true, user: updated };
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return { error: "Unauthorized: Admin access required" };
    }
    if (error.name === "ZodError") {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to update user" };
  }
}

export async function deleteUser(userId: string) {
  try {
    await requireAdmin();

    // Get user info before deleting for logging
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    await db.delete(users).where(eq(users.id, userId));

    // Log activity
    if (user) {
      await logActivity({
        action: "DELETE_USER",
        entityType: "user",
        entityId: userId,
        description: `Deleted user: ${user.email}`,
        metadata: { email: user.email },
      });
    }

    return { success: true };
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Forbidden")) {
      return { error: "Unauthorized: Admin access required" };
    }
    return { error: "Failed to delete user" };
  }
}

export async function getUserProfile() {
  try {
    const session = await requireAuth();

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        userType: users.userType,
        phone: users.phone,
        profilePicture: users.profilePicture,
        gender: users.gender,
        address: users.address,
        birthDate: users.birthDate,
        isVerified: users.isVerified,
        isActive: users.isActive,
        isStaff: users.isStaff,
        isSuperuser: users.isSuperuser,
        dateJoined: users.dateJoined,
        lastLogin: users.lastLogin,
      })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (!user) {
      return { error: "User not found" };
    }

    return { success: true, user };
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    return { error: "Failed to fetch profile" };
  }
}

export async function updateProfile(data: unknown) {
  try {
    const session = await requireAuth();
    const validated = z.object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      gender: z.enum(["male", "female"]).optional(),
      birthDate: z.string().optional(),
      profilePicture: z.string().optional(),
    }).parse(data);

    const [updated] = await db
      .update(users)
      .set(validated)
      .where(eq(users.id, session.userId))
      .returning({
        id: users.id,
        email: users.email,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        profilePicture: users.profilePicture,
        gender: users.gender,
        address: users.address,
        birthDate: users.birthDate,
      });

    return { success: true, user: updated };
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    if (error.name === "ZodError") {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to update profile" };
  }
}

export async function changePassword(data: unknown) {
  try {
    const session = await requireAuth();
    const validated = z.object({
      currentPassword: z.string().min(1, "Current password is required"),
      newPassword: z.string().min(6, "New password must be at least 6 characters"),
    }).parse(data);

    // Get user with password
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (!user) {
      return { error: "User not found" };
    }

    // Verify current password
    const { verifyPassword } = await import("@/lib/auth/utils");
    const isValid = await verifyPassword(validated.currentPassword, user.password);

    if (!isValid) {
      return { error: "Current password is incorrect" };
    }

    // Hash new password
    const hashedPassword = await hashPassword(validated.newPassword);

    // Update password
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, session.userId));

    return { success: true };
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    if (error.name === "ZodError") {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to change password" };
  }
}

