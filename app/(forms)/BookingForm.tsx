"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { getAllRoomTypes } from "@/lib/actions/bookings";

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
  const router = useRouter();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [roomTypeId, setRoomTypeId] = useState("");
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRoomTypes, setLoadingRoomTypes] = useState(true);

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];

  // Fetch room types on mount
  useEffect(() => {
    const fetchRoomTypes = async () => {
      try {
        const result = await getAllRoomTypes();
        if (result.success && result.roomTypes) {
          setRoomTypes(result.roomTypes);
        }
      } catch (err) {
        console.error("Failed to fetch room types:", err);
      } finally {
        setLoadingRoomTypes(false);
      }
    };
    fetchRoomTypes();
  }, []);

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
      // Navigate to availability results page with query params
      const params = new URLSearchParams({
        checkIn,
        checkOut,
        guests: guests.toString(),
      });
      if (roomTypeId) {
        params.append("roomTypeId", roomTypeId);
      }
      router.push(`/availability?${params.toString()}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to check availability. Please try again.");
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
          min={today}
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
          min={checkIn || today}
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
          onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
          className="bg-transparent border-b border-gray-400/50 px-0 py-3 text-[#1a1c1e] placeholder-gray-500 focus:outline-none focus:border-b-amber-600 transition-all w-full text-center"
          style={{ fontFamily: 'var(--font-inter)' }}
          required
        />
      </div>

      <div className="flex flex-col items-center w-full">
        <label 
          className="block text-xs uppercase tracking-widest text-black/60 mb-2 font-medium w-fit"
          style={{ fontFamily: 'var(--font-inter)' }}
        >
          ROOM TYPE
        </label>
        <select
          value={roomTypeId}
          onChange={(e) => setRoomTypeId(e.target.value)}
          className="bg-transparent border-b border-gray-400/50 px-0 py-3 text-[#1a1c1e] focus:outline-none focus:border-b-amber-600 transition-all w-full text-center cursor-pointer"
          style={{ fontFamily: 'var(--font-inter)' }}
        >
          <option value="">All Room Types</option>
          {loadingRoomTypes ? (
            <option value="" disabled>Loading room types...</option>
          ) : (
            roomTypes.map((rt: any) => (
              <option key={rt.id} value={rt.id}>
                {rt.name}
              </option>
            ))
          )}
        </select>
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
