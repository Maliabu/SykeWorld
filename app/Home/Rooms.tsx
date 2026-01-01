"use client";

import Container from "./Container";
import { useState, useEffect } from "react";
import { Room } from "../types/types";
import { getAllRooms } from "@/lib/actions/bookings";

export default function RoomsSection() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    getAllRooms()
      .then((result) => {
        if (result.success && result.rooms) {
          const mappedRooms: Room[] = result.rooms.map((r: any) => ({
            id: r.id.toString(),
            roomNumber: r.roomNumber,
            floor: r.floor,
            status: r.status,
            roomType: {
              id: Number(r.roomType.id),
              name: r.roomType.name,
              description: r.roomType.description || "",
              basePrice: Number(r.roomType.basePrice),
              maxGuests: r.roomType.maxGuests,
              services: (r.services || []).map((s: any) => ({
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
          }));
          setRooms(mappedRooms);
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
  }, []);

  if (error) return <div className="text-center py-12 text-[#1a1c1e]">Failed to load rooms</div>;
  if (isLoading) return <div className="text-center py-12 text-[#1a1c1e]">Loading rooms...</div>;

  // Get first 3 rooms for display
  const displayRooms = rooms.slice(0, 3);
  const placeholderSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23e5e7eb' width='400' height='300'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='18' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";

  return (
    <section className="py-24 md:py-32 bg-[#fafafa]">
      <Container>
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-12 bg-black/20"></div>
            <p className="text-xs uppercase tracking-widest text-black/60 font-medium" style={{ fontFamily: 'var(--font-inter)' }}>
              Accommodation
            </p>
            <div className="h-px w-12 bg-black/20"></div>
          </div>
          <h2 
            className="text-4xl md:text-5xl font-bold text-[#1a1c1e] mb-4"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Our Rooms
          </h2>
        </div>

        {/* Alternating Image-Text Layout */}
        <div className="space-y-16 md:space-y-24">
          {displayRooms.map((room, index) => {
            const isEven = index % 2 === 0;
            const roomImage = room.images?.[0]?.image || placeholderSvg;
            
            return (
              <div key={room.id} className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
                {/* Text Content */}
                <div className={`flex flex-col justify-center space-y-8 ${isEven ? '' : 'order-2 md:order-2'}`}>
                  <h3 
                    className="text-4xl md:text-5xl font-bold text-[#1a1c1e] leading-tight"
                    style={{ fontFamily: 'var(--font-playfair)' }}
                  >
                    {room.roomType?.name || 'Luxury Room'}
                  </h3>
                  
                  {/* Room Details */}
                  <div className="space-y-4">
                    <h4 
                      className="text-sm uppercase tracking-widest text-[#1a1c1e] font-medium"
                      style={{ fontFamily: 'var(--font-inter)' }}
                    >
                      ROOM DETAILS
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border border-gray-300/50 p-4 space-y-3">
                        <div className="w-6 h-6 text-gray-500">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-[#1a1c1e] font-medium mb-1" style={{ fontFamily: 'var(--font-inter)' }}>ACCOMMODATION</p>
                          <p className="text-gray-500 text-sm" style={{ fontFamily: 'var(--font-inter)' }}>Room {room.roomNumber}</p>
                          <p className="text-gray-500 text-sm" style={{ fontFamily: 'var(--font-inter)' }}>Floor {room.floor}</p>
                        </div>
                      </div>
                      <div className="border border-gray-300/50 p-4 space-y-3">
                        <div className="w-6 h-6 text-gray-500">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-[#1a1c1e] font-medium mb-1" style={{ fontFamily: 'var(--font-inter)' }}>CAPACITY</p>
                          <p className="text-gray-500 text-sm" style={{ fontFamily: 'var(--font-inter)' }}>Up to {room.roomType?.maxGuests || 2} guests</p>
                          <p className="text-gray-500 text-sm" style={{ fontFamily: 'var(--font-inter)' }}>UGX {room.roomType?.basePrice?.toLocaleString()}/night</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Room Services */}
                  {room.services && room.services.length > 0 && (
                    <div className="space-y-4">
                      <h4 
                        className="text-sm uppercase tracking-widest text-[#1a1c1e] font-medium"
                        style={{ fontFamily: 'var(--font-inter)' }}
                      >
                        ROOM SERVICES
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {room.services.slice(0, 6).map((service, idx) => (
                          <div key={service.id || idx} className="flex flex-col items-center text-center space-y-2">
                            <div className="w-8 h-8 text-gray-500">
                              {service.icon ? (
                                <img src={service.icon} alt={service.name} className="w-full h-full object-contain" />
                              ) : (
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <p className="text-gray-600 text-xs" style={{ fontFamily: 'var(--font-inter)' }}>{service.name}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {room.roomType?.description && (
                    <p 
                      className="text-sm text-[#1a1c1e] font-medium"
                      style={{ fontFamily: 'var(--font-inter)' }}
                    >
                      {room.roomType.description}
                    </p>
                  )}
                </div>

                {/* Image */}
                <div className={`relative group overflow-hidden ${isEven ? '' : 'order-1 md:order-1'}`}>
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={roomImage}
                      alt={room.roomType?.name || 'Room'}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = placeholderSvg;
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
