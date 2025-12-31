"use client";

import { useEffect, useState } from "react";
import { verifyPesapalTransaction } from "@/lib/actions/pesapal";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function PesapalCheckoutPage({ searchParams }: any) {
  const trackingId = searchParams.order_tracking_id || searchParams.OrderTrackingId;
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!trackingId) {
      toast.error("No tracking ID provided");
      setLoading(false);
      return;
    }

    // If we have a tracking ID, verify the transaction status
    // This handles the callback from Pesapal
    (async () => {
      try {
        const result = await verifyPesapalTransaction(trackingId);
        
        if (result.success) {
          if (result.status === "COMPLETED") {
            toast.success("Payment completed successfully!");
            setTimeout(() => {
              router.push("/booking?success=true");
            }, 2000);
          } else {
            setIframeUrl(result.data?.redirect_url || null);
          }
        } else {
          toast.error(result.error || "Failed to verify payment");
        }
      } catch (error) {
        console.error("Payment verification error:", error);
        toast.error("An error occurred while processing payment");
      } finally {
        setLoading(false);
      }
    })();
  }, [trackingId, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="text-lg font-semibold mb-2">Processing payment...</div>
          <div className="text-sm text-gray-600">Please wait</div>
        </div>
      </div>
    );
  }

  if (!iframeUrl) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="text-lg font-semibold mb-2">Payment processing complete</div>
          <div className="text-sm text-gray-600 mb-4">Redirecting...</div>
          <button
            onClick={() => router.push("/booking")}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Go to Booking
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center p-10 min-h-screen bg-gray-50">
      <div className="w-full max-w-4xl">
        <h1 className="text-2xl font-bold mb-4 text-center">Complete Your Payment</h1>
        <iframe
          src={iframeUrl}
          width="100%"
          height="700px"
          style={{ border: "none", borderRadius: "8px" }}
          className="shadow-lg"
        />
      </div>
    </div>
  );
}
