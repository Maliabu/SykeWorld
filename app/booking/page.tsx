"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { toast, Toaster } from "sonner";
import { FaStar, FaArrowLeft, FaArrowRight } from "react-icons/fa";
import Container from "../Home/Container";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

// helpers
const formatMoney = (n: number) => `UGX ${n.toFixed(2)}`;

/* ---------------- Multistep Booking Component ---------------- */

export default function BookingPage() {
  const { data: session, status } = useSession();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    // prefill name/email from NextAuth session if present
    if (session?.user) {
      setForm((p) => ({
        ...p,
        name: session.user.name ?? p.name,
        email: session.user.email ?? p.email,
      }));
    }
  }, [session]);

  useEffect(() => {
    // fetch rooms
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/rooms/`);
        if (!res.ok) throw new Error("Failed to fetch rooms");
        const data = await res.json();
        setRooms(
          data.map((r: any) => ({
            id: r.id,
            title: r.room_type.name,
            priceValue: Number(r.room_type.base_price),
            price: `UGX ${Number(r.room_type.base_price)}/night`,
            maxGuests: r.room_type.max_guests,
            image: r.images?.[0]?.image || "/placeholder.jpg",
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

  // carousel
  const prevCarousel = () =>
    setCarouselIndex((i) => (i - 1 + Math.max(1, rooms.length)) % Math.max(1, rooms.length));
  const nextCarousel = () => setCarouselIndex((i) => (i + 1) % Math.max(1, rooms.length));
  const displayedRooms = rooms.concat(rooms).slice(carouselIndex, carouselIndex + 3);

  // submit booking (multistep final)
  const handleSubmit = async () => {
    // ensure user signed in with NextAuth
    if (status !== "authenticated") {
      toast.error("Please sign in before booking");
      signIn(); // opens NextAuth sign-in
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

    setLoading(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        room_id: form.room,
        check_in: form.checkIn,
        check_out: form.checkOut,
        guests: form.guests,
        specialRequests: form.specialRequests,
        paymentMethod: form.paymentMethod,
      };

      // Retrieve Django JWT issued after sign-in (Google or email)
      let access: string | null = null;
      if (typeof window !== "undefined") {
        // guard against `"undefined"` stored as a string
        const raw = localStorage.getItem("access");
        if (raw && raw !== "undefined") access = raw;
      }

      // Build headers conditionally. Always include credentials so
      // cookie-based auth still works; add Authorization only if token exists.
      const headers: Record<string,string> = { "Content-Type": "application/json" };
      if (access) headers["Authorization"] = `Bearer ${access}`;

      const res = await fetch(`${API_URL}/api/rooms/bookings/create/`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify(payload),
      });

      // helpful debug when backend returns 401
      if (res.status === 401) {
        // give a clear message so you know whether token was missing/invalid
        toast.error("Unauthorized. Your JWT is missing or expired — please sign in again.");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Booking creation failed");
      }

      const data = await res.json();
      toast.success("Booking created");

      // If backend returned a pesapal redirect URL, go there
      if (data?.pesapal_url) {
        // slight delay to show toast
        setTimeout(() => {
          window.location.href = data.pesapal_url;
        }, 600);
      } else {
        toast.success("Booking completed (no online payment required)");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="py-16 bg-gray-50">
        <Container>
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-xl space-y-6">
              <h1 className="text-2xl font-semibold">Book Your Stay</h1>

              {/* STEPS NAV */}
              <div className="flex gap-2 text-sm">
                <div className={`px-3 py-1 rounded ${step === 1 ? "bg-orange-600 text-white" : "bg-gray-100"}`}>1. Details</div>
                <div className={`px-3 py-1 rounded ${step === 2 ? "bg-orange-600 text-white" : "bg-gray-100"}`}>2. Payment</div>
                <div className={`px-3 py-1 rounded ${step === 3 ? "bg-orange-600 text-white" : "bg-gray-100"}`}>3. Review</div>
              </div>

              {/* STEP 1: DETAILS */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input className="p-3 border rounded" placeholder="Full name" value={form.name} onChange={(e) => update("name", e.target.value)} />
                    <input className="p-3 border rounded" placeholder="Email" value={form.email} onChange={(e) => update("email", e.target.value)} />
                    <input className="p-3 border rounded" placeholder="Phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
                    <select className="p-3 border rounded" value={form.room} onChange={(e) => update("room", e.target.value)}>
                      <option value="">Select room</option>
                      {rooms.map((r) => <option key={r.id} value={r.id}>{r.title} — {r.price}</option>)}
                    </select>
                    <input className="p-3 border rounded" type="date" value={form.checkIn} onChange={(e) => update("checkIn", e.target.value)} />
                    <input className="p-3 border rounded" type="date" value={form.checkOut} onChange={(e) => update("checkOut", e.target.value)} />
                    <input className="p-3 border rounded" type="number" min={1} value={form.guests} onChange={(e) => update("guests", Number(e.target.value))} />
                    <textarea className="col-span-3 p-3 border rounded" placeholder="Special requests" rows={3} value={form.specialRequests} onChange={(e) => update("specialRequests", e.target.value)} />
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => setStep(2)} className="ml-auto bg-orange-600 text-white px-4 py-2 rounded">Next: Payment</button>
                  </div>
                </div>
              )}

              {/* STEP 2: PAYMENT */}
              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="font-medium">Payment Method</h3>
                  <select className="p-3 border rounded w-full" value={form.paymentMethod} onChange={(e) => update("paymentMethod", e.target.value)}>
                    <option value="">Select payment method</option>
                    <option>MTN Mobile Money</option>
                    <option>Airtel Money</option>
                    <option>Visa</option>
                    <option>Mastercard</option>
                  </select>

                  <div className="flex gap-2">
                    <button onClick={() => setStep(1)} className="bg-gray-200 px-4 py-2 rounded">Back</button>
                    <button onClick={() => { const err = validateStep2(); if (err) toast.error(err); else setStep(3); }} className="ml-auto bg-orange-600 text-white px-4 py-2 rounded">Next: Review</button>
                  </div>
                </div>
              )}

              {/* STEP 3: REVIEW */}
              {step === 3 && (
                <div className="space-y-4">
                  <h3 className="font-medium">Review & Confirm</h3>

                  <div className="border p-4 rounded space-y-2">
                    <div><strong>Name:</strong> {form.name}</div>
                    <div><strong>Email:</strong> {form.email}</div>
                    <div><strong>Phone:</strong> {form.phone}</div>
                    <div><strong>Room:</strong> {selectedRoom?.title ?? "—"}</div>
                    <div><strong>Dates:</strong> {form.checkIn} → {form.checkOut} ({nights} nights)</div>
                    <div><strong>Guests:</strong> {form.guests}</div>
                    <div><strong>Payment:</strong> {form.paymentMethod}</div>
                    <div><strong>Total:</strong> {formatMoney(totalAmount)}</div>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => setStep(2)} className="bg-gray-200 px-4 py-2 rounded">Back</button>
                    <button disabled={loading} onClick={handleSubmit} className="ml-auto bg-black text-white px-4 py-2 rounded">{loading ? "Processing..." : "Confirm & Pay"}</button>
                  </div>
                </div>
              )}

            </div>

            {/* RIGHT: Recommended rooms carousel */}
            <div className="space-y-6">
              <div className=" rounded-xl">
                <h3 className="font-semibold mb-4">Recommended Rooms</h3>
                <Link href='/rooms'>
                <div className="relative">
                  <div className="flex gap-4 overflow-hidden">
                    {displayedRooms.map((room, i) => (
                      <div key={i} className="min-w-[200px] rounded-xl overflow-hidden bg-white">
                        <img src={room.image} className="w-full h-36 object-cover" />
                        <div className="p-3">
                          <div className="font-semibold">{room.title}</div>
                          <div className="text-orange-600 mt-1">{formatMoney(room.priceValue)}/night</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button onClick={prevCarousel} className="absolute top-1/2 left-0 -translate-y-1/2 bg-white p-2 rounded-full shadow"><FaArrowLeft/></button>
                  <button onClick={nextCarousel} className="absolute top-1/2 right-0 -translate-y-1/2 bg-white p-2 rounded-full shadow"><FaArrowRight/></button>
                </div>
                </Link>
              </div>

              {/* quick price box */}
              <div className="bg-white p-6 rounded-xl">
                <div className="text-sm text-gray-600">Nights: {nights}</div>
                <div className="text-lg font-semibold">Total: {formatMoney(totalAmount)}</div>
                <div className="text-xs text-gray-500 mt-2">Prices shown are per night.</div>
              </div>
            </div>

          </div>
        </Container>
      </div>
    </>
  );
}
