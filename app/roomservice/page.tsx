"use client";

import Container from "../Home/Container";
import { useEffect, useState } from "react";
import Link from "next/link";
import FeatureCard from "../(cards)/FeatureCard";
import { Room, RoomService } from "../types/types";
import { getAllServices, getAllRooms } from "@/lib/actions/bookings";

export default function ServicesPage() {
  const [services, setServices] = useState<RoomService[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingRooms, setLoadingRooms] = useState(true);

  useEffect(() => {
    // Load services
    getAllServices()
      .then((result) => {
        if (result.success && result.services) {
          setServices(
            result.services.map((s: any) => ({
              id: Number(s.id),
              name: s.name,
              description: s.description || "",
              icon: s.icon || undefined,
            }))
          );
        }
      })
      .catch(console.error)
      .finally(() => setLoadingServices(false));

    // Load rooms
    getAllRooms()
      .then((result) => {
        if (result.success && result.rooms) {
          setRooms(
            result.rooms.map((r: any) => ({
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
            }))
          );
        }
      })
      .catch(console.error)
      .finally(() => setLoadingRooms(false));
  }, []);

  if (loadingServices || loadingRooms)
    return <div className="p-10 text-center">Loading...</div>;

  // Top 3 recommended rooms by any criteria you choose
  const topRooms = rooms.slice(0, 3);

  return (
    <div className="py-20 bg-[#fafafa] min-h-screen">
      <Container>
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-12 bg-black/20"></div>
            <p className="text-xs uppercase tracking-widest text-black/60 font-medium" style={{ fontFamily: 'var(--font-inter)' }}>
              What We Offer
            </p>
            <div className="h-px w-12 bg-black/20"></div>
          </div>
          <h1 
            className="text-4xl md:text-5xl font-bold text-[#1a1c1e] mb-4 tracking-tight"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Our Services
          </h1>
          <p 
            className="text-sm md:text-base text-gray-600 max-w-3xl mx-auto"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            Everything you need for a perfect stay
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-20">
          {services.map((service) => (
            <FeatureCard
              key={service.id}
              icon={service.icon}
              title={service.name}
              description={service.description || ""}
            />
          ))}
        </div>

        {/* Recommended Rooms */}
        <div className="text-center mb-12">
          <h2 
            className="text-3xl md:text-4xl font-bold text-[#1a1c1e] mb-4"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Recommended Rooms
          </h2>
          <p 
            className="text-base text-gray-600"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            Handpicked selections for your perfect stay
          </p>
        </div>

        <Link href="/rooms">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {topRooms.map((room) => (
              <div
                key={room.id}
                className="bg-black/2 border border-black/10 rounded-lg overflow-hidden hover:border-black/20 transition-all duration-300 transform hover:-translate-y-2 group"
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={room.images[0]?.image || "/images/default.jpg"}
                    alt={room.roomType?.name || "Room"}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
                <div className="p-6">
                  <h3 
                    className="text-2xl font-bold text-[#1a1c1e] mb-2"
                    style={{ fontFamily: 'var(--font-playfair)' }}
                  >
                    {room.roomType?.name}
                  </h3>

                  <div 
                    className="text-2xl font-bold text-amber-600 mb-4"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    UGX {room.roomType?.basePrice?.toLocaleString()}/night
                  </div>

                  <p 
                    className="text-gray-600 leading-relaxed"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    {room.roomType?.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Link>
      </Container>
    </div>
  );
}
