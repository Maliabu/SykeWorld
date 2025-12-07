"use client";

import Container from "../Home/Container";
import { useState, useEffect } from "react";
import { FaSwimmingPool, FaSpa, FaConciergeBell, FaWifi, FaUtensils, FaDumbbell, FaCocktail, FaCar, FaBus, FaCoffee, FaTv, FaBed } from "react-icons/fa";
import FeatureCard from "../(cards)/FeatureCard";
import Link from "next/link";

interface RoomService {
  id: number;
  name: string;
  icon?: string;
}

interface RoomType {
  id: number;
  name: string;
  description?: string;
  base_price: number;
  max_guests: number;
  services: RoomService[];
}

interface RoomImage {
  id: number;
  image: string;
  caption?: string;
}

interface Room {
  id: number;
  room_number: string;
  floor: number;
  status: string;
  room_type: RoomType;
  images: RoomImage[];
  price: string;
  priceValue: number;
  services: RoomService[];
  reviews: { stars: number; count: number };
}

interface Service {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  image?: string;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL


  // Fetch services
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/rooms/services/`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch services");
        return res.json();
      })
      .then((data) => {
        setServices(data);
        setLoadingServices(false);
      })
      .catch((err) => {
        console.error(err);
        setLoadingServices(false);
      });
  }, []);

  // Fetch rooms
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/rooms/`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch rooms");
        return res.json();
      })
      .then((data) => {
        const formattedRooms: Room[] = data.map((r: any) => ({
          ...r,
          images: r.images || [],
          price: `UGX ${r.room_type?.base_price ?? 0}/night`,
          priceValue: r.room_type?.base_price ?? 0,
          services: r.room_type?.services || [],
          reviews: r.reviews || { stars: 4.5, count: 10 },
        }));
        setRooms(formattedRooms);
        setLoadingRooms(false);
      })
      .catch((err) => {
        console.error(err);
        setLoadingRooms(false);
      });
  }, []);

  // Pick top 3 rooms by rating
  const topRooms = rooms
    .sort((a, b) => b.reviews.stars - a.reviews.stars)
    .slice(0, 3);

  if (loadingServices || loadingRooms) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="py-20 bg-gray-100 min-h-screen">
      <Container>
        <h1 className="text-2xl mb-8 text-center">Our Services</h1>

        {/* Services Grid */}
        <div className="py-10 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-6">
          {services.map((service) => (
            <FeatureCard
              key={service.id}
              icon={service.icon
              }
              title={service.name}
              description={service.description || ""}
            />
          ))}
        </div>


        {/* Recommended Rooms */}
        <h2 className="text-2xl mt-16 mb-6 text-center">Recommended Rooms</h2>
        <Link href='/rooms'>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {topRooms.map((room) => (
            <div
              key={room.id}
              className="bg-white rounded-xl overflow-hidden transition"
            >
              <img src={room.images[0]?.image || "/images/default.jpg"} alt={room.room_type.name} className="w-full h-48 object-cover" />
              <div className="p-4">
                <h3 className="text-xl font-semibold">{room.room_type.name}</h3>
                <div className="text-orange-600 font-medium">{room.price}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span>⭐ {room.reviews.stars.toFixed(1)}</span>
                </div>
                <p className="text-gray-600 mt-2">{room.room_type.description}</p>
              </div>
            </div>
          ))}
        </div>
        </Link>
      </Container>
    </div>
  );
}
