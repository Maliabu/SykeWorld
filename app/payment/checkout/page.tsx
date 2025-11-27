"use client";

import { useEffect, useState } from "react";

export default function PesapalCheckoutPage({ searchParams }: any) {
  const orderId = searchParams.order_tracking_id;
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    // Get Pesapal iframe URL from Django
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pesapal/initiate/?order_tracking_id=${orderId}`, {
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => {
        setIframeUrl(data.redirect_url); // Pesapal checkout link
      })
      .catch(console.error);
  }, [orderId]);

  if (!iframeUrl) return <p>Loading payment...</p>;

  return (
    <div className="flex justify-center p-10">
      <iframe
        src={iframeUrl}
        width="100%"
        height="700px"
        style={{ border: "none" }}
      />
    </div>
  );
}
