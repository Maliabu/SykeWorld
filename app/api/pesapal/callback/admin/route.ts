import { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { payments, bookings, rooms, roomTypes, users, transactions } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";
import { getPesapalToken } from "@/lib/actions/pesapal";
import { sendBookingReceipt } from "@/mail/nodemailer";

// Determine if we're using sandbox/test mode
const PESAPAL_SANDBOX = process.env.PESAPAL_SANDBOX === "true" || process.env.NODE_ENV === "development";
const PESAPAL_BASE_URL = PESAPAL_SANDBOX
  ? "https://cybqa.pesapal.com/pesapalv3"
  : "https://pay.pesapal.com/v3";

// ADMIN-SPECIFIC CALLBACK ROUTE
// This route handles Pesapal callbacks for bookings made from the admin dashboard
// It always redirects to admin dashboard pages, never to public website pages
export async function GET(req: NextRequest) {
  // Extract parameters outside try block so they're available in catch
  const searchParams = req.nextUrl.searchParams;
  const OrderTrackingId = searchParams.get("OrderTrackingId");
  const OrderMerchantReference = searchParams.get("OrderMerchantReference");

  console.log("Pesapal ADMIN callback received:", { OrderTrackingId, OrderMerchantReference });

  if (!OrderTrackingId || !OrderMerchantReference) {
    console.error("Admin callback missing required parameters");
    return redirect("/admin/dashboard/bookings?error=missing_parameters");
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
                "Content-Type": "application/json",
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
                  console.log("✅ Booking status updated to 'confirmed' via admin callback for booking:", payment.bookingId);
                }
              } catch (bookingUpdateError: any) {
                console.error("❌ ERROR updating booking status in admin callback:", bookingUpdateError);
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

            // Update transaction record if exists
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
              const finalTransactionStatus = isCompleted ? "COMPLETED" : (paymentStatus?.toUpperCase() || "PENDING");
              await db
                .update(transactions)
                .set({
                  status: finalTransactionStatus,
                  updated: new Date(),
                })
                .where(eq(transactions.id, transaction.id));
            }

            // Get updated payment for redirect decision
            const [updatedPayment] = await db
              .select()
              .from(payments)
              .where(eq(payments.id, payment.id))
              .limit(1);

            // ALWAYS redirect to admin dashboard (this is the admin callback route)
            if (updatedPayment) {
              const paymentStatus = (updatedPayment.status || "").toUpperCase();
              if (paymentStatus === "COMPLETED" || paymentStatus === "COMPLETE" || paymentStatus === "SUCCESS") {
                return redirect(`/admin/dashboard/payment/success?trackingId=${OrderTrackingId}&reference=${OrderMerchantReference}`);
              } else if (paymentStatus === "FAILED" || paymentStatus === "CANCELLED" || paymentStatus === "CANCELED") {
                return redirect(`/admin/dashboard/payment/success?trackingId=${OrderTrackingId}&reference=${OrderMerchantReference}&status=failed`);
              } else {
                return redirect(`/admin/dashboard/payment/success?trackingId=${OrderTrackingId}&reference=${OrderMerchantReference}&status=pending`);
              }
            } else {
              return redirect(`/admin/dashboard/payment/success?trackingId=${OrderTrackingId}&reference=${OrderMerchantReference}&status=pending`);
            }
          } else {
            console.error("Failed to verify payment status with Pesapal:", response.status, response.statusText);
            // Still redirect to admin success page with pending status
            return redirect(`/admin/dashboard/payment/success?trackingId=${OrderTrackingId}&reference=${OrderMerchantReference}&status=pending`);
          }
        } catch (verifyError: any) {
          console.error("Error verifying payment with Pesapal:", verifyError);
          // Still redirect to admin success page
          return redirect(`/admin/dashboard/payment/success?trackingId=${OrderTrackingId}&reference=${OrderMerchantReference}&status=verification_error`);
        }
      } catch (error: any) {
        console.error("Error processing admin callback:", error);
        // Still redirect to admin success page with error
        return redirect(`/admin/dashboard/payment/success?error=processing_error&trackingId=${OrderTrackingId || ""}&reference=${OrderMerchantReference || ""}`);
      }
    } else {
      console.error("Payment not found for admin callback:", { OrderTrackingId, OrderMerchantReference });
      return redirect(`/admin/dashboard/payment/success?error=payment_not_found&trackingId=${OrderTrackingId || ""}&reference=${OrderMerchantReference || ""}`);
    }
  } catch (error: any) {
    // Handle NEXT_REDIRECT errors properly
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error; // Re-throw redirect errors so Next.js can handle them properly
    }
    console.error("⚠️ Real admin callback error (not a redirect):", error.message);
    return redirect(`/admin/dashboard/payment/success?error=callback_error&trackingId=${OrderTrackingId || ""}&reference=${OrderMerchantReference || ""}`);
  }
}
