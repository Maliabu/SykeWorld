import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookings, rooms, roomTypes } from "@/lib/db/schema";
import { payments, transactions } from "@/lib/db/schema/payments";
import { users } from "@/lib/db/schema/users";
import { eq, or } from "drizzle-orm";
// Get Pesapal Access Token (duplicated here to avoid circular dependencies)
async function getPesapalToken(): Promise<string> {
  const PESAPAL_SANDBOX = process.env.PESAPAL_SANDBOX === "true" || 
    (process.env.NODE_ENV === "development" && process.env.PESAPAL_SANDBOX !== "false");
  const PESAPAL_BASE_URL = process.env.PESAPAL_BASE_URL || 
    (PESAPAL_SANDBOX ? "https://cybqa.pesapal.com/pesapalv3" : "https://pay.pesapal.com/v3");
  const PESAPAL_CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY || "";
  const PESAPAL_CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET || "";

  if (!PESAPAL_CONSUMER_KEY || !PESAPAL_CONSUMER_SECRET) {
    throw new Error("Pesapal credentials not configured");
  }

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
    const errorText = await response.text();
    throw new Error(`Failed to get Pesapal token: ${errorText}`);
  }

  const data = await response.json();
  if (!data.token) {
    throw new Error("Invalid response from Pesapal authentication");
  }
  return data.token;
}
import { sendBookingReceipt } from "@/mail/nodemailer";

// Determine if we're using sandbox/test mode
const PESAPAL_SANDBOX = process.env.PESAPAL_SANDBOX === "true" || 
  (process.env.NODE_ENV === "development" && process.env.PESAPAL_SANDBOX !== "false");
const PESAPAL_BASE_URL = process.env.PESAPAL_BASE_URL || 
  (PESAPAL_SANDBOX ? "https://cybqa.pesapal.com/pesapalv3" : "https://pay.pesapal.com/v3");

/**
 * Pesapal IPN (Instant Payment Notification) Endpoint
 * 
 * Pesapal sends POST requests to this endpoint when payment status changes.
 * 
 * Expected payload from Pesapal:
 * {
 *   "OrderTrackingId": "abc123...",
 *   "OrderMerchantReference": "booking-id-or-payment-id"
 * }
 * 
 * This endpoint:
 * 1. Receives payment status updates from Pesapal
 * 2. Verifies the transaction with Pesapal API
 * 3. Updates booking and payment status in database
 * 4. Sends receipt email if payment completed
 * 5. Always returns 200 OK to Pesapal (they'll retry if needed)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    console.log("IPN received from Pesapal:", JSON.stringify(body, null, 2));
    
    const { OrderTrackingId, OrderMerchantReference } = body;
    
    if (!OrderTrackingId || !OrderMerchantReference) {
      console.error("IPN missing required fields:", { OrderTrackingId, OrderMerchantReference });
      // Still return 200 to Pesapal - they'll retry if needed
      return NextResponse.json({ message: "IPN received - missing fields" }, { status: 200 });
    }

    // Get Pesapal access token
    let accessToken: string;
    try {
      accessToken = await getPesapalToken();
    } catch (error: any) {
      console.error("Failed to get Pesapal token for IPN:", error);
      // Return 200 so Pesapal doesn't keep retrying immediately
      return NextResponse.json({ message: "IPN received - token error" }, { status: 200 });
    }

    // Verify transaction status with Pesapal
    let transactionStatus: any;
    try {
      const statusResponse = await fetch(
        `${PESAPAL_BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${OrderTrackingId}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!statusResponse.ok) {
        console.error("Failed to get transaction status from Pesapal");
        return NextResponse.json({ message: "IPN received - status check failed" }, { status: 200 });
      }

      transactionStatus = await statusResponse.json();
      console.log("Transaction status from Pesapal:", JSON.stringify(transactionStatus, null, 2));
    } catch (error: any) {
      console.error("Error verifying transaction with Pesapal:", error);
      return NextResponse.json({ message: "IPN received - verification error" }, { status: 200 });
    }

    // Find the payment/transaction record
    // OrderMerchantReference could be booking ID (as set in pesapalMerchantReference) or payment ID
    // Try to find by payment ID first, then by booking ID (pesapalMerchantReference)
    let [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, OrderMerchantReference))
      .limit(1);

    // If not found by ID, try to find by booking ID (which is what we set as merchant reference)
    if (!payment) {
      [payment] = await db
        .select()
        .from(payments)
        .where(eq(payments.pesapalMerchantReference, OrderMerchantReference))
        .limit(1);
    }

    // Also try to find by tracking ID as fallback
    if (!payment) {
      [payment] = await db
        .select()
        .from(payments)
        .where(eq(payments.pesapalOrderTrackingId, OrderTrackingId))
        .limit(1);
    }

    if (!payment) {
      console.error("Payment not found for IPN:", { OrderMerchantReference, OrderTrackingId });
      // Still return 200 - might be a duplicate notification
      return NextResponse.json({ message: "IPN received - payment not found" }, { status: 200 });
    }

    // Update payment status
    // Pesapal returns status in different fields - check all possibilities
    const paymentStatus = transactionStatus.payment_status_description || 
                          transactionStatus.status || 
                          transactionStatus.payment_status ||
                          "UNKNOWN";
    
    console.log("Payment status from Pesapal:", {
      payment_status_description: transactionStatus.payment_status_description,
      status: transactionStatus.status,
      payment_status: transactionStatus.payment_status,
      finalStatus: paymentStatus,
      fullResponse: JSON.stringify(transactionStatus, null, 2)
    });
    
    const isCompleted = paymentStatus === "COMPLETED" || 
                        paymentStatus === "COMPLETE" ||
                        paymentStatus?.toUpperCase() === "COMPLETED" ||
                        paymentStatus?.toUpperCase() === "COMPLETE" ||
                        transactionStatus.status === "COMPLETED" ||
                        transactionStatus.status === "COMPLETE";
    
    // Always use uppercase "COMPLETED" for consistency
    const finalPaymentStatus = isCompleted ? "COMPLETED" : (paymentStatus?.toUpperCase() || "PENDING");
    
    await db
      .update(payments)
      .set({
        status: finalPaymentStatus,
      })
      .where(eq(payments.id, payment.id));

    console.log("Updated payment status:", { paymentId: payment.id, status: finalPaymentStatus, isCompleted });

    // Update transaction record if exists (find by merchantReference which should match OrderMerchantReference or by pesapalReference)
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(
        or(
          eq(transactions.merchantReference, OrderMerchantReference),
          eq(transactions.pesapalReference, OrderTrackingId)
        )
      )
      .limit(1);

    if (transaction) {
      // Normalize transaction status to uppercase for consistency
      const finalTransactionStatus = isCompleted ? "COMPLETED" : (paymentStatus?.toUpperCase() || "PENDING");
      await db
        .update(transactions)
        .set({
          status: finalTransactionStatus,
          updated: new Date(),
        })
        .where(eq(transactions.id, transaction.id));
    }

    // If payment completed, update booking and send receipt
    if (isCompleted) {
      console.log("Payment completed - updating booking status for booking:", payment.bookingId);
      
      // Update booking status - CRITICAL: Always update when payment is completed
      if (payment.bookingId) {
        try {
          const updateResult = await db
            .update(bookings)
            .set({ status: "confirmed" })
            .where(eq(bookings.id, payment.bookingId))
            .returning();
          
          console.log("Booking status update result:", updateResult);
          
          if (updateResult.length === 0) {
            console.error("❌ Failed to update booking - booking not found:", payment.bookingId);
          } else {
            console.log("✅ Booking status updated to 'confirmed' for booking:", payment.bookingId);
          }
        } catch (bookingUpdateError: any) {
          console.error("❌ ERROR updating booking status:", bookingUpdateError);
          console.error("Error details:", {
            message: bookingUpdateError.message,
            bookingId: payment.bookingId,
            paymentId: payment.id
          });
          // Don't throw - continue with receipt sending
        }

        // Get booking details for receipt
        const [booking] = await db
          .select({
            id: bookings.id,
            userId: bookings.userId,
            roomId: bookings.roomId,
            checkIn: bookings.checkIn,
            checkOut: bookings.checkOut,
            guests: bookings.guests,
            totalPrice: bookings.totalPrice,
            specialRequests: bookings.specialRequests,
          })
          .from(bookings)
          .where(eq(bookings.id, payment.bookingId))
          .limit(1);

        if (booking) {
          // Get room and user details
          const [room] = await db
            .select({
              roomNumber: rooms.roomNumber,
              roomTypeId: rooms.roomTypeId,
            })
            .from(rooms)
            .where(eq(rooms.id, booking.roomId))
            .limit(1);

          const [roomType] = room
            ? await db
                .select({ name: roomTypes.name })
                .from(roomTypes)
                .where(eq(roomTypes.id, room.roomTypeId))
                .limit(1)
            : [];

          const [customer] = await db
            .select({
              email: users.email,
              firstName: users.firstName,
              lastName: users.lastName,
              username: users.username,
            })
            .from(users)
            .where(eq(users.id, booking.userId))
            .limit(1);

          if (customer?.email && room && roomType && booking.checkIn && booking.checkOut) {
            const nights = Math.ceil(
              (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) /
                (1000 * 60 * 60 * 24)
            );

            const customerName =
              customer.firstName && customer.lastName
                ? `${customer.firstName} ${customer.lastName}`
                : customer.username || customer.email.split("@")[0] || "Guest";

            // Send receipt email
            try {
              await sendBookingReceipt(customer.email, customerName, {
                bookingId: booking.id,
                roomNumber: room.roomNumber,
                roomType: roomType.name,
                checkIn: booking.checkIn,
                checkOut: booking.checkOut,
                nights,
                guests: booking.guests,
                totalPrice: booking.totalPrice,
                paymentMethod: "Online Payment",
                specialRequests: booking.specialRequests || undefined,
              });
              console.log("Receipt email sent for booking:", booking.id);
            } catch (emailError) {
              console.error("Failed to send receipt email:", emailError);
              // Don't fail the IPN - email is not critical
            }
          }
        }
      }
    }

    console.log("IPN processed successfully for payment:", payment.id);
    
    // Always return 200 OK to Pesapal
    return NextResponse.json(
      { 
        message: "IPN received and processed",
        status: paymentStatus 
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("IPN processing error:", error);
    // Always return 200 to Pesapal - they'll retry if it's a temporary error
    // If we return an error status, Pesapal will keep retrying immediately
    return NextResponse.json(
      { 
        message: "IPN received - processing error",
        error: error.message 
      },
      { status: 200 }
    );
  }
}

// Also handle GET requests (some payment gateways send GET for IPN)
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const OrderTrackingId = searchParams.get("OrderTrackingId");
  const OrderMerchantReference = searchParams.get("OrderMerchantReference");

  if (!OrderTrackingId || !OrderMerchantReference) {
    return NextResponse.json({ message: "IPN received - missing parameters" }, { status: 200 });
  }

  // Convert GET to POST format and process
  return POST(
    new NextRequest(req.url, {
      method: "POST",
      body: JSON.stringify({ OrderTrackingId, OrderMerchantReference }),
      headers: { "Content-Type": "application/json" },
    })
  );
}

