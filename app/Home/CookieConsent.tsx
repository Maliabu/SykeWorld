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
    <div 
      className="fixed bottom-4 left-1/2 -translate-x-1/2 max-w-xl w-[95%] bg-[#fafafa] border-l border-r border-black/10 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-[9999] shadow-lg"
      style={{ fontFamily: 'var(--font-inter)' }}
    >
      <p className="text-sm text-gray-600 leading-relaxed flex-1">
        We use cookies to improve browsing and secure staff login. 
        You may accept or reject non-essential cookies.
      </p>

      <div className="flex gap-3 w-full sm:w-auto">
        <button
          onClick={reject}
          className="flex-1 sm:flex-none px-6 py-3 text-sm uppercase tracking-wide text-[#1a1c1e] border-2 border-black/30 hover:border-black hover:bg-black/5 transition-all duration-300"
          style={{ fontFamily: 'var(--font-inter)' }}
        >
          Reject
        </button>
        <button
          onClick={accept}
          className="flex-1 sm:flex-none px-6 py-3 text-sm uppercase tracking-wide bg-amber-600 hover:bg-amber-700 text-white transition-all duration-300"
          style={{ fontFamily: 'var(--font-inter)' }}
        >
          Accept
        </button>
      </div>
    </div>
  );
}
