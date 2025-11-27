"use client";

import { motion } from "framer-motion";
import { FaStar, FaTimes } from "react-icons/fa";
import { Room } from "../types/types";

interface RoomModalProps {
  room: Room | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function RoomModal({ room, isOpen, onClose }: RoomModalProps) {
  if (!isOpen || !room) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <motion.div
        className="bg-white rounded-lg w-full max-w-3xl p-6 relative overflow-y-auto max-h-[90vh]"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
        >
          <FaTimes size={24} />
        </button>

        {/* Room Image */}
        <div className="w-full h-64 relative mb-4">
          <img
            src={room.images[0]}
            alt={room.room_type.name}
            className="object-cover w-full h-full rounded-lg"
          />
        </div>

        {/* Title & Price */}
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-semibold">{room.room_type.name}</h2>
          <span className="text-orange-600 font-bold">{room.price}</span>
        </div>

        {/* Description */}
        {room.room_type.description && (
          <p className="text-gray-700 mb-4">{room.room_type.description}</p>
        )}

        {/* Services */}
        {room.services.length > 0 && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Services</h3>
            <ul className="list-disc list-inside text-gray-700">
              {room.services.map((s) => (
                <li key={s.id}>{s.name}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Reviews */}
        {room.reviews && (
          <div>
            <h3 className="font-semibold mb-2">Reviews</h3>
            <div className="flex items-center gap-2 mb-1">
              {Array.from({ length: Math.round(room.reviews.stars) }).map(
                (_, idx) => (
                  <FaStar key={idx} className="text-yellow-400" />
                )
              )}
              <span className="text-gray-500 text-sm">({room.reviews.count})</span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
