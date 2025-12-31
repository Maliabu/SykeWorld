// lib/server/auth/tokens.ts
import crypto from "crypto";

// generate a secure random token
export function generateResetToken() {
  return crypto.randomBytes(32).toString("hex");
}

// hash token for storing in DB
export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
