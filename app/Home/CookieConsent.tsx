"use client";

import { useEffect, useState } from "react";

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) setShow(true);
  }, []);

  const accept = () => {
    localStorage.setItem("cookie_consent", "accepted");
    setShow(false);
  };

  const reject = () => {
    localStorage.setItem("cookie_consent", "rejected");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="
      fixed bottom-4 left-1/2 -translate-x-1/2 
      max-w-xl w-[95%] bg-black/80 text-white 
      p-4 rounded-xl backdrop-blur 
      flex flex-col sm:flex-row justify-between items-center gap-4
      z-[9999] shadow-xl
    ">
      <p className="text-sm leading-snug">
        We use cookies to improve browsing and secure staff login. 
        You may accept or reject non-essential cookies.
      </p>

      <div className="flex gap-3">
        <button
          onClick={reject}
          className="px-4 py-2 rounded-lg bg-gray-600 text-sm hover:bg-gray-500"
        >
          Reject
        </button>
        <button
          onClick={accept}
          className="px-4 py-2 rounded-lg bg-orange-600 text-sm hover:bg-orange-400"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
