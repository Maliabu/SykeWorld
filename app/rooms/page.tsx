"use client";

import Container from "../Home/Container";
import { useState, useEffect, useMemo } from "react";
import {
  FaArrowLeft,
  FaArrowRight,
  FaStar,
} from "react-icons/fa";
import ReviewsColumn from "./reviews";
import { CarouselProps, Room, RoomService } from "../types/types";


function Carousel({ images }: CarouselProps) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="relative w-full h-64 md:h-96 overflow-hidden rounded-xl shadow group">
      {images.map((img, index) => (
        <img
          key={index}
          src={img}
          alt="Room"
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-[1200ms] ease-[cubic-bezier(.4,0,.2,1)] ${
            index === current ? "opacity-100 scale-100 translate-x-0" : "opacity-0 scale-105 translate-x-5"
          }`}
        />
      ))}

      <button
        onClick={() => setCurrent((p) => (p - 1 + images.length) % images.length)}
        className="absolute opacity-0 group-hover:opacity-100 transition-all top-1/2 left-4 -translate-y-1/2 bg-white p-2 rounded-full shadow"
      >
        <FaArrowLeft />
      </button>

      <button
        onClick={() => setCurrent((p) => (p + 1) % images.length)}
        className="absolute opacity-0 group-hover:opacity-100 transition-all top-1/2 right-4 -translate-y-1/2 bg-white p-2 rounded-full shadow"
      >
        <FaArrowRight />
      </button>
    </div>
  );
}

export default function Page() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortPrice, setSortPrice] = useState<"none" | "low" | "high">("none");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [allServices, setAllServices] = useState<RoomService[]>([]);

  // Fetch rooms
  useEffect(() => {
    setLoading(true);
    fetch("http://localhost:8000/api/rooms/")
      .then((res) => res.json())
      .then((data) => {
        const formatted = data.map((r: any) => ({
          ...r,
          images: (r.images || []).map((img: any) => img.image),
          price: `$${r.room_type?.base_price ?? 0}/night`,
          priceValue: r.room_type?.base_price ?? 0,
          services: r.room_type?.services || [],
          reviews: { stars: 4.5, count: 10 },
        }));
        setRooms(formatted);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Fetch services dynamically
  useEffect(() => {
    fetch("http://localhost:8000/api/rooms/services/")
      .then((res) => res.json())
      .then((data) => setAllServices(data))
      .catch(console.error);
  }, []);

  const toggleService = (s: string) => {
    setSelectedServices((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const filteredRooms = useMemo(() => {
    let r = [...rooms];
    if (selectedServices.length > 0) {
      r = r.filter((room) =>
        selectedServices.every((s) => room.services.map((svc) => svc.name).includes(s))
      );
    }
    if (sortPrice === "low") r.sort((a, b) => a.priceValue - b.priceValue);
    if (sortPrice === "high") r.sort((a, b) => b.priceValue - a.priceValue);
    return r;
  }, [rooms, sortPrice, selectedServices]);

  if (loading) return <div className="p-10 text-center">Loading rooms...</div>;

  return (
    <div className="py-20 bg-gray-100 min-h-screen">
      <Container>
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div className="text-3xl">Rooms</div>
          <div className="md:w-1/2 text-gray-600">
            Choose your perfect stay — luxury, comfort, family-friendly, and more.
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="bg-white p-5 rounded-xl flex flex-col justify-between h-full">
            <div>
              <h3 className="font-semibold text-xl mb-4">Filters</h3>

              <div className="mb-4">
                <label className="font-medium">Sort by Price</label>
                <select
                  className="w-full border p-2 rounded mt-1"
                  value={sortPrice}
                  onChange={(e) => setSortPrice(e.target.value as any)}
                >
                  <option value="none">None</option>
                  <option value="low">Lowest First</option>
                  <option value="high">Highest First</option>
                </select>
              </div>

              <div>
                <h4 className="font-medium mb-2">Services</h4>
                {allServices.map((s) => (
                  <label key={s.id} className="block text-sm capitalize mb-1">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={selectedServices.includes(s.name)}
                      onChange={() => toggleService(s.name)}
                    />
                    {s.name}
                  </label>
                ))}
              </div>
            </div>
            <div className="mt-5">
              <ReviewsColumn />
            </div>
          </div>

          <div className="md:col-span-3 space-y-20">
            {filteredRooms.length === 0 && (
              <div className="p-6 bg-white rounded shadow text-center">
                No rooms match your filters.
              </div>
            )}

            {filteredRooms.map((room, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <Carousel images={room.images} />

                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold">{room.room_type?.name}</h2>
                  <div className="text-lg font-medium text-orange-600">{room.price}</div>

                  <div className="flex items-center gap-1 text-yellow-500">
                    {Array.from({ length: Math.round(room.reviews.stars) }).map((_, i) => (
                      <FaStar key={i} />
                    ))}
                    <span className="ml-2 text-sm text-gray-500">
                      {room.reviews.stars} • {room.reviews.count} reviews
                    </span>
                  </div>

                  <p className="text-gray-600">{room.room_type?.description}</p>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    {room.services.map((service, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-orange-600">{service.icon}</span>
                        <span className="text-gray-800">{service.name}</span>
                      </div>
                    ))}
                  </div>

                  <a
                    href={`/booking?room=${encodeURIComponent(room.room_type?.name || "")}`}
                    className="inline-block mt-4 bg-orange-600 text-white px-5 py-2 rounded-lg shadow hover:bg-orange-600 transition"
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
