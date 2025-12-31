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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-3xl p-6 relative overflow-y-auto max-h-[90vh] border border-gray-200 dark:border-gray-800"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          <FaTimes size={24} />
        </button>

        {/* Room Image */}
        <div className="w-full h-64 relative mb-4">
          {room.images && room.images.length > 0 && room.images[0]?.image ? (
            <img
              src={room.images[0].image}
              alt={room.roomType?.name || "Room image"}
              className="object-cover w-full h-full rounded-lg"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-400">No image available</span>
            </div>
          )}
        </div>

        {/* Title & Price */}
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-semibold">{room.roomType?.name || "Unknown Room"}</h2>
          <span className="text-orange-600 font-bold">
            UGX {room.roomType?.basePrice?.toLocaleString() || "N/A"}
          </span>
        </div>

        {/* Description */}
        {room.roomType?.description && (
          <p className="text-gray-700 dark:text-gray-300 mb-4">{room.roomType.description}</p>
        )}

        {/* Services */}
        {room.services && room.services.length > 0 && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Services</h3>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300">
              {room.services.map((s) => (
                <li key={s.id}>{s.name}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Reviews */}
        {room.reviews && room.reviews.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Reviews</h3>
            <div className="flex items-center gap-2 mb-1">
              {(() => {
                const avgStars = room.reviews.reduce((sum, r) => sum + (r.stars || 0), 0) / room.reviews.length;
                return Array.from({ length: Math.round(avgStars) }).map(
                  (_, idx) => (
                    <FaStar key={idx} className="text-yellow-400" />
                  )
                );
              })()}
              <span className="text-gray-500 dark:text-gray-400 text-sm">({room.reviews.length})</span>
            </div>
            {/* Review List */}
            <div className="mt-4 space-y-3 max-h-48 overflow-y-auto">
              {room.reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-200 dark:border-gray-700 pb-2">
                  <div className="flex items-center gap-2 mb-1">
                    {Array.from({ length: review.stars || 0 }).map((_, idx) => (
                      <FaStar key={idx} className="text-yellow-400 text-xs" />
                    ))}
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{review.user}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{review.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
