import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { payments, bookings, transactions, rooms, roomTypes, users } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";
import { getPesapalToken } from "@/lib/actions/pesapal";
import { sendBookingReceipt } from "@/mail/nodemailer";

// Determine if we're using sandbox/test mode
const PESAPAL_SANDBOX = process.env.PESAPAL_SANDBOX === "true" || 
  (process.env.NODE_ENV === "development" && process.env.PESAPAL_SANDBOX !== "false");
const PESAPAL_BASE_URL = process.env.PESAPAL_BASE_URL || 
  (PESAPAL_SANDBOX ? "https://cybqa.pesapal.com/pesapalv3" : "https://pay.pesapal.com/v3");

/**
 * Pesapal Callback Endpoint
 * 
 * Pesapal redirects users here after payment (success or failure).
 * 
 * Query parameters from Pesapal:
 * - OrderTrackingId: Pesapal's tracking ID for the transaction
 * - OrderMerchantReference: Your booking/payment ID
 * 
 * This endpoint:
 * 1. Receives the redirect from Pesapal
 * 2. Verifies the payment status
 * 3. Updates booking status if payment completed
 * 4. Redirects user to appropriate page (success/failure)
 */
export async function GET(req: NextRequest) {
  // Extract parameters outside try block so they're available in catch
  const searchParams = req.nextUrl.searchParams;
  const OrderTrackingId = searchParams.get("OrderTrackingId");
  const OrderMerchantReference = searchParams.get("OrderMerchantReference");

  console.log("Pesapal PUBLIC callback received:", { OrderTrackingId, OrderMerchantReference });

  if (!OrderTrackingId || !OrderMerchantReference) {
    console.error("Public callback missing required parameters");
    return redirect("/booking?error=missing_parameters");
  }

  try {

    // Find the payment record (OrderMerchantReference is the booking ID)
    let [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.pesapalMerchantReference, OrderMerchantReference))
      .limit(1);

    // Try by tracking ID if not found
    if (!payment) {
      [payment] = await db
        .select()
        .from(payments)
        .where(eq(payments.pesapalOrderTrackingId, OrderTrackingId))
        .limit(1);
    }

    if (payment) {
      try {
        // Verify payment status with Pesapal (no auth required for callback)
        let paymentStatus = payment.status; // Default to existing status
        
        try {
          const accessToken = await getPesapalToken();
          
          // Create abort controller for timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
          
          const response = await fetch(
            `${PESAPAL_BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${OrderTrackingId}`,
            {
              method: "GET",
              headers: {
                Accept: "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
              signal: controller.signal,
            }
          );
          
          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            paymentStatus = data.payment_status_description || data.status || payment.status;
            const isCompleted = paymentStatus === "COMPLETED" || 
                               paymentStatus === "COMPLETE" || 
                               paymentStatus?.toUpperCase() === "COMPLETED" ||
                               paymentStatus?.toUpperCase() === "COMPLETE" ||
                               data.status === "COMPLETED" ||
                               data.status === "COMPLETE";
            
            // Always use uppercase "COMPLETED" for consistency
            const finalPaymentStatus = isCompleted ? "COMPLETED" : (paymentStatus?.toUpperCase() || "PENDING");
            
            // Update payment status
            await db
              .update(payments)
              .set({
                status: finalPaymentStatus,
              })
              .where(eq(payments.id, payment.id));
            
            // Update booking status if payment completed - CRITICAL: Always update when payment is completed
            if (isCompleted && payment.bookingId) {
              try {
                const updateResult = await db
                  .update(bookings)
                  .set({ status: "confirmed" })
                  .where(eq(bookings.id, payment.bookingId))
                  .returning();
                
                if (updateResult.length === 0) {
                  console.error("❌ Failed to update booking - booking not found:", payment.bookingId);
                } else {
                  console.log("✅ Booking status updated to 'confirmed' via callback for booking:", payment.bookingId);
                }
              } catch (bookingUpdateError: any) {
                console.error("❌ ERROR updating booking status in callback:", bookingUpdateError);
                console.error("Error details:", {
                  message: bookingUpdateError.message,
                  bookingId: payment.bookingId,
                  paymentId: payment.id
                });
                // Don't throw - continue with receipt sending
              }
              
              // Send receipt email
              try {
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
                    : [null];

                  const [user] = await db
                    .select({
                      email: users.email,
                      firstName: users.firstName,
                      lastName: users.lastName,
                    })
                    .from(users)
                    .where(eq(users.id, booking.userId))
                    .limit(1);

                  if (user?.email) {
                    // Calculate nights
                    const checkInDate = new Date(booking.checkIn || "");
                    const checkOutDate = new Date(booking.checkOut || "");
                    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

                    await sendBookingReceipt(
                      user.email,
                      user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}` 
                        : user.email,
                      {
                        bookingId: booking.id,
                        roomNumber: room?.roomNumber || "",
                        roomType: roomType?.name || "Room",
                        checkIn: booking.checkIn || "",
                        checkOut: booking.checkOut || "",
                        nights: nights || 1,
                        guests: booking.guests || 1,
                        totalPrice: booking.totalPrice || "0",
                        paymentMethod: "Online Payment",
                        specialRequests: booking.specialRequests || undefined,
                      }
                    );
                    console.log("✅ Receipt email sent to:", user.email);
                  }
                }
              } catch (emailError: any) {
                console.error("Failed to send receipt email:", emailError);
                // Don't fail the callback if email fails
              }
            }
          } else {
            console.warn("⚠️ Failed to verify payment status from Pesapal, status:", response.status);
            // Continue anyway - IPN will handle it
          }
        } catch (verifyError: any) {
          console.error("Error verifying payment in callback:", verifyError);
          // Continue with redirect even if verification fails - IPN will handle it
          // Don't throw - just log and continue
        }
      } catch (error: any) {
        console.error("Error in payment processing:", error);
        // Continue with redirect even if processing fails
      }
    } else {
      console.warn("⚠️ Payment record not found for callback:", { OrderTrackingId, OrderMerchantReference });
      // Still redirect to success page - user can check status
    }
    
    // Redirect to success page with status
    // Check payment status from database (might have been updated above)
    const [updatedPayment] = payment 
      ? await db
          .select({ status: payments.status })
          .from(payments)
          .where(eq(payments.id, payment.id))
          .limit(1)
      : [null];
    
    // ALWAYS redirect to public success page (this is the public callback route)
    // Admin bookings use /api/pesapal/callback/admin route
    if (updatedPayment) {
      const paymentStatus = (updatedPayment.status || "").toUpperCase();
      if (paymentStatus === "COMPLETED" || paymentStatus === "COMPLETE" || paymentStatus === "SUCCESS") {
        return redirect(`/payment/success?trackingId=${OrderTrackingId}&reference=${OrderMerchantReference}`);
      } else if (paymentStatus === "FAILED" || paymentStatus === "CANCELLED" || paymentStatus === "CANCELED") {
        return redirect(`/payment/success?trackingId=${OrderTrackingId}&reference=${OrderMerchantReference}&status=failed`);
      } else {
        return redirect(`/payment/success?trackingId=${OrderTrackingId}&reference=${OrderMerchantReference}&status=pending`);
      }
    } else {
      return redirect(`/payment/success?trackingId=${OrderTrackingId}&reference=${OrderMerchantReference}&status=pending`);
    }
  } catch (error: any) {
    // Check if this is a Next.js redirect error - if so, re-throw it
    // Next.js uses redirect() which throws a special error that should not be caught
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error; // Re-throw redirect errors so Next.js can handle them properly
    }
    
    // This is a real error (not a redirect), log it and redirect to success page
    console.error("⚠️ Real public callback error (not a redirect):", error.message);
    // Still redirect to public success page - don't show error page to user
    // IPN will handle payment verification if callback fails
    return redirect(`/payment/success?error=callback_error&trackingId=${OrderTrackingId || ""}&reference=${OrderMerchantReference || ""}`);
  }
}


