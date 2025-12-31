"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Hero from "./Hero.light";
import Container from "./Container";
import RoomsSection from "./Rooms.light";

interface Service {
  id: number;
  name: string;
  description?: string;
  icon?: string;
}

export default function Home() {
  const router = useRouter();

  const hoverCard = (url: string) => router.push(url);

  return (
    <main>
      <Hero />

      {/* Luxury Section */}
      <section className="py-24 md:py-32 bg-[#fafafa]" id="next-section">
        <Container>
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-12 bg-black/20"></div>
              <p className="text-xs uppercase tracking-widest text-black/60 font-medium" style={{ fontFamily: 'var(--font-inter)' }}>
                Our Amenities
              </p>
              <div className="h-px w-12 bg-black/20"></div>
            </div>
            <h2 
              className="text-4xl md:text-5xl font-bold text-[#1a1c1e] mb-4"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Experience Luxury
            </h2>
            <p 
              className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              Discover our elegant spaces designed for your comfort and relaxation
            </p>
          </div>

          {/* Alternating Image-Text Layout */}
          <div className="space-y-16 md:space-y-24">
            {/* First: Image Right, Text Left */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
              <div className="flex flex-col justify-center space-y-8">
                <h3 
                  className="text-4xl md:text-5xl font-bold text-[#1a1c1e] leading-tight"
                  style={{ fontFamily: 'var(--font-playfair)' }}
                >
                  Luxury Suites
                </h3>
                
                {/* Sleeping Arrangements */}
                <div className="space-y-4">
                  <h4 
                    className="text-sm uppercase tracking-widest text-[#1a1c1e] font-medium"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    SLEEPING ARRANGEMENTS
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-gray-300/50 p-4 space-y-3">
                      <div className="w-6 h-6 text-gray-500">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[#1a1c1e] font-medium mb-1" style={{ fontFamily: 'var(--font-inter)' }}>BEDROOM AREA</p>
                        <p className="text-gray-500 text-sm" style={{ fontFamily: 'var(--font-inter)' }}>1 king-size bed</p>
                        <p className="text-gray-500 text-sm" style={{ fontFamily: 'var(--font-inter)' }}>1 designer lounge sofa</p>
                      </div>
                    </div>
                    <div className="border border-gray-300/50 p-4 space-y-3">
                      <div className="w-6 h-6 text-gray-500">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[#1a1c1e] font-medium mb-1" style={{ fontFamily: 'var(--font-inter)' }}>BATHROOM</p>
                        <p className="text-gray-500 text-sm" style={{ fontFamily: 'var(--font-inter)' }}>1 spa-inspired en-suite</p>
                        <p className="text-gray-500 text-sm" style={{ fontFamily: 'var(--font-inter)' }}>Rain shower & heated floors</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Facilities & Services */}
                <div className="space-y-4">
                  <h4 
                    className="text-sm uppercase tracking-widest text-[#1a1c1e] font-medium"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    FACILITIES & SERVICES
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { icon: "WiFi", label: "Free WiFi" },
                      { icon: "AC", label: "Air Conditioning" },
                      { icon: "TV", label: "Smart TV" },
                      { icon: "Safe", label: "In-room Safe" },
                      { icon: "Mini", label: "Mini Bar" },
                      { icon: "Room", label: "Room Service" },
                    ].map((item, idx) => (
                      <div key={idx} className="text-center space-y-2">
                        <div className="w-8 h-8 text-gray-500 mx-auto">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <p className="text-gray-600 text-xs" style={{ fontFamily: 'var(--font-inter)' }}>{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="relative h-96 md:h-[500px]">
                <img
                  src="/images/room1.png"
                  alt="Luxury Suite"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Second: Image Left, Text Right */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
              <div className="relative h-96 md:h-[500px] order-2 md:order-1">
                <img
                  src="/images/room2.png"
                  alt="Elegant Lobby"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col justify-center space-y-8 order-1 md:order-2">
                <h3 
                  className="text-4xl md:text-5xl font-bold text-[#1a1c1e] leading-tight"
                  style={{ fontFamily: 'var(--font-playfair)' }}
                >
                  Elegant Lobby
                </h3>
                <p 
                  className="text-sm md:text-base text-gray-600 leading-relaxed"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  Step into our beautifully designed lobby, where modern elegance meets timeless sophistication. 
                  The perfect first impression for your stay.
                </p>
                <div className="space-y-4">
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-black/10">
                    <h4 
                      className="text-xl font-bold text-[#1a1c1e] mb-1"
                      style={{ fontFamily: 'var(--font-playfair)' }}
                    >
                      24/7 Concierge
                    </h4>
                    <p 
                      className="text-sm text-gray-600"
                      style={{ fontFamily: 'var(--font-inter)' }}
                    >
                      Our dedicated team is always available to assist with your needs
                    </p>
                  </div>
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-black/10">
                    <h4 
                      className="text-xl font-bold text-[#1a1c1e] mb-1"
                      style={{ fontFamily: 'var(--font-playfair)' }}
                    >
                      Complimentary Services
                    </h4>
                    <p 
                      className="text-sm text-gray-600"
                      style={{ fontFamily: 'var(--font-inter)' }}
                    >
                      Enjoy free WiFi, parking, and morning coffee in our lobby
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Third: Image Right, Text Left */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
              <div className="flex flex-col justify-center space-y-8">
                <h3 
                  className="text-4xl md:text-5xl font-bold text-[#1a1c1e] leading-tight"
                  style={{ fontFamily: 'var(--font-playfair)' }}
                >
                  Premium Amenities
                </h3>
                <p 
                  className="text-sm md:text-base text-gray-600 leading-relaxed"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  Every detail has been carefully curated to ensure your comfort and satisfaction throughout your stay.
                </p>
              </div>
              <div className="relative h-96 md:h-[500px]">
                <img
                  src="/images/room3.png"
                  alt="Premium Amenities"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Rooms Section */}
      <RoomsSection />
    </main>
  );
}
