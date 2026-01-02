"use client";

import { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { toast, Toaster } from "sonner";
import { FaStar, FaArrowLeft, FaArrowRight } from "react-icons/fa";
import Container from "../Home/Container";
import Link from "next/link";
import { getAllRooms, createBooking } from "@/lib/actions/bookings";
import { useSession as useCustomSession } from "@/lib/hooks/useSession";
import { useSession as useNextAuthSession, signOut } from "next-auth/react";
import { AlertCircle } from "lucide-react";
import { initiatePesapalPayment } from "@/lib/actions/pesapal";
import { useRouter, useSearchParams } from "next/navigation";

// helpers
const formatMoney = (n: number) => `UGX ${n.toFixed(2)}`;

/* ---------------- Multistep Booking Component ---------------- */

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
          <p className="mt-4 text-gray-600" style={{ fontFamily: 'var(--font-inter)' }}>
            Loading...
          </p>
        </div>
      </div>
    }>
      <BookingPageContent />
    </Suspense>
  );
}

function BookingPageContent() {
  const { user, loading: sessionLoading } = useCustomSession();
  const { data: nextAuthSession, status: nextAuthStatus } = useNextAuthSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Check if user is signed in via either NextAuth or custom session
  const isSignedIn = !!user || nextAuthStatus === "authenticated";
  const isLoadingSession = sessionLoading || nextAuthStatus === "loading";

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const isSubmittingRef = useRef(false); // Prevent double submissions

  // Auto sign out if session expired
  const handleSessionExpired = useCallback(() => {
    toast.error("Your session has expired. Please sign in again to continue.");
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("google_exchanged");
    signOut({ redirect: false }).then(() => {
      router.push("/auth?redirect=/booking");
    });
  }, [router]);

  // rooms list (fetched)
  const [rooms, setRooms] = useState<any[]>([]);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // form
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    room: "",
    checkIn: "",
    checkOut: "",
    guests: 1,
    specialRequests: "",
    paymentMethod: "",
  });

  // Pre-fill form from query params (from availability page)
  useEffect(() => {
    const roomId = searchParams.get("roomId");
    const checkIn = searchParams.get("checkIn");
    const checkOut = searchParams.get("checkOut");
    const guests = searchParams.get("guests");

    if (roomId || checkIn || checkOut || guests) {
      setForm((p) => ({
        ...p,
        room: roomId || p.room,
        checkIn: checkIn || p.checkIn,
        checkOut: checkOut || p.checkOut,
        guests: guests ? parseInt(guests) : p.guests,
      }));
    }
  }, [searchParams]);

  useEffect(() => {
    // prefill name/email from session if present
    if (user) {
      setForm((p) => ({
        ...p,
        name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username || p.name,
        email: user.email ?? p.email,
      }));
    } else if (nextAuthSession?.user) {
      // Also check NextAuth session
      setForm((p) => ({
        ...p,
        name: nextAuthSession.user?.name || p.name,
        email: nextAuthSession.user?.email || p.email,
      }));
    }
  }, [user, nextAuthSession]);

  useEffect(() => {
    // fetch rooms using server actions
    (async () => {
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
            price: `UGX ${Number(r.roomType?.basePrice || 0)}/night`,
            maxGuests: r.roomType?.maxGuests || 2,
            image: r.images?.[0]?.image || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23e5e7eb' width='400' height='300'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='18' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E",
          }))
        );
        setCarouselIndex(0);
      } catch (err) {
        console.error(err);
        toast.error("Could not load rooms");
      }
    })();
  }, []);

  const update = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  // validation (simple)
  const validateStep1 = () => {
    if (!form.name || form.name.length < 2) return "Enter a valid name";
    if (!form.email || !form.email.includes("@")) return "Enter a valid email";
    if (!form.phone || form.phone.length < 8) return "Enter a valid phone";
    if (!form.room) return "Choose a room";
    if (!form.checkIn) return "Select check-in date";
    if (!form.checkOut) return "Select check-out date";
    if (form.checkOut <= form.checkIn) return "Check-out must be after check-in";
    return null;
  };

  const validateStep2 = () => {
    if (!form.paymentMethod) return "Choose a payment method";
    return null;
  };

  const nights = (() => {
    if (!form.checkIn || !form.checkOut) return 0;
    try {
      const d1 = new Date(form.checkIn);
      const d2 = new Date(form.checkOut);
      return Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
    } catch {
      return 0;
    }
  })();

  const selectedRoom = rooms.find((r) => String(r.id) === String(form.room));
  const totalAmount = selectedRoom ? selectedRoom.priceValue * nights : 0;

  // Store total amount in localStorage for Navbar to access
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bookingTotalAmount', totalAmount.toString());
      // Trigger a custom event to update Navbar immediately
      window.dispatchEvent(new Event('bookingTotalUpdated'));
    }
  }, [totalAmount]);

  // carousel
  const prevCarousel = () =>
    setCarouselIndex((i) => (i - 1 + Math.max(1, rooms.length)) % Math.max(1, rooms.length));
  const nextCarousel = () => setCarouselIndex((i) => (i + 1) % Math.max(1, rooms.length));
  const displayedRooms = rooms.concat(rooms).slice(carouselIndex, carouselIndex + 3);

  // submit booking (multistep final)
  const handleSubmit = async (e?: React.FormEvent) => {
    // Prevent default form submission if called from form
    if (e) {
      e.preventDefault();
    }

    // Prevent double submissions
    if (isSubmittingRef.current || loading) {
      return;
    }

    // ensure user signed in (either NextAuth or custom session)
    if (!isSignedIn) {
      toast.error("Please sign in before booking");
      window.location.href = "/auth";
      return;
    }

    // server-side expects fields; validate once more
    const v1 = validateStep1();
    if (v1) {
      toast.error(v1);
      setStep(1);
      return;
    }
    const v2 = validateStep2();
    if (v2) {
      toast.error(v2);
      setStep(2);
      return;
    }

    // Set both state and ref to prevent double submissions
    isSubmittingRef.current = true;
    setLoading(true);
    
    try {
      const result = await createBooking({
        roomId: form.room,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        guests: form.guests,
        specialRequests: form.specialRequests,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Booking created successfully!");
      
      // Redirect to payment if needed (all online payments)
      if (form.paymentMethod && result.booking?.id) {
        try {
          // Initiate Pesapal payment
          const paymentResult = await initiatePesapalPayment({
            bookingId: result.booking.id,
            amount: totalAmount,
          });

          if (paymentResult.success && paymentResult.redirectUrl) {
            toast.info("Redirecting to payment...");
            // Redirect to Pesapal payment page
            window.location.href = paymentResult.redirectUrl;
            return; // Don't reset loading since we're redirecting
          } else {
            toast.error(paymentResult.error || "Failed to initiate payment");
          }
        } catch (paymentError) {
          console.error("Payment initiation error:", paymentError);
          toast.error("Failed to process payment. Booking created but payment not initiated.");
        }
      } else {
        // If cash payment or no payment method, redirect to home
        setTimeout(() => {
          router.push("/");
        }, 2000);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Booking failed");
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <>
      <div className="py-24 md:py-32 bg-[#fafafa] min-h-screen">
        <Container>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="h-px w-12 bg-black/20"></div>
                <p className="text-xs uppercase tracking-widest text-black/60 font-medium" style={{ fontFamily: 'var(--font-inter)' }}>
                  Reservation
                </p>
                <div className="h-px w-12 bg-black/20"></div>
              </div>
              <h1 
                className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1a1c1e] mb-4"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                Book Your Stay
              </h1>
              <p 
                className="text-sm md:text-base text-[#1a1c1e] max-w-2xl mx-auto leading-relaxed"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                Experience luxury and comfort at Syke World Hotel
              </p>
            </div>

                {/* Sign-in suggestion banner - only show when user is NOT signed in */}
                {!isLoadingSession && !isSignedIn && (
                  <div className="mb-6 md:mb-8 p-3 md:p-4 bg-amber-500/10 border-l-4 border-amber-100 flex flex-col sm:flex-row items-start sm:items-center gap-3 border">
                    <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-[#1a1c1e]" style={{ fontFamily: 'var(--font-inter)' }}>
                        Sign in to save your booking details and access exclusive offers
                      </p>
                    </div>
                    <Link
                      href="/auth"
                      className="px-3 md:px-4 py-2 md:py-3 bg-amber-600 text-white text-xs sm:text-sm font-medium hover:bg-amber-700 transition whitespace-nowrap uppercase tracking-wide self-start sm:self-auto"
                      style={{ fontFamily: 'var(--font-inter)' }}
                    >
                      Sign In
                    </Link>
                  </div>
                )}

            <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-4 md:gap-6 lg:gap-8 xl:gap-12 overflow-hidden">
            <div className="space-y-6 md:space-y-8 min-w-0">
              {/* STEPS NAV */}
              <div className="flex gap-0 mb-6 md:mb-8 overflow-x-auto">
                <div className={`flex-1 px-3 md:px-6 py-3 md:py-4 text-center font-medium transition-all border-t border-b ${
                  step === 1 
                    ? "bg-amber-600 text-white" 
                    : step > 1 
                    ? "bg-amber-600/20 text-amber-400 border-amber-600/30" 
                    : "bg-black/5 text-gray-500 border-black/10"
                }`} style={{ fontFamily: 'var(--font-inter)' }}>
                  <div className="text-xs md:text-sm font-semibold">Step 1</div>
                  <div className="text-[10px] md:text-xs mt-1">Details</div>
                </div>
                <div className={`flex-1 px-3 md:px-6 py-3 md:py-4 text-center font-medium transition-all border-t border-b border-l ${
                  step === 2 
                    ? "bg-amber-600 text-white border-amber-600" 
                    : step > 2 
                    ? "bg-amber-600/20 text-amber-400 border-amber-600/30" 
                    : "bg-black/5 text-gray-500 border-black/10"
                }`} style={{ fontFamily: 'var(--font-inter)' }}>
                  <div className="text-xs md:text-sm font-semibold">Step 2</div>
                  <div className="text-[10px] md:text-xs mt-1">Payment</div>
                </div>
                <div className={`flex-1 px-3 md:px-6 py-3 md:py-4 text-center font-medium transition-all border-t border-b border-l ${
                  step === 3 
                    ? "bg-amber-600 text-white border-amber-600" 
                    : "bg-black/5 text-gray-500 border-black/10"
                }`} style={{ fontFamily: 'var(--font-inter)' }}>
                  <div className="text-xs md:text-sm font-semibold">Step 3</div>
                  <div className="text-[10px] md:text-xs mt-1">Review</div>
                </div>
              </div>

              {/* STEP 1: DETAILS */}
              {step === 1 && (
                <div className="space-y-6 p-4 md:p-8 border-l border-r border-black/10">
                  <h2 
                    className="text-xl md:text-2xl lg:text-3xl font-bold text-[#1a1c1e] mb-4 md:mb-6"
                    style={{ fontFamily: 'var(--font-playfair)' }}
                  >
                    Booking Details
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                      <label 
                        className="block text-xs uppercase tracking-widest text-black/60 font-medium mb-2"
                        style={{ fontFamily: 'var(--font-inter)' }}
                      >
                        Check-in Date
                      </label>
                      <input 
                        className="w-full bg-transparent border-b border-gray-400/50 px-0 py-3 text-[#1a1c1e] placeholder-gray-500 focus:outline-none focus:border-b-amber-600 transition-all" 
                        type="date" 
                        value={form.checkIn} 
                        onChange={(e) => update("checkIn", e.target.value)} 
                        style={{ fontFamily: 'var(--font-inter)' }}
                      />
                    </div>
                    <div>
                      <label 
                        className="block text-xs uppercase tracking-widest text-black/60 font-medium mb-2"
                        style={{ fontFamily: 'var(--font-inter)' }}
                      >
                        Check-out Date
                      </label>
                      <input 
                        className="w-full bg-transparent border-b border-gray-400/50 px-0 py-3 text-[#1a1c1e] placeholder-gray-500 focus:outline-none focus:border-b-amber-600 transition-all" 
                        type="date" 
                        value={form.checkOut} 
                        onChange={(e) => update("checkOut", e.target.value)} 
                        style={{ fontFamily: 'var(--font-inter)' }}
                      />
                    </div>
                    <div>
                      <label 
                        className="block text-xs uppercase tracking-widest text-black/60 font-medium mb-2"
                        style={{ fontFamily: 'var(--font-inter)' }}
                      >
                        Number of Guests
                      </label>
                      <input 
                        className="w-full bg-transparent border-b border-gray-400/50 px-0 py-3 text-[#1a1c1e] placeholder-gray-500 focus:outline-none focus:border-b-amber-600 transition-all" 
                        type="number" 
                        min="1" 
                        value={form.guests} 
                        onChange={(e) => update("guests", parseInt(e.target.value) || 1)} 
                        style={{ fontFamily: 'var(--font-inter)' }}
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
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    Continue to Payment
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div>
                      <label 
                        className="block text-xs uppercase tracking-widest text-black/60 font-medium mb-2"
                        style={{ fontFamily: 'var(--font-inter)' }}
                      >
                        Full Name
                      </label>
                      <input 
                        className="w-full bg-transparent border-b border-gray-400/50 px-0 py-3 text-[#1a1c1e] placeholder-gray-500 focus:outline-none focus:border-b-amber-600 transition-all" 
                        placeholder="Enter your full name" 
                        value={form.name} 
                        onChange={(e) => update("name", e.target.value)} 
                        style={{ fontFamily: 'var(--font-inter)' }}
                      />
                    </div>
                    <div>
                      <label 
                        className="block text-xs uppercase tracking-widest text-black/60 font-medium mb-2"
                        style={{ fontFamily: 'var(--font-inter)' }}
                      >
                        Email Address
                      </label>
                      <input 
                        className="w-full bg-transparent border-b border-gray-400/50 px-0 py-3 text-[#1a1c1e] placeholder-gray-500 focus:outline-none focus:border-b-amber-600 transition-all" 
                        placeholder="your.email@example.com" 
                        type="email"
                        value={form.email} 
                        onChange={(e) => update("email", e.target.value)} 
                        style={{ fontFamily: 'var(--font-inter)' }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label 
                      className="block text-xs uppercase tracking-widest text-black/60 font-medium mb-2"
                      style={{ fontFamily: 'var(--font-inter)' }}
                    >
                      Phone Number
                    </label>
                    <input 
                      className="w-full bg-transparent border-b border-gray-400/50 px-0 py-3 text-[#1a1c1e] placeholder-stone-400 focus:outline-none focus:border-b-amber-600 transition-all" 
                      placeholder="+256 XXX XXX XXX" 
                      value={form.phone} 
                      onChange={(e) => update("phone", e.target.value)} 
                      style={{ fontFamily: 'var(--font-inter)' }}
                    />
                  </div>
                  
                  <div>
                    <label 
                      className="block text-xs uppercase tracking-widest text-black/60 font-medium mb-2"
                      style={{ fontFamily: 'var(--font-inter)' }}
                    >
                      Select Room
                    </label>
                    <select 
                      className="w-full bg-transparent border-b border-gray-400/50 px-0 py-3 text-[#1a1c1e] focus:outline-none focus:border-b-amber-600 transition-all" 
                      value={form.room} 
                      onChange={(e) => update("room", e.target.value)}
                      style={{ fontFamily: 'var(--font-inter)' }}
                    >
                      <option value="" className="bg-white">Choose your preferred room</option>
                      {rooms.map((r) => <option key={r.id} value={r.id} className="bg-white">{r.title} — {r.price}</option>)}
                    </select>
                  </div>
                  
                  <div>
                    <label 
                      className="block text-xs uppercase tracking-widest text-black/60 font-medium mb-2"
                      style={{ fontFamily: 'var(--font-inter)' }}
                    >
                      Special Requests
                    </label>
                    <textarea 
                      className="w-full bg-transparent border-b border-gray-400/50 px-0 py-3 text-[#1a1c1e] placeholder-stone-400 focus:outline-none focus:border-b-amber-600 transition-all resize-none" 
                      placeholder="Any special requests or preferences..." 
                      rows={4} 
                      value={form.specialRequests} 
                      onChange={(e) => update("specialRequests", e.target.value)} 
                      style={{ fontFamily: 'var(--font-inter)' }}
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: PAYMENT */}
              {step === 2 && (
                <div className="space-y-6 p-4 md:p-8 border-l border-r border-black/10">
                  <h2 
                    className="text-xl md:text-2xl lg:text-3xl font-bold text-[#1a1c1e] mb-4 md:mb-6"
                    style={{ fontFamily: 'var(--font-playfair)' }}
                  >
                    Payment Method
                  </h2>
                  
                  <div>
                    <label 
                      className="block text-xs uppercase tracking-widest text-black/60 font-medium mb-2"
                      style={{ fontFamily: 'var(--font-inter)' }}
                    >
                      Choose Payment Method
                    </label>
                    <select 
                      className="w-full bg-transparent border-b border-gray-400/50 px-0 py-3 text-[#1a1c1e] focus:outline-none focus:border-b-amber-600 transition-all" 
                      value={form.paymentMethod} 
                      onChange={(e) => update("paymentMethod", e.target.value)}
                      style={{ fontFamily: 'var(--font-inter)' }}
                    >
                      <option value="" className="bg-white">Select a payment method</option>
                      <option className="bg-white">MTN Mobile Money</option>
                      <option className="bg-white">Airtel Money</option>
                      <option className="bg-white">Visa</option>
                      <option className="bg-white">Mastercard</option>
                    </select>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      onClick={() => setStep(1)} 
                      className="flex-1 bg-transparent border border-black/20 hover:border-black/40 text-[#1a1c1e] px-4 md:px-6 py-3 text-sm md:text-base font-semibold transition uppercase tracking-wide"
                      style={{ fontFamily: 'var(--font-inter)' }}
                    >
                      Back
                    </button>
                    <button 
                      onClick={() => { 
                        const err = validateStep2(); 
                        if (err) {
                          toast.error(err);
                          return;
                        }
                        // Check session before proceeding to step 3
                        if (!isSignedIn) {
                          toast.error("Please sign in to continue");
                          router.push("/auth?redirect=/booking");
                          return;
                        }
                        setStep(3); 
                      }} 
                      className="flex-1 bg-amber-600 text-white px-4 md:px-6 py-3 text-sm md:text-base font-semibold hover:bg-amber-700 transition uppercase tracking-wide"
                      style={{ fontFamily: 'var(--font-inter)' }}
                    >
                      Continue to Review
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: REVIEW */}
              {step === 3 && (
                <form 
                  onSubmit={handleSubmit}
                  className="space-y-6 p-4 md:p-8 border-l border-r border-black/10"
                >
                  <h2 
                    className="text-xl md:text-2xl lg:text-3xl font-bold text-[#1a1c1e] mb-4 md:mb-6"
                    style={{ fontFamily: 'var(--font-playfair)' }}
                  >
                    Review & Confirm
                  </h2>

                  <div className="p-4 md:p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Name</div>
                        <div className="font-semibold text-[#1a1c1e]">{form.name || "—"}</div>
                      </div>
                      <div>
                        <div className="text-sm text-stone-400 mb-1">Email</div>
                        <div className="font-semibold text-[#1a1c1e]">{form.email || "—"}</div>
                      </div>
                      <div>
                        <div className="text-sm text-stone-400 mb-1">Phone</div>
                        <div className="font-semibold text-[#1a1c1e]">{form.phone || "—"}</div>
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
                      <div>
                        <div className="text-sm text-stone-400 mb-1">Payment Method</div>
                        <div className="font-semibold text-[#1a1c1e]">{form.paymentMethod || "—"}</div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-black/10">
                      <div className="flex justify-between items-center">
                        <div className="text-lg font-semibold text-[#1a1c1e]">Total Amount</div>
                        <div 
                          className="text-2xl font-bold text-amber-600"
                          style={{ fontFamily: 'var(--font-inter)' }}
                        >
                          {formatMoney(totalAmount)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button"
                      onClick={() => setStep(2)} 
                      className="flex-1 bg-transparent border border-black/20 hover:border-black/40 text-[#1a1c1e] px-4 md:px-6 py-3 text-sm md:text-base font-semibold transition uppercase tracking-wide"
                      style={{ fontFamily: 'var(--font-inter)' }}
                    >
                      Back
                    </button>
                    <button 
                      type="submit"
                      disabled={loading} 
                      className="flex-1 bg-amber-600 text-white px-4 md:px-6 py-3 text-sm md:text-base font-semibold hover:bg-amber-700 transition uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ fontFamily: 'var(--font-inter)' }}
                    >
                      {loading ? "Processing..." : "Confirm & Pay"}
                    </button>
                  </div>
                </form>
              )}

            </div>

            {/* RIGHT: Recommended rooms carousel */}
            <div className="space-y-6 min-w-0">
              <div className="border-t border-b border-black/10 p-4 md:p-6">
                <div className="mb-4 md:mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-px w-12 bg-black/20"></div>
                    <p className="text-xs uppercase tracking-widest text-black/60 font-medium" style={{ fontFamily: 'var(--font-inter)' }}>
                      Rooms
                    </p>
                    <div className="h-px w-12 bg-black/20"></div>
                  </div>
                  <h3 
                    className="text-xl md:text-2xl lg:text-3xl font-bold text-[#1a1c1e] mb-4"
                    style={{ fontFamily: 'var(--font-playfair)' }}
                  >
                    Recommended Rooms
                  </h3>
                </div>
                <Link href='/rooms'>
                <div className="relative group">
                  <div className="flex gap-4 overflow-x-auto">
                    {displayedRooms.map((room, i) => (
                      <div key={i} className="min-w-[180px] sm:min-w-[200px] flex-shrink-0 bg-black/2 border border-black/10 cursor-pointer hover:border-black/20 transition-all">
                        <div className="relative w-full h-48 overflow-hidden">
                          <img src={room.image} className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" />
                        </div>
                        <div className="p-3">
                          <div 
                            className="font-semibold text-[#1a1c1e]"
                            style={{ fontFamily: 'var(--font-playfair)' }}
                          >
                            {room.title}
                          </div>
                          <div 
                            className="text-sm text-gray-600 mt-1"
                            style={{ fontFamily: 'var(--font-inter)' }}
                          >
                            1 bed | {room.maxGuests} sleeps
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={prevCarousel} 
                    className="absolute top-1/2 left-0 -translate-y-1/2 bg-white/90 backdrop-blur-sm text-[#1a1c1e] p-2 hover:bg-white transition opacity-0 group-hover:opacity-100"
                  >
                    <FaArrowLeft/>
                  </button>
                  <button 
                    onClick={nextCarousel} 
                    className="absolute top-1/2 right-0 -translate-y-1/2 bg-white/90 backdrop-blur-sm text-[#1a1c1e] p-2 hover:bg-white transition opacity-0 group-hover:opacity-100"
                  >
                    <FaArrowRight/>
                  </button>
                </div>
                </Link>
              </div>

              {/* quick price box */}
              <div className="border-t border-b border-black/10 p-4 md:p-6">
                <div className="mb-4 md:mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-px w-12 bg-black/20"></div>
                    <p className="text-xs uppercase tracking-widest text-black/60 font-medium" style={{ fontFamily: 'var(--font-inter)' }}>
                      Summary
                    </p>
                    <div className="h-px w-12 bg-black/20"></div>
                  </div>
                  <h3 
                    className="text-xl md:text-2xl lg:text-3xl font-bold text-[#1a1c1e] mb-4"
                    style={{ fontFamily: 'var(--font-playfair)' }}
                  >
                    Booking Summary
                  </h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div 
                      className="text-sm text-gray-600"
                      style={{ fontFamily: 'var(--font-inter)' }}
                    >
                      Nights:
                    </div>
                    <div 
                      className="text-sm font-semibold text-[#1a1c1e]"
                      style={{ fontFamily: 'var(--font-inter)' }}
                    >
                      {nights}
                    </div>
                  </div>
                  <div className="pt-3 border-t border-black/10">
                    <div className="flex justify-between items-center">
                      <div 
                        className="text-base font-medium text-[#1a1c1e]"
                        style={{ fontFamily: 'var(--font-inter)' }}
                      >
                        Total:
                      </div>
                      <div 
                        className="text-xl font-bold text-amber-600"
                        style={{ fontFamily: 'var(--font-inter)' }}
                      >
                        {formatMoney(totalAmount)}
                      </div>
                    </div>
                  </div>
                  <div 
                    className="text-xs text-gray-500 mt-2"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    Prices shown are per night.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </Container>
      </div>
    </>
  );
}
