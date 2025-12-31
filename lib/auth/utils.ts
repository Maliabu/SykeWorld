import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
);

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function signToken(payload: {
  userId: string;
  email: string;
  userType: string;
  isSuperuser?: boolean;
  isStaff?: boolean;
  name?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30m")
    .sign(secret);

  return token;
}

export async function signRefreshToken(payload: {
  userId: string;
  email: string;
}): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  return token;
}

export async function verifyToken(token: string): Promise<{
  userId: string;
  email: string;
  userType?: string;
  isSuperuser?: boolean;
  isStaff?: boolean;
  name?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}> {
  const { payload } = await jwtVerify(token, secret);
  return payload as {
    userId: string;
    email: string;
    userType?: string;
    isSuperuser?: boolean;
    isStaff?: boolean;
    name?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
  };
}

export function getAuthTokenFromHeaders(headers: Headers): string | null {
  const authHeader = headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return null;
}


