"use client";

import Container from "../Home/Container";
import { useState, useEffect, useMemo } from "react";
import { FaArrowLeft, FaArrowRight, FaStar } from "react-icons/fa";
import { Room, RoomService, CarouselProps } from "../types/types";
import useSWR from "swr";

// --------------------
// Fetcher
// --------------------
const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

// --------------------
// Carousel
// --------------------
function Carousel({ images }: CarouselProps) {
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
      <div className="w-full h-64 md:h-96 border-l border-r border-black/10 flex items-center justify-center text-gray-500">
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
// Page
// --------------------
export default function Page() {
  const [sortPrice, setSortPrice] = useState<"none" | "low" | "high">("none");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [allServices, setAllServices] = useState<RoomService[]>([]);

  // Rooms via Server Action
  const [roomsData, setRoomsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    import("@/lib/actions/bookings").then(({ getAllRooms }) => {
      getAllRooms()
        .then((result) => {
          if (result.success) {
            console.log('✅ getAllRooms returned:', result.rooms?.length || 0, 'rooms');
            console.log('Room types in data:', [...new Set(result.rooms?.map((r: any) => r.roomType?.name || r.roomType?.id))]);
            setRoomsData({ rooms: result.rooms || [] });
          } else {
            console.error("getAllRooms error:", result.error, result.details);
            setError(new Error(result.error || "Failed to load rooms"));
          }
        })
        .catch((err) => {
          console.error("getAllRooms catch error:", err);
          setError(err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }).catch((importError) => {
      console.error("Failed to import getAllRooms:", importError);
      setError(importError);
      setIsLoading(false);
    });
  }, []);

  // Map API → Room[] and group by room type (only show unique room types with available rooms)
  const rooms: Room[] = useMemo(() => {
    if (!roomsData?.rooms) return [];

    // Debug: Log first room structure
    if (roomsData.rooms.length > 0) {
      console.log('First room structure:', JSON.stringify(roomsData.rooms[0], null, 2));
      console.log('Room type structure:', roomsData.rooms[0]?.roomType);
    }

    // Map all rooms
    const allRooms = roomsData.rooms.map((r: any) => {
      // Debug: Log room structure
      if (!r.roomType) {
        console.warn('Room missing roomType:', r);
      }
      
      // Handle roomType.id - it's a UUID string, keep it as string
      const roomTypeId = r.roomType?.id;
      
      if (!roomTypeId) {
        console.error('Room missing roomType.id:', r.id, 'Full room:', r);
      }
      
      return {
        id: r.id.toString(),
        roomNumber: r.roomNumber,
        floor: r.floor,
        status: r.status,
        roomType: {
          id: roomTypeId || "", // Keep as string (UUID)
          name: r.roomType?.name || "",
          description: r.roomType?.description || "",
          basePrice: Number(r.roomType?.basePrice || 0),
          maxGuests: r.roomType?.maxGuests || 2,
          services: (r.roomType?.services || []).map((s: any) => ({
            id: Number(s.id),
            name: s.name,
            description: s.description || "",
            icon: s.icon || undefined,
          })),
        },
      images: (r.images || []).map((img: any) => ({
        id: Number(img.id),
        image: img.image,
        caption: img.caption || "",
      })),
      services: (r.services || []).map((s: any) => ({
        id: Number(s.id),
        name: s.name,
        description: s.description || "",
        icon: s.icon || undefined,
      })),
      reviews: (r.reviews || []).map((rev: any, idx: number) => ({
        id: rev.id?.toString() || `review-${r.id}-${idx}`,
        user: rev.user || rev.userId || "Anonymous",
        message: rev.comment || "",
        stars: rev.stars ?? 5,
        avatar: rev.avatar || undefined,
        created_at: rev.created || new Date().toISOString(),
      })),
      };
    });

    // Group by room type ID and keep only one room per type (the first one with images if available)
    // This shows room types, not individual rooms - users can book any room of that type
    // Note: roomType.id is a UUID string, not a number
    const roomTypeMap = new Map<string | number, Room>();
    
    allRooms.forEach((room: Room) => {
      const roomTypeId = room.roomType.id;
      
      // Skip rooms with invalid room type IDs
      if (!roomTypeId || roomTypeId === 0) {
        console.warn('Skipping room with invalid roomType.id:', roomTypeId, room);
        return;
      }
      
      // Convert to string for consistent comparison (UUIDs are strings)
      const roomTypeIdKey = String(roomTypeId);
      
      if (!roomTypeMap.has(roomTypeIdKey)) {
        // First room of this type - add it
        roomTypeMap.set(roomTypeIdKey, room);
      } else {
        // If current room has more images, use it instead
        const existingRoom = roomTypeMap.get(roomTypeIdKey)!;
        if (room.images.length > existingRoom.images.length) {
          roomTypeMap.set(roomTypeIdKey, room);
        }
      }
    });

    // Debug: Log room types found
    console.log('Room types found:', Array.from(roomTypeMap.keys()));
    console.log('Total rooms before grouping:', allRooms.length);
    console.log('Total room types after grouping:', roomTypeMap.size);

    // Return unique room types only (showing all available room types)
    return Array.from(roomTypeMap.values());
  }, [roomsData]);

  // Services for filters
  useEffect(() => {
    import("@/lib/actions/bookings").then(({ getAllServices }) => {
      getAllServices().then((result) => {
        if (result.success && result.services) {
          setAllServices(
            (result.services || []).map((s: any) => ({
              id: Number(s.id),
              name: s.name,
              description: s.description || "",
              icon: s.icon || undefined,
            }))
          );
        }
      }).catch(console.error);
    });
  }, []);

  const toggleService = (s: string) => {
    setSelectedServices((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  // Filter & sort
  const filteredRooms = useMemo(() => {
    let r = [...rooms];

    if (selectedServices.length > 0) {
      r = r.filter((room) =>
        selectedServices.every((s) =>
          room.services?.map((svc) => svc.name).includes(s)
        )
      );
    }

    if (sortPrice === "low")
      r.sort((a, b) => a.roomType.basePrice - b.roomType.basePrice);

    if (sortPrice === "high")
      r.sort((a, b) => b.roomType.basePrice - a.roomType.basePrice);

    return r;
  }, [rooms, sortPrice, selectedServices]);

  // Early returns must come AFTER all hooks
  if (isLoading) {
    return <div className="p-10 text-center text-[#1a1c1e] bg-[#fafafa] min-h-screen flex items-center justify-center" style={{ fontFamily: 'var(--font-inter)' }}>Loading rooms...</div>;
  }

  if (error) {
    return (
      <div className="p-10 text-center bg-[#fafafa] min-h-screen flex flex-col items-center justify-center">
        <div className="text-red-600 font-semibold mb-2" style={{ fontFamily: 'var(--font-inter)' }}>Failed to load rooms</div>
        <div className="text-sm text-gray-500 mb-4" style={{ fontFamily: 'var(--font-inter)' }}>
          {error instanceof Error ? error.message : "An error occurred"}
        </div>
        <button
          onClick={() => {
            setError(null);
            setIsLoading(true);
            import("@/lib/actions/bookings").then(({ getAllRooms }) => {
              getAllRooms()
                .then((result) => {
                  if (result.success) {
                    setRoomsData({ rooms: result.rooms || [] });
                  } else {
                    setError(new Error(result.error || "Failed to load rooms"));
                  }
                })
                .catch((err) => {
                  setError(err);
                })
                .finally(() => {
                  setIsLoading(false);
                });
            });
          }}
          className="px-4 py-3 bg-amber-600 text-white hover:bg-amber-700 transition uppercase tracking-wide"
          style={{ fontFamily: 'var(--font-inter)' }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="py-24 md:py-32 bg-[#fafafa] min-h-screen">
      <Container>
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-12 bg-black/20"></div>
            <p className="text-xs uppercase tracking-widest text-black/60 font-medium" style={{ fontFamily: 'var(--font-inter)' }}>
              Accommodations
            </p>
            <div className="h-px w-12 bg-black/20"></div>
          </div>
          <h1 
            className="text-4xl md:text-5xl font-bold text-[#1a1c1e] mb-4"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Our Rooms
          </h1>
          <p 
            className="text-sm text-gray-600 max-w-3xl mx-auto leading-relaxed"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            Choose your perfect stay — luxury, comfort, family-friendly, and more. Each room is thoughtfully designed for your comfort.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Filters */}
          <div className="p-6 bg-white flex flex-col justify-between h-full relative overflow-hidden">
            <div 
              className="absolute inset-0 opacity-[0.08] bg-cover bg-center bg-no-repeat pointer-events-none"
              style={{ backgroundImage: 'url(/images/bg.jpeg)' }}
            />
            <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px w-12 bg-white/50"></div>
                  <p className="text-xs uppercase tracking-widest text-white/70 font-medium" style={{ fontFamily: 'var(--font-inter)' }}>
                    Filter
                  </p>
                  <div className="h-px w-12 bg-white/50"></div>
                </div>
                <h3 
                  className="text-2xl md:text-3xl font-bold text-[#1a1c1e] mb-6"
                  style={{ fontFamily: 'var(--font-playfair)' }}
                >
                  Filters
                </h3>
              </div>

              <div className="mb-6">
                <label 
                  className="block text-xs uppercase tracking-widest text-black/60 font-medium mb-2"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  Sort by Price
                </label>
                <select
                  className="w-full bg-transparent border-b border-gray-400/50 px-0 py-3 text-[#1a1c1e] focus:outline-none focus:border-b-amber-600 transition-all"
                  value={sortPrice}
                  onChange={(e) =>
                    setSortPrice(e.target.value as "none" | "low" | "high")
                  }
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  <option value="none" className="bg-white">No sorting</option>
                  <option value="low" className="bg-white">Lowest First</option>
                  <option value="high" className="bg-white">Highest First</option>
                </select>
              </div>

              <div>
                <h4 
                  className="text-xs uppercase tracking-widest text-white/70 font-medium mb-3"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  Services
                </h4>
                {allServices.map((s, index) => (
                  <label 
                    key={index} 
                    className="block text-sm text-gray-600 capitalize mb-2 cursor-pointer"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    <input
                      type="checkbox"
                      className="mr-2 accent-amber-600"
                      checked={selectedServices.includes(s.name)}
                      onChange={() => toggleService(s.name)}
                    />
                    {s.name}
                  </label>
                ))}
              </div>
            </div>
            </div>

          </div>

          {/* Rooms */}
          <div className="md:col-span-3 space-y-8">
            {filteredRooms.length === 0 && (
              <div className="p-6 border-l border-r border-black/10 text-center text-gray-600" style={{ fontFamily: 'var(--font-inter)' }}>
                No rooms match your filters.
              </div>
            )}

            {filteredRooms.map((room, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start bg-white transition-all relative overflow-hidden"
              >
                <div 
                  className="absolute inset-0 opacity-[0.10] bg-cover bg-center bg-no-repeat pointer-events-none"
                  style={{ backgroundImage: 'url(/images/bg.jpeg)' }}
                />
                <div className="relative z-10">
                  <Carousel
                    images={room.images?.map((img) => img.image) || []}
                  />
                </div>

                <div className="space-y-6 p-8 relative z-10">
                  <div>
                    <h2 
                      className="text-3xl md:text-4xl font-bold text-[#1a1c1e] mb-2"
                      style={{ fontFamily: 'var(--font-playfair)' }}
                    >
                      {room.roomType?.name}
                    </h2>
                    <div 
                      className="text-2xl font-bold text-amber-600"
                      style={{ fontFamily: 'var(--font-inter)' }}
                    >
                      UGX {room.roomType?.basePrice?.toLocaleString()}/night
                    </div>
                  </div>

                  {/* Reviews */}
                  <div className="flex items-center gap-1">
                    {(() => {
                      const reviews = room.reviews || [];
                      const avgStars =
                        reviews.length > 0
                          ? reviews.reduce(
                              (sum, r) => sum + (r.stars ?? 5),
                              0
                            ) / reviews.length
                          : 0;

                      return (
                        <>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <FaStar
                              key={i}
                              className={
                                i < Math.round(avgStars)
                                  ? "text-amber-500"
                                  : "text-gray-400"
                              }
                            />
                          ))}
                          <span className="ml-2 text-sm text-gray-500" style={{ fontFamily: 'var(--font-inter)' }}>
                            {reviews.length > 0
                              ? `${avgStars.toFixed(1)} • ${
                                  reviews.length
                                } review${reviews.length > 1 ? "s" : ""}`
                              : "No reviews"}
                          </span>
                        </>
                      );
                    })()}
                  </div>

                  <p 
                    className="text-xs text-gray-600 leading-relaxed"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    {room.roomType?.description}
                  </p>

                  <div className="flex gap-3 flex-wrap">
                    {room.services?.map((service, index) => (
                      <span
                        key={index}
                        className="text-[#1a1c1e] bg-black/5 border border-black/20 py-1 px-3 text-sm"
                        style={{ fontFamily: 'var(--font-inter)' }}
                      >
                        {service.name}
                      </span>
                    ))}
                  </div>

                  <a
                    href={`/booking?roomTypeId=${room.roomType?.id ?? ""}&roomTypeName=${encodeURIComponent(
                      room.roomType?.name ?? ""
                    )}`}
                    className="inline-block mt-4 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 text-sm font-medium tracking-wide uppercase transition"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    Book This Room
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
}
