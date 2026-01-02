"use server";

import { db } from "@/lib/db";
import { payments, transactions } from "@/lib/db/schema/payments";
import { bookings, rooms, roomTypes } from "@/lib/db/schema";
import { users } from "@/lib/db/schema/users";
import { eq } from "drizzle-orm";
import { requireAuth, getSession } from "@/lib/auth/session";
import { z } from "zod";
import { sendBookingReceipt } from "@/mail/nodemailer";

// Determine if we're using sandbox/test mode
const PESAPAL_SANDBOX = process.env.PESAPAL_SANDBOX === "true" || 
  (process.env.NODE_ENV === "development" && process.env.PESAPAL_SANDBOX !== "false");
const PESAPAL_BASE_URL = process.env.PESAPAL_BASE_URL || 
  (PESAPAL_SANDBOX ? "https://cybqa.pesapal.com/pesapalv3" : "https://pay.pesapal.com/v3");

// Log which mode we're in (only in development)
if (process.env.NODE_ENV === "development") {
  console.log(`🔧 Pesapal Mode: ${PESAPAL_SANDBOX ? "SANDBOX (Test)" : "PRODUCTION"}`);
  console.log(`🔧 Pesapal Base URL: ${PESAPAL_BASE_URL}`);
}
const PESAPAL_CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY || "";
const PESAPAL_CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET || "";
const PESAPAL_CALLBACK_URL = process.env.PESAPAL_CALLBACK_URL || "";
const PESAPAL_IPN_URL = process.env.PESAPAL_IPN_URL || "";

// Helper function to get registered IPN IDs from Pesapal
// This is useful if you've registered IPN URLs in the dashboard but don't see the IDs
export async function getPesapalIpnIds() {
  try {
    const accessToken = await getPesapalToken();
    const response = await fetch(`${PESAPAL_BASE_URL}/api/URLSetup/GetIpnList`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to get IPN list:", errorText);
      return { error: "Failed to retrieve IPN list from Pesapal" };
    }

    const data = await response.json();
    return { success: true, ipnList: data };
  } catch (error: any) {
    console.error("Error getting IPN list:", error);
    return { error: error.message || "Failed to get IPN list" };
  }
}

// Helper function to register a new IPN URL and get its ID
export async function registerPesapalIpn(ipnUrl: string, notificationType: "GET" | "POST" = "POST") {
  try {
    const accessToken = await getPesapalToken();
    const response = await fetch(`${PESAPAL_BASE_URL}/api/URLSetup/RegisterIPN`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        url: ipnUrl,
        ipn_notification_type: notificationType,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to register IPN:", errorText);
      return { error: "Failed to register IPN URL" };
    }

    const data = await response.json();
    // Pesapal returns the IPN ID in the response
    return { success: true, ipnId: data.ipn_id || data.id, data };
  } catch (error: any) {
    console.error("Error registering IPN:", error);
    return { error: error.message || "Failed to register IPN" };
  }
}

// Get Pesapal Access Token
export async function getPesapalToken(): Promise<string> {
  if (!PESAPAL_CONSUMER_KEY || !PESAPAL_CONSUMER_SECRET) {
    throw new Error("Pesapal credentials not configured");
  }

  try {
    const response = await fetch(`${PESAPAL_BASE_URL}/api/Auth/RequestToken`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        consumer_key: PESAPAL_CONSUMER_KEY,
        consumer_secret: PESAPAL_CONSUMER_SECRET,
      }),
    });

    if (!response.ok) {
      let errorMessage = "Failed to get Pesapal token";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
        console.error("Pesapal token error response:", errorData);
      } catch (e) {
        const errorText = await response.text();
        console.error("Pesapal token error (text):", errorText);
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data.token) {
      console.error("Pesapal token response missing token:", data);
      throw new Error("Invalid response from Pesapal authentication");
    }
    return data.token;
  } catch (error: any) {
    console.error("Pesapal token fetch error:", error);
    throw new Error(`Pesapal token error: ${error.message || "Unknown error"}`);
  }
}

// Initiate Pesapal Payment
export async function initiatePesapalPayment(data: unknown) {
  try {
    const validated = z.object({
      bookingId: z.string().min(1, "Booking ID is required"),
      amount: z.number().positive("Amount must be positive"),
    }).parse(data);

    // Get booking details first
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, validated.bookingId))
      .limit(1);

    if (!booking) {
      return { error: "Booking not found" };
    }

    // Try to get session (works with custom JWT session)
    let session = await getSession();
    
    // If no JWT session, try to get NextAuth session
    if (!session) {
      try {
        const { getServerSession } = await import("next-auth/next");
        const { authOptions } = await import("@/app/api/auth/[...nextauth]/route");
        const nextAuthSession = await getServerSession(authOptions);
        
        if (nextAuthSession?.user?.email) {
          // Find user by email from NextAuth session
          const [user] = await db
            .select({ id: users.id, email: users.email, userType: users.userType })
            .from(users)
            .where(eq(users.email, nextAuthSession.user.email))
            .limit(1);
          
          if (user) {
            // Create a session-like object for NextAuth users
            session = {
              userId: user.id,
              email: user.email,
              userType: user.userType,
            };
          }
        }
      } catch (nextAuthError) {
        console.error("Error getting NextAuth session:", nextAuthError);
      }
    }

    // Verify booking belongs to user (if session exists)
    if (session && booking.userId !== session.userId) {
      return { error: "Unauthorized: This booking does not belong to you" };
    }
    
    // If no session at all, we can still proceed if booking exists
    // (useful for cases where user created booking but session expired)

    // Get access token
    let accessToken: string;
    try {
      accessToken = await getPesapalToken();
    } catch (error: any) {
      console.error("Pesapal token error:", error);
      return { error: `Failed to authenticate with Pesapal: ${error.message || "Unknown error"}` };
    }

    // Get user details for billing address from booking's userId
    const [user] = await db
      .select({
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        username: users.username,
      })
      .from(users)
      .where(eq(users.id, booking.userId))
      .limit(1);

    const firstName = user?.firstName || session?.firstName || session?.name?.split(" ")[0] || "";
    const lastName = user?.lastName || session?.lastName || session?.name?.split(" ").slice(1).join(" ") || "";
    const email = user?.email || session?.email || "";
    
    if (!email) {
      return { error: "User email not found. Please contact support." };
    }

    // Validate required Pesapal configuration
    if (!PESAPAL_CONSUMER_KEY || !PESAPAL_CONSUMER_SECRET) {
      console.error("Pesapal credentials not configured");
      return { error: "Payment service not configured. Please contact support." };
    }

    if (!PESAPAL_CALLBACK_URL) {
      console.error("Pesapal callback URL not configured");
      return { error: "Payment callback not configured. Please contact support." };
    }

    // Check if this is an admin booking (session user is admin)
    const isAdminBooking = session?.userType === "admin" || session?.userType === "staff";
    
    // Build callback URL - use separate admin callback route if this is an admin booking
    // This ensures admin bookings always redirect to admin dashboard
    let callbackUrl = PESAPAL_CALLBACK_URL;
    if (isAdminBooking) {
      try {
        const url = new URL(callbackUrl);
        // Replace /callback with /callback/admin for admin bookings
        callbackUrl = callbackUrl.replace("/callback", "/callback/admin");
        console.log("Admin booking detected - using admin callback URL:", callbackUrl);
      } catch (e) {
        // If URL parsing fails, use original callback URL
        console.warn("Could not modify callback URL for admin booking:", e);
      }
    }

    // Build request body - DO NOT include notification_id unless explicitly configured
    // Pesapal rejects empty or invalid IPN IDs, so we must omit the field entirely
    const requestBody: any = {
      id: validated.bookingId,
      currency: "UGX",
      amount: validated.amount,
      description: "Room Booking Payment",
      callback_url: callbackUrl,
      billing_address: {
        email_address: email,
        phone_number: "",
        country_code: "UG",
        first_name: firstName,
        last_name: lastName,
      },
    };

    // Step 2: Get or Register IPN URL and get IPN ID
    // According to Pesapal docs: https://developer.pesapal.com/how-to-integrate/e-commerce/api-30-json/registeripnurl
    // We must register IPN URL before submitting orders
    let ipnId: string | null = null;
    
    // Determine IPN URL - use explicit setting or derive from callback URL
    let ipnUrlToUse = PESAPAL_IPN_URL;
    if (!ipnUrlToUse && PESAPAL_CALLBACK_URL) {
      try {
        const callbackUrl = new URL(PESAPAL_CALLBACK_URL);
        // Replace /callback with /ipn
        ipnUrlToUse = PESAPAL_CALLBACK_URL.replace(/\/callback(\/)?$/, "/ipn");
        // If callback doesn't end with /callback, append /api/pesapal/ipn
        if (ipnUrlToUse === PESAPAL_CALLBACK_URL) {
          ipnUrlToUse = `${callbackUrl.origin}/api/pesapal/ipn`;
        }
        console.log("📡 Auto-derived IPN URL from callback:", ipnUrlToUse);
      } catch (e) {
        console.warn("⚠️ Could not derive IPN URL from callback URL");
      }
    }
    
    // If we have an IPN URL, get or register it
    if (ipnUrlToUse && ipnUrlToUse.trim().length > 0) {
      try {
        console.log("🔍 Checking for existing IPN registration...");
        
        // Step 2a: Get list of registered IPNs
        // Docs: https://developer.pesapal.com/how-to-integrate/e-commerce/api-30-json/getregisteredipn
        const ipnListResult = await getPesapalIpnIds();
        
        if (ipnListResult.success && ipnListResult.ipnList) {
          // Handle array response (standard format)
          const ipnList = Array.isArray(ipnListResult.ipnList) 
            ? ipnListResult.ipnList 
            : [ipnListResult.ipnList];
          
          // Find existing IPN with matching URL
          const normalizedTargetUrl = new URL(ipnUrlToUse).href.replace(/\/$/, "");
          const existingIpn = ipnList.find((ipn: any) => {
            const url = ipn.url || ipn.ipn_url || "";
            if (!url) return false;
            try {
              return new URL(url).href.replace(/\/$/, "") === normalizedTargetUrl;
            } catch {
              return url === ipnUrlToUse;
            }
          });
          
          if (existingIpn) {
            ipnId = existingIpn.ipn_id || existingIpn.id;
            if (ipnId) {
              console.log("✅ Found existing IPN ID:", ipnId);
            }
          }
        }
        
        // Step 2b: If not found, register new IPN URL
        // Docs: https://developer.pesapal.com/how-to-integrate/e-commerce/api-30-json/registeripnurl
        if (!ipnId) {
          console.log("📝 Registering new IPN URL...");
          const registerResult = await registerPesapalIpn(ipnUrlToUse, "POST");
          
          if (registerResult.success && registerResult.ipnId) {
            ipnId = registerResult.ipnId;
            console.log("✅ Successfully registered IPN, ID:", ipnId);
          } else {
            console.error("❌ Failed to register IPN:", registerResult.error);
            // Continue without IPN - payment will work but no IPN notifications
          }
        }
      } catch (error: any) {
        console.error("❌ Error with IPN registration:", error.message);
        // Continue without IPN - payment will work but no IPN notifications
      }
    } else {
      console.warn("⚠️ No IPN URL configured - payments will work but no IPN notifications");
    }
    
    // Add IPN ID to request if we have one
    if (ipnId) {
      requestBody.notification_id = ipnId;
      console.log("✅ Using IPN ID in payment request:", ipnId);
    } else {
      // Explicitly ensure notification_id is NOT in the request body
      console.log("IPN not configured - omitting notification_id from request");
    }

    // Log request body for debugging
    console.log("Pesapal request body (sanitized):", JSON.stringify({
      ...requestBody,
      billing_address: {
        ...requestBody.billing_address,
        email_address: "[REDACTED]",
      }
    }, null, 2));
    
    // Check if notification_id is accidentally included
    if ('notification_id' in requestBody) {
      console.log("WARNING: notification_id is in request body:", requestBody.notification_id);
    } else {
      console.log("OK: notification_id is NOT in request body");
    }

    // Register order with Pesapal
    let orderResponse: Response;
    try {
      const requestUrl = `${PESAPAL_BASE_URL}/api/Transactions/SubmitOrderRequest`;
      console.log("Sending request to:", requestUrl);
      
      orderResponse = await fetch(requestUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log("Pesapal response status:", orderResponse.status, orderResponse.statusText);
    } catch (error: any) {
      console.error("Pesapal order request error:", error);
      return { error: `Failed to submit payment request: ${error.message || "Network error"}` };
    }

    // Parse response body first to check for errors even if status is 200
    let orderData: any;
    try {
      orderData = await orderResponse.json();
      console.log("Pesapal response data:", JSON.stringify(orderData, null, 2));
    } catch (e) {
      const errorText = await orderResponse.text();
      console.error("Pesapal order error (text):", errorText);
      return { error: "Invalid response from payment service" };
    }

    // Check if response contains an error (even with 200 status)
    if (orderData.error || !orderResponse.ok) {
      let errorMessage = "Failed to initiate payment";
      const errorData = orderData;
      
      if (errorData?.error) {
        console.error("Pesapal order error (JSON):", JSON.stringify(errorData, null, 2));
        errorMessage = errorData.error.message || errorData.error.code || errorMessage;
        
        // Special handling for IPN errors - likely a Pesapal account configuration issue
        if (errorData.error.code === "InvalidIpnId") {
          console.error("===========================================");
          console.error("IPN CONFIGURATION ERROR DETECTED");
          console.error("===========================================");
          console.error("This error occurs even though we're NOT sending notification_id.");
          console.error("This suggests a Pesapal account-level configuration issue.");
          console.error("");
          console.error("SOLUTION: Check your Pesapal merchant dashboard:");
          console.error("1. Go to Settings → IPN/Notifications");
          console.error("2. Remove any default or invalid IPN URLs");
          console.error("3. OR configure a valid IPN URL if you want to use IPN");
          console.error("4. Save changes and try again");
          console.error("===========================================");
          return { 
            error: "IPN configuration error in your Pesapal account. Please check your Pesapal dashboard → Settings → IPN/Notifications and remove any invalid IPN URLs, or configure a valid one if needed." 
          };
        }
      }
      
      return { error: errorMessage };
    }

    // orderData is already parsed above, now extract the success data
    const redirectUrl = orderData.redirect_url || orderData.redirectUrl;
    const trackingId = orderData.order_tracking_id || orderData.orderTrackingId;

    if (!redirectUrl) {
      console.error("Pesapal response missing redirect_url:", orderData);
      return { error: "Payment service did not return a redirect URL" };
    }

    if (!trackingId) {
      console.error("Pesapal response missing tracking_id:", orderData);
      return { error: "Payment service did not return a tracking ID" };
    }

    // Create payment record
    // Use booking's userId (booking already has the correct user)
    // This works even if session is not available (e.g., NextAuth user without JWT yet)
    const userIdToUse = session?.userId || booking.userId;
    
    if (!userIdToUse) {
      return { error: "Unable to determine user for payment. Please sign in again." };
    }
    
    let payment;
    try {
      [payment] = await db
        .insert(payments)
        .values({
          bookingId: validated.bookingId,
          userId: userIdToUse,
          amount: validated.amount.toString(),
          status: "PENDING", // Always use uppercase for consistency
          pesapalOrderTrackingId: trackingId,
          pesapalMerchantReference: validated.bookingId,
        })
        .returning();
    } catch (error: any) {
      console.error("Failed to create payment record:", error);
      return { error: "Failed to save payment record" };
    }

    // Create transaction record
    try {
      await db.insert(transactions).values({
        bookingId: validated.bookingId,
        userId: userIdToUse,
        pesapalReference: trackingId,
        merchantReference: validated.bookingId,
        amount: validated.amount.toString(),
        status: "PENDING",
        paymentMethod: "PESAPAL",
      });
    } catch (error: any) {
      console.error("Failed to create transaction record:", error);
      // Don't fail the whole process if transaction record fails
    }

    return {
      success: true,
      redirectUrl,
      trackingId,
      paymentId: payment.id,
    };
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    if (error.name === "ZodError") {
      return { error: error.errors[0].message };
    }
    return { error: error.message || "Failed to initiate payment" };
  }
}

// Verify Pesapal Transaction
export async function verifyPesapalTransaction(trackingId: string) {
  try {
    await requireAuth();

    const accessToken = await getPesapalToken();

    const response = await fetch(
      `${PESAPAL_BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${trackingId}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      return { error: "Failed to verify transaction" };
    }

    const data = await response.json();

    // Update payment status
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.pesapalOrderTrackingId, trackingId))
      .limit(1);

    if (payment) {
      await db
        .update(payments)
        .set({
          status: data.payment_status_description === "COMPLETED" ? "COMPLETED" : "PENDING",
        })
        .where(eq(payments.id, payment.id));

      // Update transaction
      await db
        .update(transactions)
        .set({
          status: data.payment_status_description || "PENDING",
        })
        .where(eq(transactions.pesapalReference, trackingId));

      // If payment completed, update booking and send receipt
      if (data.payment_status_description === "COMPLETED") {
        await db
          .update(bookings)
          .set({ status: "confirmed" })
          .where(eq(bookings.id, payment.bookingId));

        // Get booking details for receipt
        const [booking] = await db
          .select({
            id: bookings.id,
            checkIn: bookings.checkIn,
            checkOut: bookings.checkOut,
            guests: bookings.guests,
            specialRequests: bookings.specialRequests,
            totalPrice: bookings.totalPrice,
            userId: bookings.userId,
            roomId: bookings.roomId,
          })
          .from(bookings)
          .where(eq(bookings.id, payment.bookingId))
          .limit(1);

        if (booking) {
          // Get room and room type details
          const [room] = await db
            .select({
              roomNumber: rooms.roomNumber,
              roomTypeId: rooms.roomTypeId,
            })
            .from(rooms)
            .where(eq(rooms.id, booking.roomId))
            .limit(1);

          if (room) {
            const [roomType] = await db
              .select({
                name: roomTypes.name,
              })
              .from(roomTypes)
              .where(eq(roomTypes.id, room.roomTypeId))
              .limit(1);

            // Get user details
            const [customer] = await db
              .select({
                email: users.email,
                firstName: users.firstName,
                lastName: users.lastName,
              })
              .from(users)
              .where(eq(users.id, booking.userId))
              .limit(1);

            if (customer && customer.email) {
              const customerName = 
                (customer.firstName && customer.lastName 
                  ? `${customer.firstName} ${customer.lastName}` 
                  : customer.email.split("@")[0]);

              const nights = Math.ceil(
                (new Date(booking.checkOut || "").getTime() - new Date(booking.checkIn || "").getTime()) /
                  (1000 * 60 * 60 * 24)
              );

              // Send receipt email
              try {
                await sendBookingReceipt(customer.email, customerName, {
                  bookingId: booking.id,
                  roomNumber: room.roomNumber,
                  roomType: roomType?.name || "Unknown",
                  checkIn: booking.checkIn || "",
                  checkOut: booking.checkOut || "",
                  nights,
                  guests: booking.guests,
                  totalPrice: booking.totalPrice || "0",
                  paymentMethod: "online",
                  specialRequests: booking.specialRequests || undefined,
                });
              } catch (emailError) {
                console.error("Failed to send receipt email:", emailError);
                // Don't fail the payment if email fails
              }
            }
          }
        }
      }
    }

    return {
      success: true,
      status: data.payment_status_description,
      data,
    };
  } catch (error: any) {
    return { error: error.message || "Failed to verify transaction" };
  }
}

// Handle Pesapal IPN Callback
export async function handlePesapalIPN(data: unknown) {
  try {
    const validated = z.object({
      OrderTrackingId: z.string(),
      OrderMerchantReference: z.string(),
    }).parse(data);

    return await verifyPesapalTransaction(validated.OrderTrackingId);
  } catch (error: any) {
    return { error: error.message || "Failed to handle IPN" };
  }
}

