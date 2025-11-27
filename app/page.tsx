"use client";

import { useState, useEffect } from "react";
import { FaChevronRight } from "react-icons/fa";
import Hero from "./Home/Hero";
import BookingForm from "./(forms)/BookingForm";
import FeatureCard from "./(cards)/FeatureCard";
import Container from "./Home/Container";
import RoomsSection from "./Rooms";
import { useRouter } from "next/navigation";

interface Service {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  image?: string;
}

export default function Home() {
  const [services, setServices] = useState<Service[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/rooms/services/");
        if (!res.ok) throw new Error("Failed to fetch services");
        const data: Service[] = await res.json();
        setServices(data.slice(0, 4)); // first 4 services
      } catch (err) {
        console.error(err);
      }
    };
    fetchServices();
  }, []);

  const hoverCard = (url: string) => router.push(url);

  return (
    <main>
      <Hero />

      <Container>
        <div className="-mt-20 relative z-10">
          <BookingForm />
        </div>
      </Container>

      {/* Luxury Section */}
      <section className="py" id="next-section">
        <Container>

          {/* 3 hardcoded images */}
          <div className="py-10 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative cursor-pointer group overflow-hidden rounded-lg">
              <img
                src="/images/room1.jpg"
                alt="Luxury Image 1"
                className="w-full h-96 object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <FaChevronRight className="text-white text-3xl" />
              </div>
            </div>

            <div className="relative cursor-pointer group overflow-hidden rounded-lg">
              <img
                src="/images/room2.jpg"
                alt="Luxury Image 2"
                className="w-full h-96 object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <FaChevronRight className="text-white text-3xl" />
              </div>
            </div>

            <div className="relative cursor-pointer group overflow-hidden rounded-lg">
              <img
                src="/images/room3.jpg"
                alt="Luxury Image 3"
                className="w-full h-96 object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <FaChevronRight className="text-white text-3xl" />
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Services Section */}
      <section className="bg-stone-300">
        <Container>

          <div className="py-10 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4">
            {services.length > 0 ? (
              services.map((service) => (
                <FeatureCard
                  key={service.id}
                  icon={
                    service.icon ? (
                      <img src={service.icon} alt={service.name} className="w-6 h-6 object-contain" />
                    ) : null
                  }
                  title={service.name}
                  description={service.description || ""}
                  image={service.image || "/images/room1.jpg"}
                />
              ))
            ) : (
              <div className="col-span-4 text-center">Loading services...</div>
            )}
          </div>
        </Container>
      </section>

      {/* Rooms */}
      <RoomsSection />

      {/* Explore Section */}
      <section className="bg-stone-300 py-10">
  <Container>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* First column - large image */}
      <div className="relative group overflow-hidden rounded-lg">
        <img
          src="/images/weather.jpg" // replace with your image
          alt="Explore Paidha"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-white text-xl font-semibold">Explore Paidha</span>
        </div>
      </div>

      {/* Second column - two stacked images */}
      <div className="flex flex-col gap-4">
        {[ "/images/pba.jpg", "/images/hat.jpg" ].map((img, idx) => (
          <div key={idx} className="relative group overflow-hidden rounded-lg h-48 md:h-64">
            <img
              src={img} // replace with your image
              alt="Explore Paidha"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white text-xl font-semibold">Explore Paidha</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </Container>
</section>

    </main>
  );
}
