"use server";

import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema/bookings";
import { requireStaff } from "@/lib/auth/session";
import { z } from "zod";
import nodemailer from "nodemailer";

// Email configuration - uses same config as booking emails
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "mail.sykeworld.com",
  port: parseInt(process.env.SMTP_PORT || "465"),
  secure: true,
  auth: {
    user: process.env.SMTP_USER || "support@sykeworld.com",
    pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD || "",
  },
});

// Get all subscribers
export async function getAllSubscribers() {
  try {
    await requireStaff();

    const allSubscribers = await db.select().from(subscriptions);
    return { success: true, subscribers: allSubscribers };
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Staff")) {
      return { error: "Unauthorized: Staff access required" };
    }
    return { error: "Failed to fetch subscribers" };
  }
}

// Send newsletter to all subscribers
export async function sendNewsletter(data: unknown) {
  try {
    await requireStaff();

    const validated = z.object({
      subject: z.string().min(1, "Subject is required"),
      body: z.string().min(1, "Email body is required"),
      fromName: z.string().optional(),
      fromEmail: z.string().email().optional(),
    }).parse(data);

    // Get all subscribers
    const subscribers = await db.select().from(subscriptions);
    
    if (subscribers.length === 0) {
      return { error: "No subscribers found" };
    }

    const fromName = validated.fromName || "Syke World Hotel";
    const fromEmail = validated.fromEmail || process.env.SMTP_USER || "support@sykeworld.com";

    // Send emails to all subscribers
    const results = await Promise.allSettled(
      subscribers.map(async (subscriber) => {
        try {
          await transporter.sendMail({
            from: `"${fromName}" <${fromEmail}>`,
            to: subscriber.email,
            subject: validated.subject,
            html: validated.body, // TipTap outputs HTML
            text: validated.body.replace(/<[^>]*>/g, ""), // Plain text fallback
          });
          return { email: subscriber.email, success: true };
        } catch (error: any) {
          console.error(`Failed to send to ${subscriber.email}:`, error);
          return { email: subscriber.email, success: false, error: error.message };
        }
      })
    );

    const successful = results.filter((r) => r.status === "fulfilled" && r.value.success).length;
    const failed = results.length - successful;

    return {
      success: true,
      total: subscribers.length,
      successful,
      failed,
      results: results.map((r) => 
        r.status === "fulfilled" ? r.value : { success: false, error: "Unknown error" }
      ),
    };
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Staff")) {
      return { error: "Unauthorized: Staff access required" };
    }
    if (error.name === "ZodError") {
      return { error: error.errors[0].message };
    }
    console.error("Newsletter send error:", error);
    return { error: error.message || "Failed to send newsletter" };
  }
}

