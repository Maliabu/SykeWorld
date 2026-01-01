"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import Hero from "./Hero";
import Container from "./Container";
import RoomsSection from "./Rooms";

interface Service {
  id: number;
  name: string;
  description?: string;
  icon?: string;
}

export default function Home() {
  const router = useRouter();
  const [showScrollTop, setShowScrollTop] = useState(false);

  const hoverCard = (url: string) => router.push(url);

  useEffect(() => {
    const handleScroll = () => {
      // Show button when user scrolls down more than 400px
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                      { icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z", label: "Panoramic mountain view" },
                      { icon: "M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z", label: "In-room fireplace" },
                      { icon: "M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0", label: "High-speed WiFi" },
                      { icon: "M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z", label: "Climate control" },
                      { icon: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z", label: "Movie Theater" },
                      { icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", label: "Luxury minibar" },
                      { icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9", label: "24/7 concierge service" },
                      { icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7", label: "Direct access to hiking trails" }
                    ].map((item, idx) => (
                      <div key={idx} className="flex flex-col items-center text-center space-y-2">
                        <div className="w-8 h-8 text-gray-500">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                          </svg>
                        </div>
                        <p className="text-gray-600 text-xs" style={{ fontFamily: 'var(--font-inter)' }}>{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="relative group overflow-hidden">
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src="/images/pexels-creative-vix-370984.jpg"
                    alt="Luxury Suites"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
                {/* Overlay Card */}
                <div className="absolute top-4 right-4 max-w-[300px] z-10">
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-black/10">
                    <h4 
                      className="text-xl font-bold text-[#1a1c1e] mb-1"
                      style={{ fontFamily: 'var(--font-playfair)' }}
                    >
                      Luxury Suites
                    </h4>
                    <p 
                      className="text-sm text-gray-600"
                      style={{ fontFamily: 'var(--font-inter)' }}
                    >
                      Elegant accommodations for your comfort
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Second: Image Left, Text Right */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
              <div className="relative group overflow-hidden order-2 md:order-1">
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src="/images/lobby.png"
                    alt="Elegant Lobby"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
                {/* Overlay Card */}
                <div className="absolute top-4 right-4 max-w-[300px] z-10">
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-black/10">
                    <h4 
                      className="text-xl font-bold text-[#1a1c1e] mb-1"
                      style={{ fontFamily: 'var(--font-playfair)' }}
                    >
                      Elegant Lobby
                    </h4>
                    <p 
                      className="text-sm text-gray-600"
                      style={{ fontFamily: 'var(--font-inter)' }}
                    >
                      Timeless elegance meets contemporary design
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col justify-center order-1 md:order-2 space-y-8">
                <h3 
                  className="text-4xl md:text-5xl font-bold text-[#1a1c1e] leading-tight"
                  style={{ fontFamily: 'var(--font-playfair)' }}
                >
                  Elegant Lobby
                </h3>
                
                {/* Lobby Features */}
                <div className="space-y-4">
                  <h4 
                    className="text-sm uppercase tracking-widest text-[#1a1c1e] font-medium"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    LOBBY FEATURES
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {[
                      { icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z", label: "Soaring ceilings with grand architecture" },
                      { icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z", label: "Bespoke furnishings & curated art" },
                      { icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z", label: "24/7 concierge service" },
                      { icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01", label: "Restaurant reservations & local excursions" },
                      { icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4", label: "Timeless elegance & contemporary design" }
                    ].map((item, idx) => (
                      <div key={idx} className="flex flex-col items-center text-center space-y-2">
                        <div className="w-8 h-8 text-gray-500">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                          </svg>
                        </div>
                        <p className="text-gray-600 text-xs" style={{ fontFamily: 'var(--font-inter)' }}>{item.label}</p>
                      </div>
                    ))}
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
                
                {/* Amenities List */}
                <div className="space-y-4">
                  <h4 
                    className="text-sm uppercase tracking-widest text-[#1a1c1e] font-medium"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    AMENITIES & SERVICES
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                      { icon: "M13 10V3L4 14h7v7l9-11h-7z", label: "State-of-the-art fitness center" },
                      { icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z", label: "Serene spa & wellness facilities" },
                      { icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253", label: "Award-winning restaurant" },
                      { icon: "M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z", label: "Rooftop terrace with panoramic views" },
                      { icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z", label: "Business center & meeting rooms" },
                      { icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", label: "Evening cocktail lounge" },
                      { icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", label: "Valet parking & transportation" }
                    ].map((item, idx) => (
                      <div key={idx} className="flex flex-col items-center text-center space-y-2">
                        <div className="w-8 h-8 text-gray-500">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                          </svg>
                        </div>
                        <p className="text-gray-600 text-xs" style={{ fontFamily: 'var(--font-inter)' }}>{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="relative group overflow-hidden">
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src="/images/bg-3.jpg"
                    alt="Premium Amenities"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
                {/* Overlay Card */}
                <div className="absolute top-4 right-4 max-w-[300px] z-10">
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-black/10">
                    <h4 
                      className="text-xl font-bold text-[#1a1c1e] mb-1"
                      style={{ fontFamily: 'var(--font-playfair)' }}
                    >
                      Premium Amenities
                    </h4>
                    <p 
                      className="text-sm text-gray-600"
                      style={{ fontFamily: 'var(--font-inter)' }}
                    >
                      World-class facilities at your service
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>


      {/* Rooms */}
      <RoomsSection />

      {/* Explore Section */}
      <section className="py-24 md:py-32 bg-[#fafafa]">
        <Container>
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-12 bg-black/20"></div>
              <p className="text-xs uppercase tracking-widest text-black/60 font-medium" style={{ fontFamily: 'var(--font-inter)' }}>
                Local Attractions
              </p>
              <div className="h-px w-12 bg-black/20"></div>
            </div>
            <h2 
              className="text-4xl md:text-5xl font-bold text-[#1a1c1e] mb-4"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Explore Paidha
            </h2>
            <p 
              className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              Discover the beauty around us
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
            {/* Left: Features with Icons */}
            <div className="flex flex-col justify-center space-y-8">
              <h3 
              className="text-4xl md:text-5xl font-bold text-[#1a1c1e] leading-tight"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Discover Paidha
              </h3>
              
              {/* Paidha Features */}
              <div className="space-y-4">
                <h4 
                  className="text-sm uppercase tracking-widest text-white font-medium"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  LOCAL ATTRACTIONS
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {[
                    { icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 002 2h2.945M9 11V9a2 2 0 012-2h2a2 2 0 012 2v2m-6 4h6m-6 0V9m6 6v2a2 2 0 01-2 2H9a2 2 0 01-2-2v-2", label: "Scenic landscapes" },
                    { icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z", label: "Rich cultural heritage" },
                    { icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7", label: "Adventure activities" },
                    { icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253", label: "Local markets" },
                    { icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z", label: "Traditional festivals" },
                    { icon: "M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z", label: "Natural wonders" }
                  ].map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center text-center space-y-2">
                      <div className="w-8 h-8 text-gray-500">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                        </svg>
                      </div>
                      <p className="text-gray-600 text-xs" style={{ fontFamily: 'var(--font-inter)' }}>{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* View More Link */}
              <Link
                href="/visit"
                className="inline-flex items-center gap-2 text-[#1a1c1e] hover:text-amber-600 transition-colors group"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                <span className="text-sm uppercase tracking-wide">View More</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>

            {/* Right: Images */}
            <div className="space-y-8">
              {/* Large image */}
              <div className="relative group overflow-hidden h-[400px]">
                <img
                  src="/images/weather.jpg"
                  alt="Explore Paidha"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {/* Overlay Card */}
                <div className="absolute top-4 right-4 max-w-[300px] z-10">
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-black/10">
                    <h4 
                      className="text-xl font-bold text-[#1a1c1e] mb-1"
                      style={{ fontFamily: 'var(--font-playfair)' }}
                    >
                      Discover Paidha
                    </h4>
                    <p 
                      className="text-sm text-gray-600"
                      style={{ fontFamily: 'var(--font-inter)' }}
                    >
                      The Hidden Gem of West Nile
                    </p>
                  </div>
                </div>
              </div>

              {/* Two stacked images */}
              <div className="grid grid-cols-2 gap-8">
                {[ 
                  { src: "/images/pba.jpg", title: "Local Culture", desc: "Rich Alur heritage" },
                  { src: "/images/hat.jpg", title: "Natural Beauty", desc: "Scenic landscapes" }
                ].map((item, idx) => (
                  <div key={idx} className="relative group overflow-hidden h-64">
                    <img
                      src={item.src}
                      alt="Explore Paidha"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    {/* Overlay Card */}
                    <div className="absolute top-4 right-4 max-w-[300px] z-10">
                      <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                        <h4 
                          className="text-xl font-bold text-black mb-1"
                          style={{ fontFamily: 'var(--font-playfair)' }}
                        >
                          {item.title}
                        </h4>
                        <p 
                          className="text-sm text-stone-800"
                          style={{ fontFamily: 'var(--font-inter)' }}
                        >
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 w-12 h-12 bg-amber-600 hover:bg-amber-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
          aria-label="Scroll to top"
        >
          <svg
            className="w-6 h-6 transform group-hover:-translate-y-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 15l7-7 7 7"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 11l7-7 7 7"
            />
          </svg>
        </button>
      )}
    </main>
  );
}
