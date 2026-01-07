"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { getAllRooms, createBooking } from "@/lib/actions/bookings";
import { initiatePesapalPayment } from "@/lib/actions/pesapal";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/hooks/useSession";
import { checkUserPermission } from "@/lib/actions/permissions";

// helpers
const formatMoney = (n: number) => `UGX ${n.toFixed(2)}`;

export default function AddBookingCard() {
  const { user } = useSession();
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState(false);
  const [checkingPermission, setCheckingPermission] = useState(true);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const isSubmittingRef = useRef(false);
  const [rooms, setRooms] = useState<any[]>([]);

  // form - same structure as public booking form
  const [form, setForm] = useState({
    name: "",
    email: "",
    room: "",
    checkIn: "",
    checkOut: "",
    guests: 1,
    specialRequests: "",
  });

  useEffect(() => {
    checkPermission();
    loadRooms();
  }, []);

  const checkPermission = async () => {
    try {
      if (user?.isSuperuser || user?.userType === "admin") {
        setHasPermission(true);
        setCheckingPermission(false);
        return;
      }
      const result = await checkUserPermission("bookings_add");
      setHasPermission(result.hasPermission);
    } catch (error) {
      console.error("Permission check error:", error);
      setHasPermission(false);
    } finally {
      setCheckingPermission(false);
    }
  };

  const loadRooms = async () => {
    try {
      const result = await getAllRooms();
      if (result.error) {
        console.error(result.error);
        toast.error("Could not load rooms");
        return;
      }
      setRooms(
        (result.rooms || []).map((r: any) => ({
          id: r.id,
          title: r.roomType?.name || "",
          priceValue: Number(r.roomType?.basePrice || 0),
        }))
      );
    } catch (error) {
      console.error("Failed to load rooms:", error);
    }
  };

  const update = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  // validation (same as public form)
  const validateStep1 = () => {
    if (!form.name || form.name.length < 2) return "Enter a valid name";
    if (!form.email || !form.email.includes("@")) return "Enter a valid email";
    if (!form.room) return "Choose a room";
    if (!form.checkIn) return "Select check-in date";
    if (!form.checkOut) return "Select check-out date";
    if (form.checkOut <= form.checkIn) return "Check-out must be after check-in";
    return null;
  };

  const nights = (() => {
    if (!form.checkIn || !form.checkOut) return 0;
    try {
      const d1 = new Date(form.checkIn);
      const d2 = new Date(form.checkOut);
      return Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  })();

  const selectedRoom = rooms.find((r) => r.id === form.room);
  const totalAmount = selectedRoom ? nights * selectedRoom.priceValue : 0;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (isSubmittingRef.current || loading) {
      return;
    }

    if (!hasPermission) {
      toast.error("You don't have permission to add bookings");
      return;
    }

    const v1 = validateStep1();
    if (v1) {
      toast.error(v1);
      setStep(1);
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);

    try {
      // Use createBooking with customer email/name for admin context
      const result = await createBooking({
        roomId: form.room,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        guests: form.guests,
        specialRequests: form.specialRequests,
        customerEmail: form.email, // Admin booking for customer
        customerName: form.name, // Admin booking for customer
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Booking created successfully!");

      // Redirect to payment (always use Pesapal)
      if (result.booking?.id) {
        try {
          const paymentResult = await initiatePesapalPayment({
            bookingId: result.booking.id,
            amount: totalAmount,
          });

          if (paymentResult.success && paymentResult.redirectUrl) {
            toast.info("Redirecting to payment...");
            window.location.href = paymentResult.redirectUrl;
            return;
          } else {
            toast.error(paymentResult.error || "Failed to initiate payment");
          }
        } catch (paymentError) {
          console.error("Payment initiation error:", paymentError);
          toast.error("Failed to process payment. Booking created but payment not initiated.");
        }
      } else {
        setTimeout(() => {
          router.push("/admin/dashboard/bookings");
        }, 2000);
      }
    } catch (error: any) {
      console.error("Booking error:", error);
      toast.error(error.message || "Failed to create booking");
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  if (checkingPermission) {
    return null;
  }

  if (!hasPermission) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Step Indicators */}
      <div className="flex border-b border-black/10">
        <div
          className={`flex-1 px-3 md:px-6 py-3 md:py-4 text-center font-medium transition-all border-t border-b border-l ${
            step === 1
              ? "bg-amber-600 text-white border-amber-600"
              : "bg-black/5 text-gray-500 border-black/10"
          }`}
          style={{ fontFamily: "var(--font-inter)" }}
        >
          <div className="text-xs md:text-sm font-semibold">Step 1</div>
          <div className="text-[10px] md:text-xs mt-1">Details</div>
        </div>
        <div
          className={`flex-1 px-3 md:px-6 py-3 md:py-4 text-center font-medium transition-all border-t border-b border-l ${
            step === 2
              ? "bg-amber-600 text-white border-amber-600"
              : "bg-black/5 text-gray-500 border-black/10"
          }`}
          style={{ fontFamily: "var(--font-inter)" }}
        >
          <div className="text-xs md:text-sm font-semibold">Step 2</div>
          <div className="text-[10px] md:text-xs mt-1">Review</div>
        </div>
      </div>

      {/* STEP 1: DETAILS */}
      {step === 1 && (
        <div className="space-y-6 p-4 md:p-8 border-l border-r border-black/10 bg-white">
          <h2
            className="text-xl md:text-2xl lg:text-3xl font-bold text-[#1a1c1e] mb-4 md:mb-6"
            style={{ fontFamily: "var(--font-cal-sans)", fontWeight: 400 }}
          >
            Booking Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-6 mb-6">
            <div>
              <label
                className="block text-xs uppercase tracking-widest text-black/60 font-medium mb-2"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                Check-in Date
              </label>
              <input
                className="w-full bg-transparent border-b border-gray-400/50 px-0 py-3 text-[#1a1c1e] placeholder-gray-500 focus:outline-none focus:border-b-amber-600 transition-all"
                type="date"
                value={form.checkIn}
                onChange={(e) => update("checkIn", e.target.value)}
                style={{ fontFamily: "var(--font-inter)" }}
              />
            </div>
            <div>
              <label
                className="block text-xs uppercase tracking-widest text-black/60 font-medium mb-2"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                Check-out Date
              </label>
              <input
                className="w-full bg-transparent border-b border-gray-400/50 px-0 py-3 text-[#1a1c1e] placeholder-gray-500 focus:outline-none focus:border-b-amber-600 transition-all"
                type="date"
                value={form.checkOut}
                onChange={(e) => update("checkOut", e.target.value)}
                style={{ fontFamily: "var(--font-inter)" }}
              />
            </div>
            <div>
              <label
                className="block text-xs uppercase tracking-widest text-black/60 font-medium mb-2"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                Number of Guests
              </label>
              <input
                className="w-full bg-transparent border-b border-gray-400/50 px-0 py-3 text-[#1a1c1e] placeholder-gray-500 focus:outline-none focus:border-b-amber-600 transition-all"
                type="number"
                min="1"
                value={form.guests}
                onChange={(e) => update("guests", parseInt(e.target.value) || 1)}
                style={{ fontFamily: "var(--font-inter)" }}
              />
            </div>
          </div>

          <button
            onClick={() => {
              const err = validateStep1();
              if (err) {
                toast.error(err);
              } else {
                setStep(2);
              }
            }}
            className="w-full bg-amber-600 text-white px-6 py-3 text-base font-semibold hover:bg-amber-700 transition uppercase tracking-wide"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            Continue to Review
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-6 mt-6">
            <div>
              <label
                className="block text-xs uppercase tracking-widest text-black/60 font-medium mb-2"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                Full Name
              </label>
              <input
                className="w-full bg-transparent border-b border-gray-400/50 px-0 py-3 text-[#1a1c1e] placeholder-gray-500 focus:outline-none focus:border-b-amber-600 transition-all"
                placeholder="Enter customer full name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                style={{ fontFamily: "var(--font-inter)" }}
              />
            </div>
            <div>
              <label
                className="block text-xs uppercase tracking-widest text-black/60 font-medium mb-2"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                Email Address
              </label>
              <input
                className="w-full bg-transparent border-b border-gray-400/50 px-0 py-3 text-[#1a1c1e] placeholder-gray-500 focus:outline-none focus:border-b-amber-600 transition-all"
                placeholder="customer.email@example.com"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                style={{ fontFamily: "var(--font-inter)" }}
              />
            </div>
          </div>

          <div>
            <label
              className="block text-xs uppercase tracking-widest text-black/60 font-medium mb-2"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              Select Room
            </label>
            <select
              className="w-full bg-transparent border-b border-gray-400/50 px-0 py-3 text-[#1a1c1e] focus:outline-none focus:border-b-amber-600 transition-all"
              value={form.room}
              onChange={(e) => update("room", e.target.value)}
              style={{ fontFamily: "var(--font-inter)" }}
            >
              <option value="" className="bg-white">
                Choose your preferred room
              </option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id} className="bg-white">
                  {r.title} — {r.price}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="block text-xs uppercase tracking-widest text-black/60 font-medium mb-2"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              Special Requests
            </label>
            <textarea
              className="w-full bg-transparent border-b border-gray-400/50 px-0 py-3 text-[#1a1c1e] placeholder-stone-400 focus:outline-none focus:border-b-amber-600 transition-all resize-none"
              placeholder="Any special requests or preferences..."
              rows={4}
              value={form.specialRequests}
              onChange={(e) => update("specialRequests", e.target.value)}
              style={{ fontFamily: "var(--font-inter)" }}
            />
          </div>
        </div>
      )}

      {/* STEP 2: REVIEW */}
      {step === 2 && (
        <form
          onSubmit={handleSubmit}
          className="space-y-6 p-4 md:p-8 border-l border-r border-black/10 bg-white"
        >
          <h2
            className="text-xl md:text-2xl lg:text-3xl font-bold text-[#1a1c1e] mb-4 md:mb-6"
            style={{ fontFamily: "var(--font-cal-sans)", fontWeight: 400 }}
          >
            Review & Confirm
          </h2>

          <div className="p-4 md:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <div className="text-sm text-gray-500 mb-1">Name</div>
                <div className="font-semibold text-[#1a1c1e]">{form.name || "—"}</div>
              </div>
              <div>
                <div className="text-sm text-stone-400 mb-1">Email</div>
                <div className="font-semibold text-[#1a1c1e]">{form.email || "—"}</div>
              </div>
              <div>
                <div className="text-sm text-stone-400 mb-1">Guests</div>
                <div className="font-semibold text-[#1a1c1e]">{form.guests}</div>
              </div>
              <div className="col-span-2">
                <div className="text-sm text-stone-400 mb-1">Room</div>
                <div className="font-semibold text-[#1a1c1e]">{selectedRoom?.title ?? "—"}</div>
              </div>
              <div>
                <div className="text-sm text-stone-400 mb-1">Check-in</div>
                <div className="font-semibold text-[#1a1c1e]">{form.checkIn || "—"}</div>
              </div>
              <div>
                <div className="text-sm text-stone-400 mb-1">Check-out</div>
                <div className="font-semibold text-[#1a1c1e]">{form.checkOut || "—"}</div>
              </div>
              <div>
                <div className="text-sm text-stone-400 mb-1">Nights</div>
                <div className="font-semibold text-[#1a1c1e]">{nights}</div>
              </div>
            </div>

            <div className="pt-4 border-t border-black/10">
              <div className="flex justify-between items-center">
                <div className="text-lg font-semibold text-[#1a1c1e]">Total Amount</div>
                <div
                  className="text-2xl font-bold text-amber-600"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  {formatMoney(totalAmount)}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 bg-transparent border border-black/20 hover:border-black/40 text-[#1a1c1e] px-4 md:px-6 py-3 text-sm md:text-base font-semibold transition uppercase tracking-wide"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-amber-600 text-white px-4 md:px-6 py-3 text-sm md:text-base font-semibold hover:bg-amber-700 transition uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              {loading ? "Processing..." : "Confirm & Pay"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
