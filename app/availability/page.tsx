"use client";

import { Suspense } from "react";
import AvailabilityContent from "./AvailabilityContent";

export default function AvailabilityPage() {
  return (
    <Suspense fallback={
      <div className="py-24 md:py-32 bg-[#fafafa] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
          <p className="mt-4 text-gray-600" style={{ fontFamily: 'var(--font-inter)' }}>
            Loading...
          </p>
        </div>
      </div>
    }>
      <AvailabilityContent />
    </Suspense>
  );
}
