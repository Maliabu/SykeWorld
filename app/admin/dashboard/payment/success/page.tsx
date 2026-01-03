"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { getPaymentStatusByTrackingId, getPaymentStatusByReference } from "@/lib/actions/payments";

export default function AdminPaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "pending">("loading");
  const [message, setMessage] = useState("");
  const [checkingPayment, setCheckingPayment] = useState(true);

  const trackingId = searchParams.get("trackingId");
  const reference = searchParams.get("reference");
  const error = searchParams.get("error");
  const statusParam = searchParams.get("status");

  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (error) {
        setStatus("error");
        setMessage(error === "missing_parameters" 
          ? "Payment callback missing required parameters" 
          : "Payment processing failed");
        setCheckingPayment(false);
        return;
      }

      if (!trackingId && !reference) {
        setStatus("error");
        setMessage("Invalid payment response - missing tracking information");
        setCheckingPayment(false);
        return;
      }

      // Fetch actual payment status from database
      try {
        let paymentResult;
        if (trackingId) {
          paymentResult = await getPaymentStatusByTrackingId(trackingId);
        } else if (reference) {
          paymentResult = await getPaymentStatusByReference(reference);
        }

        if (paymentResult?.success && paymentResult.payment) {
          const paymentStatus = (paymentResult.payment.status || "").toUpperCase();
          
          if (paymentStatus === "COMPLETED" || paymentStatus === "COMPLETE" || paymentStatus === "SUCCESS") {
            setStatus("success");
            setMessage("Payment completed successfully!");
            
            // Redirect to admin dashboard home after 5 seconds
            setTimeout(() => {
              router.push("/admin/dashboard/home");
            }, 5000);
          } else if (paymentStatus === "FAILED" || paymentStatus === "CANCELLED" || paymentStatus === "CANCELED" || statusParam === "failed") {
            setStatus("error");
            setMessage("Payment failed. Please try again or contact support.");
          } else {
            // PENDING or any other status
            setStatus("pending");
            setMessage("Payment is being processed. Please wait while we verify your payment...");
            
            // Poll for status update every 3 seconds (max 10 times = 30 seconds)
            let pollCount = 0;
            const maxPolls = 10;
            const pollInterval = setInterval(async () => {
              pollCount++;
              let pollResult;
              if (trackingId) {
                pollResult = await getPaymentStatusByTrackingId(trackingId);
              } else if (reference) {
                pollResult = await getPaymentStatusByReference(reference);
              }

              if (pollResult?.success && pollResult.payment) {
                const pollStatus = (pollResult.payment.status || "").toUpperCase();
                if (pollStatus === "COMPLETED" || pollStatus === "COMPLETE" || pollStatus === "SUCCESS") {
                  clearInterval(pollInterval);
                  setStatus("success");
                  setMessage("Payment completed successfully!");
                  setTimeout(() => {
                    router.push("/admin/dashboard/home");
                  }, 5000);
                } else if (pollStatus === "FAILED" || pollStatus === "CANCELLED" || pollStatus === "CANCELED") {
                  clearInterval(pollInterval);
                  setStatus("error");
                  setMessage("Payment failed. Please try again or contact support.");
                }
              }

              if (pollCount >= maxPolls) {
                clearInterval(pollInterval);
                setStatus("pending");
                setMessage("Payment is still being processed. Please check back later or contact support.");
              }
            }, 3000);
          }
        } else {
          // Payment not found or error fetching
          if (statusParam === "pending") {
            setStatus("pending");
            setMessage("Payment is being processed. Please wait while we verify your payment...");
          } else {
            setStatus("error");
            setMessage("Could not verify payment status. Please contact support.");
          }
        }
      } catch (err) {
        console.error("Error checking payment status:", err);
        setStatus("error");
        setMessage("An error occurred while checking payment status. Please contact support.");
      } finally {
        setCheckingPayment(false);
      }
    };

    checkPaymentStatus();
  }, [error, trackingId, reference, statusParam, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] px-4">
      <div className="max-w-md w-full bg-white rounded-xl p-8 text-center">
        {(status === "loading" || checkingPayment) && (
          <>
            <Loader2 className="h-16 w-16 text-amber-600 mx-auto mb-4 animate-spin" />
            <h1 className="text-2xl font-bold text-[#1a1c1e] mb-2">Processing Payment...</h1>
            <p className="text-gray-600">Please wait while we verify your payment</p>
          </>
        )}

        {status === "pending" && (
          <>
            <Loader2 className="h-16 w-16 text-amber-600 mx-auto mb-4 animate-spin" />
            <h1 className="text-2xl font-bold text-[#1a1c1e] mb-2">Payment Pending</h1>
            <p className="text-gray-600 mb-4">{message}</p>
            {trackingId && (
              <p className="text-sm text-gray-500 mb-6">
                Tracking ID: <span className="font-mono">{trackingId}</span>
              </p>
            )}
            <div className="flex gap-2">
              <Link
                href="/admin/dashboard/home"
                className="flex-1 bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-amber-700 transition"
              >
                Go to Dashboard
              </Link>
              <Link
                href="/admin/dashboard/bookings"
                className="flex-1 bg-transparent border border-amber-600 text-amber-600 px-6 py-3 rounded-lg font-semibold hover:bg-amber-50 transition"
              >
                View Bookings
              </Link>
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-[#1a1c1e] mb-2">Payment Successful!</h1>
            <p className="text-gray-600 mb-4">{message}</p>
            {trackingId && (
              <p className="text-sm text-gray-500 mb-6">
                Tracking ID: <span className="font-mono">{trackingId}</span>
              </p>
            )}
            <p className="text-sm text-gray-500 mb-6">
              A receipt has been sent to the customer's email. Redirecting to dashboard...
            </p>
            <div className="flex gap-2">
              <Link
                href="/admin/dashboard/home"
                className="flex-1 bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-amber-700 transition"
              >
                Go to Dashboard
              </Link>
              <Link
                href="/admin/dashboard/bookings"
                className="flex-1 bg-transparent border border-amber-600 text-amber-600 px-6 py-3 rounded-lg font-semibold hover:bg-amber-50 transition"
              >
                View Bookings
              </Link>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-[#1a1c1e] mb-2">Payment Failed</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="flex gap-2">
              <Link
                href="/admin/dashboard/bookings/add"
                className="flex-1 bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-amber-700 transition"
              >
                Try Again
              </Link>
              <Link
                href="/admin/dashboard/home"
                className="flex-1 bg-transparent border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Go to Dashboard
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
