"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Container from "../Home/Container";
import { checkAvailability } from "@/lib/actions/bookings";
import Link from "next/link";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { toast } from "sonner";

// --------------------
// Carousel Component
// --------------------
function Carousel({ images }: { images: string[] }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!images || images.length === 0) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [images]);

  if (!images || images.length === 0)
    return (
      <div className="w-full h-64 md:h-96 border-l border-r border-black/10 flex items-center justify-center text-gray-500 bg-gray-100">
        No images
      </div>
    );

  return (
    <div className="relative w-full h-64 md:h-96 overflow-hidden border-l border-r border-black/10 group">
      {images.map((img, index) => (
        <img
          key={index}
          src={img}
          alt={`Room image ${index + 1}`}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-[1200ms] ease-[cubic-bezier(.4,0,.2,1)] ${
            index === current
              ? "opacity-100 scale-100 translate-x-0"
              : "opacity-0 scale-105 translate-x-5"
          }`}
        />
      ))}

      <button
        onClick={() => setCurrent((p) => (p - 1 + images.length) % images.length)}
        className="absolute opacity-0 group-hover:opacity-100 transition-all top-1/2 left-4 -translate-y-1/2 bg-white/90 backdrop-blur-sm text-[#1a1c1e] p-2 rounded-full hover:bg-white"
      >
        <FaArrowLeft />
      </button>

      <button
        onClick={() => setCurrent((p) => (p + 1) % images.length)}
        className="absolute opacity-0 group-hover:opacity-100 transition-all top-1/2 right-4 -translate-y-1/2 bg-white/90 backdrop-blur-sm text-[#1a1c1e] p-2 rounded-full hover:bg-white"
      >
        <FaArrowRight />
      </button>
    </div>
  );
}

// --------------------
// Format Money Helper
// --------------------
const formatMoney = (n: number) => `UGX ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// --------------------
// Main Content Component
// --------------------
export default function AvailabilityContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const guests = parseInt(searchParams.get("guests") || "1");
  const roomTypeId = searchParams.get("roomTypeId") || undefined;

  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate nights
  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const diffTime = checkOutDate.getTime() - checkInDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [checkIn, checkOut]);

  useEffect(() => {
    if (!checkIn || !checkOut) {
      setError("Please provide check-in and check-out dates");
      setLoading(false);
      return;
    }

    const fetchAvailability = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await checkAvailability({
          checkIn,
          checkOut,
          guests,
          roomTypeId: roomTypeId || undefined,
        });

        if (result.error) {
          setError(result.error);
          setRooms([]);
        } else {
          setRooms(result.rooms || []);
          if ((result.rooms || []).length === 0) {
            toast.info("No rooms available for the selected dates");
          }
        }
      } catch (err: any) {
        console.error("Availability check error:", err);
        setError(err.message || "Failed to check availability");
        setRooms([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [checkIn, checkOut, guests, roomTypeId]);

  if (loading) {
    return (
      <div className="py-24 md:py-32 bg-[#fafafa] min-h-screen">
        <Container>
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
            <p className="mt-4 text-gray-600" style={{ fontFamily: 'var(--font-inter)' }}>
              Checking availability...
            </p>
          </div>
        </Container>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-24 md:py-32 bg-[#fafafa] min-h-screen">
        <Container>
          <div className="text-center">
            <p className="text-red-600 mb-4" style={{ fontFamily: 'var(--font-inter)' }}>
              {error}
            </p>
            <Link
              href="/"
              className="inline-block bg-amber-600 text-white px-6 py-3 hover:bg-amber-700 transition-colors"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              Try Again
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-24 md:py-32 bg-[#fafafa] min-h-screen">
      <Container>
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-12 bg-black/20"></div>
            <p className="text-xs uppercase tracking-widest text-black/60 font-medium" style={{ fontFamily: 'var(--font-inter)' }}>
              Available Rooms
            </p>
            <div className="h-px w-12 bg-black/20"></div>
          </div>
          <h1 
            className="text-4xl md:text-5xl font-bold text-[#1a1c1e] mb-4"
            style={{ fontFamily: 'var(--font-cal-sans)', fontWeight: 400 }}
          >
            Check Availability
          </h1>
          {checkIn && checkOut && (
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600" style={{ fontFamily: 'var(--font-inter)' }}>
              <span>Check-in: <strong>{new Date(checkIn).toLocaleDateString()}</strong></span>
              <span>•</span>
              <span>Check-out: <strong>{new Date(checkOut).toLocaleDateString()}</strong></span>
              <span>•</span>
              <span>{nights} {nights === 1 ? 'night' : 'nights'}</span>
              <span>•</span>
              <span>{guests} {guests === 1 ? 'guest' : 'guests'}</span>
            </div>
          )}
        </div>

        {/* Results */}
        {rooms.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg text-gray-600 mb-6" style={{ fontFamily: 'var(--font-inter)' }}>
              No rooms available for the selected dates. Please try different dates.
            </p>
            <Link
              href="/"
              className="inline-block bg-amber-600 text-white px-6 py-3 hover:bg-amber-700 transition-colors"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              Search Again
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {rooms.map((room: any) => {
              const basePrice = Number(room.roomType?.basePrice || 0);
              const totalPrice = basePrice * nights;
              const imageUrls = (room.images || []).map((img: any) => img.image || img);
              
              return (
                <div
                  key={room.id}
                  className="bg-white border-l border-r border-black/10 overflow-hidden hover:shadow-xl transition-shadow"
                >
                  {/* Image Carousel */}
                  <Carousel images={imageUrls.length > 0 ? imageUrls : []} />

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 
                          className="text-xl font-bold text-[#1a1c1e] mb-1"
                          style={{ fontFamily: 'var(--font-cal-sans)', fontWeight: 400 }}
                        >
                          {room.roomType?.name || "Room"}
                        </h3>
                        <p className="text-sm text-gray-500" style={{ fontFamily: 'var(--font-inter)' }}>
                          Room {room.roomNumber} • Floor {room.floor}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    {room.roomType?.description && (
                      <p 
                        className="text-sm text-gray-600 mb-4 line-clamp-2"
                        style={{ fontFamily: 'var(--font-inter)' }}
                      >
                        {room.roomType.description}
                      </p>
                    )}

                    {/* Services */}
                    {room.services && room.services.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                          {room.services.slice(0, 3).map((service: any) => (
                            <span
                              key={service.id}
                              className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                              style={{ fontFamily: 'var(--font-inter)' }}
                            >
                              {service.name}
                            </span>
                          ))}
                          {room.services.length > 3 && (
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                              +{room.services.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Pricing */}
                    <div className="border-t border-gray-200 pt-4 mb-4">
                      <div className="flex items-baseline justify-between mb-2">
                        <span className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-inter)' }}>
                          {formatMoney(basePrice)}/night
                        </span>
                        <span className="text-lg font-bold text-[#1a1c1e]" style={{ fontFamily: 'var(--font-cal-sans)', fontWeight: 400 }}>
                          {formatMoney(totalPrice)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500" style={{ fontFamily: 'var(--font-inter)' }}>
                        Total for {nights} {nights === 1 ? 'night' : 'nights'}
                      </p>
                    </div>

                    {/* Book Button */}
                    <Link
                      href={`/booking?roomTypeId=${room.roomType?.id ?? ""}&roomTypeName=${encodeURIComponent(
                        room.roomType?.name ?? ""
                      )}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`}
                      className="block w-full text-center bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 font-medium transition-colors"
                      style={{ fontFamily: 'var(--font-inter)' }}
                    >
                      Book Now
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
}
