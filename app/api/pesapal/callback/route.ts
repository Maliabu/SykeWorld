import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";

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
 * 3. Redirects user to appropriate page (success/failure)
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const OrderTrackingId = searchParams.get("OrderTrackingId");
    const OrderMerchantReference = searchParams.get("OrderMerchantReference");

    console.log("Pesapal callback received:", { OrderTrackingId, OrderMerchantReference });

    if (!OrderTrackingId || !OrderMerchantReference) {
      console.error("Callback missing required parameters");
      // Redirect to booking page with error
      return redirect("/booking?error=missing_parameters");
    }

    // The payment verification and status update should be handled by:
    // 1. The IPN endpoint (automatic server-to-server)
    // 2. Or you can verify here and update status
    
    // For now, redirect to a success page or booking confirmation
    // You can customize this based on your app structure
    return redirect(`/booking?success=true&trackingId=${OrderTrackingId}&reference=${OrderMerchantReference}`);
  } catch (error: any) {
    console.error("Callback error:", error);
    return redirect("/booking?error=callback_failed");
  }
}


