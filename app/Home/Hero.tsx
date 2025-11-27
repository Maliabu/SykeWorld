"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { FaChevronDown, FaArrowRight, FaChevronRight } from "react-icons/fa";
import { useRouter } from "next/navigation";

export default function Hero() {
  const router = useRouter();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("hasSeenWelcomeBanner");
    if (!seen) {
      setShowBanner(true);
      localStorage.setItem("hasSeenWelcomeBanner", "true");
    }
  }, []);

  const dismissBanner = () => setShowBanner(false);

  const scrollToNext = () => {
    const nextSection = document.getElementById("next-section");
    if (nextSection) nextSection.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative h-[90vh] w-full">
      <Image
        src="/images/room2.jpg"
        alt="Horizone Hotel"
        fill
        className="object-cover"
      />

      <div className="absolute inset-0 bg-black/50 text-white px-6 py-6">

        <div className="absolute top-10 left-35 space-y-3">

          {/* ---------- CARD 1: HOTEL NAME ---------- */}
          <div className="bg-stone-300  rounded-lg text-black max-w-xs">
            <div className="text-3xl font-black tracking-wide px-6 pt-20">
              Syke World
            </div>
            <div className="text-3xl font-light tracking-wide px-6 pb-20">Hotel</div>

          {/* ---------- CARD 2: YOUR ORIGINAL SECOND CARD (RESTORED) ---------- */}
          <div className="bg-stone-200 p-4 rounded-lg max-w-xs text-black">
            {/* Replace this with whatever you had originally */}
            <p className="text-sm opacity-85">
              Where Luxury meets Comfort
            </p>
          </div>
          </div>

          {/* ---------- ONE-TIME WELCOME BANNER ---------- */}
          {showBanner && (
            <div className="bg-stone-200 text-black p-4 rounded-lg shadow-md max-w-xs">
              <p className="text-sm">
                Welcome to{" "}
                <span className="font-semibold text-orange-700">Syke World Hotel</span> — we’re glad to host you!
              </p>

              <button
                onClick={dismissBanner}
                className="mt-1 text-xs underline text-orange-700 hover:text-orange-900"
              >
                Close
              </button>
            </div>
          )}

          {/* ---------- DOWN ARROW ---------- */}
          <button
            onClick={scrollToNext}
            className="flex justify-center w-full"
          >
            <FaChevronDown className="text-white text-2xl hover:text-orange-400 transition" />
          </button>

          {/* ---------- VISIT PAIDHA + RIGHT ARROW ---------- */}
          <div className="flex items-center space-x-3 mt-1">
            
            {/* Visit card */}
            <div
              onClick={() => router.push("/visit")}
              className="bg-orange-600 text-white px-4 py-3 rounded-lg shadow cursor-pointer hover:bg-stone-300/90 transition max-w-xs"
            >
              <span className="font-semibold">Visit Paidha</span>
            </div>

            {/* Right arrow OUTSIDE the card */}
            <FaChevronRight
              onClick={() => router.push("/visit")}
              className="text-white text-xl cursor-pointer hover:text-orange-400 transition"
            />
          </div>

        </div>
      </div>
    </section>
  );
}
