"use server";

import { db } from "@/lib/db";
import { passwordResetTokens, users } from "@/lib/db/schema/users";
import { hashPassword, verifyPassword, signToken, signRefreshToken } from "@/lib/auth/utils";
import { registerSchema, loginSchema, googleLoginSchema } from "@/lib/validations/auth";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
// app/actions/sendResetEmail.ts
import { checkEmail, sendHtmlEmail } from "@/server/fetch.actions";
import { generateResetToken, hashToken } from "@/server/token";
import { logActivity } from "@/lib/utils/activityLog";
import { getSession } from "@/lib/auth/session";

export async function registerGuest(data: z.infer<typeof registerSchema>) {
  try {
    const validated = registerSchema.parse({ ...data, userType: "guest" });
    
    // Check if email already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, validated.email))
      .limit(1);

    if (existingUser.length > 0) {
      return { error: "Email already exists" };
    }

    // Check if phone already exists (if provided)
    if (validated.phone) {
      const existingPhone = await db
        .select()
        .from(users)
        .where(eq(users.phone, validated.phone))
        .limit(1);

      if (existingPhone.length > 0) {
        return { error: "Phone number already exists" };
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(validated.password);
    const username = validated.email.split("@")[0];

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email: validated.email,
        username,
        password: hashedPassword,
        firstName: validated.firstName,
        lastName: validated.lastName,
        phone: validated.phone,
        userType: "guest",
        isActive: true,
      })
      .returning();

    // Generate tokens
    const accessToken = await signToken({
      userId: newUser.id,
      email: newUser.email,
      userType: newUser.userType,
    });

    const refreshToken = await signRefreshToken({
      userId: newUser.id,
      email: newUser.email,
    });

    // Set cookies
    const cookieStore = await cookies();
    cookieStore.set("access", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 30, // 30 minutes
    });

    cookieStore.set("refresh", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return {
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
      },
      tokens: {
        access: accessToken,
        refresh: refreshToken,
      },
    };
  } catch (error: any) {
    if (error.name === "ZodError") {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to register user" };
  }
}
export async function dbInsertToken(userId: string, tokenHash: string) {
  const result = await db.insert(passwordResetTokens).values({
    userId,
    tokenHash,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    createdAt: new Date(),
  });
  console.log("Inserted token:", result);
  return !!result;
}

export async function registerStaff(data: z.infer<typeof registerSchema>) {
  try {
    const validated = registerSchema.parse({ ...data, userType: "staff" });
    
    // Check if email already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, validated.email))
      .limit(1);

    if (existingUser.length > 0) {
      return { error: "Email already exists" };
    }

    // Check if phone already exists (if provided)
    if (validated.phone) {
      const existingPhone = await db
        .select()
        .from(users)
        .where(eq(users.phone, validated.phone))
        .limit(1);

      if (existingPhone.length > 0) {
        return { error: "Phone number already exists" };
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(validated.password);
    const username = validated.email.split("@")[0];

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email: validated.email,
        username,
        password: hashedPassword,
        firstName: validated.firstName,
        lastName: validated.lastName,
        phone: validated.phone,
        userType: "staff",
        isActive: true,
        isStaff: true,
      })
      .returning();

    // Generate tokens
    const accessToken = await signToken({
      userId: newUser.id,
      email: newUser.email,
      userType: newUser.userType,
    });

    const refreshToken = await signRefreshToken({
      userId: newUser.id,
      email: newUser.email,
    });

    // Set cookies
    const cookieStore = await cookies();
    cookieStore.set("access", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 30,
    });

    cookieStore.set("refresh", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });

    return {
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
      },
      tokens: {
        access: accessToken,
        refresh: refreshToken,
      },
    };
  } catch (error: any) {
    if (error.name === "ZodError") {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to register staff" };
  }
}

export async function login(data: unknown) {
  try {
    const validated = loginSchema.parse(data);

    // Normalize email
    const email = validated.email.toLowerCase();

    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // Do NOT reveal which field is wrong
    if (!user) {
      return { error: "Invalid email or password" };
    }

    // Verify password (bcrypt.compare under the hood)
    const isValidPassword = await verifyPassword(
      validated.password,
      user.password
    );

    if (!isValidPassword) {
      return { error: "Invalid email or password" };
    }

    // Check account status
    if (!user.isActive || user.isDisabled) {
      return { error: "Account is disabled" };
    }

    // Update last login and set logged in status
    await db
      .update(users)
      .set({ 
        lastLogin: new Date(),
        isLoggedIn: true,
      })
      .where(eq(users.id, user.id));

    // Generate JWTs
    const accessToken = await signToken({
      userId: user.id,
      email: user.email,
      userType: user.userType,
      isSuperuser: user.isSuperuser || false,
      isStaff: user.isStaff || false,
      name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username,
      username: user.username,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
    });

    const refreshToken = await signRefreshToken({
      userId: user.id,
      email: user.email,
    });

    // Set cookies
    const cookieStore = await cookies();

    cookieStore.set("access", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 30, // 30 min
      path: "/",
    });

    cookieStore.set("refresh", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
      },
    };
  } catch (error: any) {
    if (error?.name === "ZodError") {
      return { error: error.errors[0].message };
    }

    console.error("Login error:", error);
    return { error: "Failed to login" };
  }
}

export async function googleLogin(data: unknown) {
  try {
    const validated = googleLoginSchema.parse(data);

    // Verify token with Google
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${validated.idToken}`
    );

    if (!response.ok) {
      return { error: "Invalid Google token" };
    }

    const googleData = await response.json();
    const email = googleData.email;

    if (!email) {
      return { error: "Email not found in token" };
    }

    // Get or create user
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      const username = email.split("@")[0];
      const [newUser] = await db
        .insert(users)
        .values({
          email,
          username,
          password: "", // No password for OAuth users
          userType: "guest",
          isActive: true,
          isVerified: true,
        })
        .returning();
      user = newUser;
    }

    // Generate tokens
    const accessToken = await signToken({
      userId: user.id,
      email: user.email,
      userType: user.userType,
      isSuperuser: user.isSuperuser || false,
      isStaff: user.isStaff || false,
      name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username,
      username: user.username,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
    });

    const refreshToken = await signRefreshToken({
      userId: user.id,
      email: user.email,
    });

    // Set cookies
    const cookieStore = await cookies();
    cookieStore.set("access", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 30,
    });

    cookieStore.set("refresh", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });

    // Update last login and set logged in status
    await db
      .update(users)
      .set({ 
        lastLogin: new Date(),
        isLoggedIn: true,
      })
      .where(eq(users.id, user.id));

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
      },
      tokens: {
        access: accessToken,
        refresh: refreshToken,
      },
    };
  } catch (error: any) {
    if (error.name === "ZodError") {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to login with Google" };
  }
}

export async function logout() {
  const cookieStore = await cookies();
  
  // Get user info before logging out for activity log
  const session = await getSession();
  
  // Update logged in status
  if (session) {
    await db
      .update(users)
      .set({ isLoggedIn: false })
      .where(eq(users.id, session.userId));
  }
  
  cookieStore.delete("access");
  cookieStore.delete("refresh");
  
  // Log activity
  if (session) {
    await logActivity({
      action: "LOGOUT",
      entityType: "user",
      entityId: session.userId,
      description: `User logged out: ${session.email}`,
      metadata: { email: session.email },
    });
  }
  
  return { success: true };
}

export async function whoami() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access")?.value;

  if (!accessToken) {
    return { error: "Not authenticated" };
  }

  try {
    const { verifyToken } = await import("@/lib/auth/utils");
    const payload = await verifyToken(accessToken);

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        userType: users.userType,
        username: users.username,
        isSuperuser: users.isSuperuser,
        isStaff: users.isStaff,
      })
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (!user) {
      return { error: "User not found" };
    }

    // Update logged in status and last login
    try {
      const updateResult = await db
        .update(users)
        .set({ 
          isLoggedIn: true,
          lastLogin: new Date(),
        })
        .where(eq(users.id, user.id))
        .returning({ id: users.id, isLoggedIn: users.isLoggedIn });
      
      console.log("whoami: Updated user login status:", updateResult);
    } catch (updateError) {
      console.error("whoami: Failed to update login status:", updateError);
      // Continue anyway - don't fail the whole request
    }

    return { success: true, user };
  } catch (error) {
    return { error: "Invalid token" };
  }
}


export async function sendResetEmail(email: string) {
  // Check if user exists
  const account = await checkEmail(email);
  if (!account.exists) {
    return { success: false, error: "Account does not exist" };
  }

  // Generate & hash token
  const rawToken = generateResetToken();
  const tokenHash = hashToken(rawToken);

  // Store token in DB
  const inserted = await dbInsertToken(email, tokenHash);
  if (!inserted) {
    return { success: false, error: "Failed to store reset token" };
  }

  // Build reset link
  const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${rawToken}`;

  // Send email
  const sent = await sendHtmlEmail(email, "Password Reset", email, resetLink);
  if (!sent) {
    return { success: false, error: "Failed to send email" };
  }

  return { success: true };
}
