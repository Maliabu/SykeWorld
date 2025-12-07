"use client";

import { useState, useEffect } from "react";
import { FaChevronCircleRight } from "react-icons/fa";
import RoomCard from "./(cards)/RoomCard";
import Container from "./Home/Container";
import { Room } from "./types/types";
import RoomModal from "./rooms/roomModal";
import Link from "next/link";

export default function RoomsSection() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL


  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/rooms/`);
        if (!res.ok) throw new Error("Failed to fetch rooms");
        const data = await res.json();

        const formatted: Room[] = data.map((r: any) => ({
          id: r.id,
          room_number: r.room_number,
          floor: r.floor,
          status: r.status,
          room_type: {
            id: r.room_type.id,
            name: r.room_type.name,
            description: r.room_type.description,
            base_price: r.room_type.base_price,
            max_guests: r.room_type.max_guests,
            services: r.room_type.room_service || [],
          },
          images: r.images?.map((img: any) => img.image) || [],
          price: `$${r.room_type.base_price}/night`,
          priceValue: r.room_type.base_price,
          services: r.room_type.room_service || [],
          reviews: r.reviews || { stars: 0, count: 0 },
        }));

        setRooms(formatted);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  const openModal = (room: Room) => {
    setSelectedRoom(room);
    setModalOpen(true);
  };

  return (
    <section className="pb-12 bg-gray-50">
      <Container>
        <div className="py-12 text-gray-900">
          <div className="md:flex justify-between items-center text-center gap-4">
          <div className="text-3xl tracking-tight font-semibold pt-12">
            The Rooms!
          </div>
          <Link href='/roomservice'>
            <div className="bg-orange-600 text-white rounded-md py-3 flex px-8 items-center">
              Services <FaChevronCircleRight className="ml-2" />
            </div></Link>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading rooms...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room} // ✅ pass the whole room object
              />
            ))}
          </div>
        )}

        {/* Room Modal */}
        <RoomModal
          room={selectedRoom}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      </Container>
    </section>
  );
}
