"use client";

import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

// Zod schema with more validations
const bookingSchema = z
  .object({
    checkIn: z.string().min(1, "Please select a check-in date"),
    checkOut: z.string().min(1, "Please select a check-out date"),
    guests: z.number().min(1, "At least 1 guest is required"),
  })
  .refine((data) => new Date(data.checkOut) > new Date(data.checkIn), {
    message: "Check-out date must be after check-in date",
    path: ["checkOut"],
  })
  .refine((data) => new Date(data.checkIn) >= new Date(new Date().toISOString().split("T")[0]), {
    message: "Check-in date cannot be in the past",
    path: ["checkIn"],
  });

export default function BookingForm() {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const result = bookingSchema.safeParse({ checkIn, checkOut, guests });
    if (!result.success) {
      // Show first validation error as toast
      toast.error(result.error.issues[0].message);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/checkavailability", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Customer Name",
    email: "client@example.com",
    check_in: checkIn,
    check_out: checkOut,
    guests,
  }),
});

if (!res.ok) throw new Error("Failed to send booking emails");
toast.success("Booking request sent successfully!");

      setCheckIn("");
      setCheckOut("");
      setGuests(1);
    } catch (err) {
      console.error(err);
      toast.error("Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-transparent p-6 md:p-8 flex flex-col justify-center items-center gap-4 md:gap-6 w-full h-full"
    >
      {/* Title Section */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="h-px w-12 bg-black/20"></div>
          <p className="text-xs uppercase tracking-widest text-black/60 font-medium" style={{ fontFamily: 'var(--font-inter)' }}>
            Reservation
          </p>
          <div className="h-px w-12 bg-black/20"></div>
        </div>
        <h2 
          className="text-3xl md:text-4xl font-bold text-[#1a1c1e] mb-2"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          Check Availability
        </h2>
      </div>

      <div className="flex flex-col items-center">
        <label 
          className="block text-xs uppercase tracking-widest text-black/60 mb-2 font-medium w-fit"
          style={{ fontFamily: 'var(--font-inter)' }}
        >
          CHECK-IN
        </label>
        <input
          type="date"
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          className="bg-transparent border-b border-gray-400/50 px-0 py-3 text-[#1a1c1e] placeholder-gray-500 focus:outline-none focus:border-b-amber-600 transition-all"
          style={{ fontFamily: 'var(--font-inter)' }}
          required
        />
      </div>

      <div className="flex flex-col items-center">
        <label 
          className="block text-xs uppercase tracking-widest text-black/60 mb-2 font-medium w-fit"
          style={{ fontFamily: 'var(--font-inter)' }}
        >
          CHECK-OUT
        </label>
        <input
          type="date"
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
          className="bg-transparent border-b border-gray-400/50 px-0 py-3 text-[#1a1c1e] placeholder-gray-500 focus:outline-none focus:border-b-amber-600 transition-all"
          style={{ fontFamily: 'var(--font-inter)' }}
          required
        />
      </div>

      <div className="flex flex-col items-center">
        <label 
          className="block text-xs uppercase tracking-widest text-black/60 mb-2 font-medium w-fit"
          style={{ fontFamily: 'var(--font-inter)' }}
        >
          GUESTS
        </label>
        <input
          type="number"
          min={1}
          value={guests}
          onChange={(e) => setGuests(parseInt(e.target.value))}
          className="bg-transparent border-b border-gray-400/50 px-0 py-3 text-[#1a1c1e] placeholder-gray-500 focus:outline-none focus:border-b-amber-600 transition-all"
          style={{ fontFamily: 'var(--font-inter)' }}
          required
        />
      </div>

      <div className="flex items-end">
        <button
          type="submit"
          disabled={loading}
          className={`bg-amber-600 hover:bg-amber-700 text-white px-6 md:px-8 py-3 md:py-4 font-medium tracking-wide uppercase transition-all duration-300 ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          style={{ fontFamily: 'var(--font-inter)' }}
        >
          {loading ? "Checking..." : "CHECK AVAILABILITY"}
        </button>
      </div>
    </form>
  );
}
