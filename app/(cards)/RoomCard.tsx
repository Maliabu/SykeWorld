"use client";

import { useState } from "react";
import * as React from "react";
import { FaChevronRight } from "react-icons/fa";
import { Room } from "../types/types";
import RoomModal from "../rooms/roomModal";

interface RoomCardProps {
  room: Room;
}

export default function RoomCard({ room }: RoomCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Safely get first image - use data URI placeholder to prevent 404 loops
  const placeholderSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23e5e7eb' width='400' height='300'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='18' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";
  const mainImage = room.images?.[0]?.image || placeholderSvg;
  const maxGuests = room.roomType?.maxGuests || 2;
  const [imageError, setImageError] = React.useState(false);

  return (
    <>
      <div
        className="bg-white cursor-pointer group"
        onClick={() => setIsOpen(true)}
      >
        {/* Room Image */}
        <div className="relative w-full h-64 md:h-80 overflow-hidden">
          <img
            src={imageError ? placeholderSvg : mainImage}
            alt={room.roomType?.name || "Room image"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => {
              if (!imageError) setImageError(true);
            }}
          />
          {/* Expand Icon */}
          <div className="absolute bottom-4 right-4 bg-white/90 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            <FaChevronRight className="text-black text-sm" />
          </div>
        </div>

        {/* Room Info */}
        <div className="p-4">
          <h3 
            className="text-xl font-semibold text-stone-900 mb-2"
            style={{ fontFamily: 'var(--font-cal-sans)', fontWeight: 400 }}
          >
            {room.roomType?.name || "Unknown Room Type"}
          </h3>
          <p 
            className="text-sm text-stone-600"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            1 bed | {maxGuests} sleeps
          </p>
        </div>
      </div>

      {/* Modal for full room details */}
      <RoomModal room={room} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
