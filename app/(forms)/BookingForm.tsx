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
      className="bg-white rounded-2xl p-6 flex flex-col md:flex-row gap-4"
    >
      <div className="flex-1">
        <label className="block text-sm font-medium">Check-in</label>
        <input
          type="date"
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          className="mt-1 bg-gray-100 rounded px-3 py-2 w-full"
          required
        />
      </div>

      <div className="flex-1">
        <label className="block text-sm font-medium">Check-out</label>
        <input
          type="date"
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
          className="mt-1 bg-gray-100 rounded px-3 py-2 w-full"
          required
        />
      </div>

      <div className="flex-1">
        <label className="block text-sm font-medium">Guests</label>
        <input
          type="number"
          min={1}
          value={guests}
          onChange={(e) => setGuests(parseInt(e.target.value))}
          className="mt-1 bg-gray-100 rounded px-3 py-2 w-full"
          required
        />
      </div>

      <div className="flex items-end">
        <button
          type="submit"
          disabled={loading}
          className={`bg-orange-600 text-white px-6 py-2 rounded-md transition ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Booking..." : "Check Availability"}
        </button>
      </div>
    </form>
  );
}
