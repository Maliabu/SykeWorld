import { cookies } from "next/headers";
import { verifyToken } from "./utils";

export interface SessionUser {
  userId: string;
  email: string;
  userType: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  isSuperuser?: boolean;
  isStaff?: boolean;
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access")?.value;

  if (!accessToken) {
    return null;
  }

  try {
    const payload = await verifyToken(accessToken);
    return {
      userId: payload.userId,
      email: payload.email,
      userType: payload.userType || "guest",
      isSuperuser: payload.isSuperuser || false,
      isStaff: payload.isStaff || false,
      name: payload.name,
      username: payload.username,
      firstName: payload.firstName,
      lastName: payload.lastName,
    };
  } catch (error) {
    return null;
  }
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireStaff(): Promise<SessionUser> {
  const session = await requireAuth();
  if (session.userType !== "staff" && session.userType !== "admin" && !session.isSuperuser && !session.isStaff) {
    throw new Error("Forbidden: Staff access required");
  }
  return session;
}

export async function requireAdmin(): Promise<SessionUser> {
  const session = await requireAuth();
  if (session.userType !== "admin" && !session.isSuperuser) {
    throw new Error("Forbidden: Admin access required");
  }
  return session;
}

export async function canManageUsers(session: SessionUser): Promise<boolean> {
  return session.userType === "admin" || session.isSuperuser === true;
}


