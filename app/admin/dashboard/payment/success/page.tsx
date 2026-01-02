"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function AdminPaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  const trackingId = searchParams.get("trackingId");
  const reference = searchParams.get("reference");
  const error = searchParams.get("error");
  const statusParam = searchParams.get("status");

  useEffect(() => {
    if (error) {
      setStatus("error");
      setMessage(error === "missing_parameters" 
        ? "Payment callback missing required parameters" 
        : "Payment processing failed");
    } else if (trackingId && reference) {
      setStatus(statusParam === "pending" ? "loading" : "success");
      setMessage(statusParam === "pending" 
        ? "Payment is being processed. Please wait..." 
        : "Payment completed successfully!");
      
      // Redirect to admin dashboard home after 5 seconds
      setTimeout(() => {
        router.push("/admin/dashboard/home");
      }, 5000);
    } else {
      setStatus("error");
      setMessage("Invalid payment response");
    }
  }, [error, trackingId, reference, statusParam, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        {status === "loading" && (
          <>
            <Loader2 className="h-16 w-16 text-amber-600 mx-auto mb-4 animate-spin" />
            <h1 className="text-2xl font-bold text-[#1a1c1e] mb-2">Processing Payment...</h1>
            <p className="text-gray-600">Please wait while we verify your payment</p>
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
            <div className="flex gap-4">
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
            <div className="flex gap-4">
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
