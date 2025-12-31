// app/api/send-reset-email/route.ts
import { NextResponse } from "next/server";
import { checkEmail, sendHtmlEmail } from "@/server/fetch.actions";
import { dbInsertToken } from "@/lib/actions/auth";
import { generateResetToken, hashToken } from "@/server/token";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    const account = await checkEmail(email);
    if (!account.exists || !account.userId) {
      return NextResponse.json({ success: false, error: "Account does not exist" }, { status: 400 });
    }

    const rawToken = generateResetToken();
    const tokenHash = hashToken(rawToken);

    // Use userId, not email
    const inserted = await dbInsertToken(account.userId, tokenHash);
    if (!inserted) {
      return NextResponse.json({ success: false, error: "Failed to store reset token" }, { status: 500 });
    }

    const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${rawToken}`;
    const sent = await sendHtmlEmail(email, "Password Reset", email, resetLink);
    if (!sent) {
      return NextResponse.json({ success: false, error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("send-reset-email error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
