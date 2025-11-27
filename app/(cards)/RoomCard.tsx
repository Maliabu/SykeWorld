"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FaChevronCircleRight, FaStar } from "react-icons/fa";// import your interface
import { Room } from "../types/types";
import RoomModal from "../rooms/roomModal";

interface RoomCardProps {
  room: Room;
}

export default function RoomCard({ room }: RoomCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <motion.div
        className="bg-white rounded-lg overflow-hidden cursor-pointer"
        whileHover={{ scale: 1.05 }}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        onClick={() => setIsOpen(true)}
      >
        <div className="relative w-full h-64">
          <img src={room.images[0]} alt={room.room_number} className="object-cover w-full h-full" />
          <div className="flex gap-1 absolute top-2 left-2 text-orange-300">
            {Array.from({ length: Math.round(room.reviews.stars) }).map((_, i) => (
              <FaStar key={i} />
            ))}
          </div>
          <div className="flex gap-1 absolute top-2 right-2 items-center">
            <FaChevronCircleRight className="text-orange-700 h-8 w-8 p-2 rounded-md" />
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold">{room.room_type.name}</h3>
          <div className="text-orange-600 font-medium">{room.price}</div>
        </div>
      </motion.div>

      {/* Modal for full room details */}
      <RoomModal room={room} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
