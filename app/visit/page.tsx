"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";

export default function VisitPaidha() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const visitImages = [
    "/images/weather.jpg",
    "/images/music.jpg",
    "/images/craft.jpg",
    "/images/pba.jpg"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % visitImages.length);
    }, 3000); // Change image every 3 seconds

    return () => clearInterval(interval);
  }, [visitImages.length]);

  return (
    <main className="w-full min-h-screen bg-[#fafafa] text-[#1a1c1e]">
      {/* HERO SECTION */}
      <section className="relative w-full h-[60vh] md:h-[75vh] overflow-visible">
        <img
          src="/images/town.jpg"
          alt="Paidha town view Uganda"
          className="w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-black/50 flex flex-col items-end justify-center text-right px-6 md:px-12 lg:px-24">
          <div className="max-w-3xl">
            <h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white drop-shadow-lg"
              style={{ fontFamily: 'var(--font-cal-sans)', fontWeight: 400 }}
            >
              Discover Paidha
            </h1>
            <p 
              className="text-sm md:text-base text-white/90 mt-4 leading-relaxed"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              The Hidden Gem of West Nile – where nature, culture, and adventure meet.
            </p>
          </div>
        </div>

        {/* Welcome Card Overlay - Provides background for fixed cards, extends above and below hero */}
        <div className="absolute -top-20 -bottom-20 left-0 w-full px-4 md:px-8 lg:px-16 flex items-stretch">
          <div className="bg-[#fafafa] w-full max-w-[600px] border-l border-r border-black/10 flex flex-col justify-center p-8">
            <div className="text-center space-y-6">
              {/* Carousel Image */}
              <div className="relative w-full h-32 rounded overflow-hidden">
                {visitImages.map((img, index) => (
                  <Image
                    key={index}
                    src={img}
                    alt="Paidha"
                    fill
                    className={`absolute inset-0 object-cover transition-opacity duration-1000 ${
                      index === currentImageIndex ? "opacity-100" : "opacity-0"
                    }`}
                  />
                ))}
              </div>

              {/* Welcome Section */}
              <div>
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="h-px w-12 bg-black/20"></div>
                  <p className="text-xs uppercase tracking-widest text-black/60 font-medium" style={{ fontFamily: 'var(--font-inter)' }}>
                    Welcome
                  </p>
                  <div className="h-px w-12 bg-black/20"></div>
                </div>
                <h2 
                  className="text-3xl md:text-4xl font-bold text-[#1a1c1e] mb-4"
                  style={{ fontFamily: 'var(--font-cal-sans)', fontWeight: 400 }}
                >
                  Greetings from West Nile
                </h2>
                <p 
                  className="text-sm text-gray-600 leading-relaxed"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  Experience the hidden gem of West Nile
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INTRO */}
      <section className="py-24 md:py-32 bg-[#fafafa]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-12 bg-black/20"></div>
              <p className="text-xs uppercase tracking-widest text-black/60 font-medium" style={{ fontFamily: 'var(--font-inter)' }}>
                Introduction
              </p>
              <div className="h-px w-12 bg-black/20"></div>
            </div>
            <h2 
              className="text-4xl md:text-5xl font-bold text-[#1a1c1e] mb-4"
              style={{ fontFamily: 'var(--font-cal-sans)', fontWeight: 400 }}
            >
              Welcome to Paidha
            </h2>
          </div>
          <p 
            className="text-sm text-gray-600 leading-relaxed max-w-3xl mx-auto text-center"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            Paidha is a vibrant border town in the Zombo District of West Nile,
            Northern Uganda. Surrounded by hills, rivers, and rich cultural
            heritage, it offers unforgettable scenery, warm community life, lively
            music, and deep Alur traditions.
          </p>
        </div>
      </section>

      {/* SECTIONS */}
      <CategorySection
        title="Scenery & Nature"
        description="From the hills of Zombo to the rivers of Paidha, nature around Paidha is dramatic and peaceful."
        images={[
          "images/v1.jpg",
        ]}
      />

      <CategorySection
        title="Culture & Community"
        description="Explore markets, crafts, and the deep Alur heritage alive in Paidha."
        images={[
          "/images/craft.jpg",
        ]}
      />

      <CategorySection
        title="Adventure & Exploration"
        description="Hike hills, explore valleys, and walk scenic riverside paths."
        images={[
          "/images/lei.jpg",
          "/images/lyec.png",
        ]}
      />

      <CategorySection
        title="Music & Entertainment"
        description="Immerse yourself in Alur rhythms, local beats, and vibrant community nightlife."
        images={[
          "/images/music.jpg",
        ]}
      />

      <CategorySection
        title="Food & Culinary Delights"
        description="Taste West Nile specialties like malakwang, acholi chicken stew, and fresh market foods."
        images={[
          "/images/mkt.jpg",
        ]}
      />

      <CategorySection
        title="Sights & Sounds"
        description="From market chatter to birdsong, Paidha has a relaxing and vibrant soundtrack."
        images={[
          "/images/lei.jpg",
          "images/v1.jpg",
          "/images/lyec.png",
        ]}
      />

      {/* ITINERARY */}
      <section className="py-24 md:py-32 bg-[#fafafa]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-12 bg-black/20"></div>
              <p className="text-xs uppercase tracking-widest text-black/60 font-medium" style={{ fontFamily: 'var(--font-inter)' }}>
                Plan Your Visit
              </p>
              <div className="h-px w-12 bg-black/20"></div>
            </div>
            <h2 
              className="text-4xl md:text-5xl font-bold text-[#1a1c1e] mb-4"
              style={{ fontFamily: 'var(--font-cal-sans)', fontWeight: 400 }}
            >
              Suggested 2-Day Itinerary
            </h2>
          </div>
          <div className="space-y-10 max-w-3xl mx-auto">
            {/* Day 1 */}
            <div className="bg-black/2 border border-black/10 rounded-lg p-8">
              <h3 
                className="text-2xl md:text-3xl font-bold text-[#1a1c1e] mb-4"
                style={{ fontFamily: 'var(--font-cal-sans)', fontWeight: 400 }}
              >
                Day 1
              </h3>
              <ul className="mt-4 space-y-3 list-disc ml-6 text-gray-600" style={{ fontFamily: 'var(--font-inter)' }}>
                <li>Sunrise trek in the hills surrounding Paidha</li>
                <li>Visit Paidha Market for crafts and foods</li>
                <li>Walk the Nyagak River area</li>
                <li>Enjoy Alur music and dance in the evening</li>
              </ul>
            </div>

            {/* Day 2 */}
            <div className="bg-black/2 border border-black/10 rounded-lg p-8">
              <h3 
                className="text-2xl md:text-3xl font-bold text-[#1a1c1e] mb-4"
                style={{ fontFamily: 'var(--font-cal-sans)', fontWeight: 400 }}
              >
                Day 2
              </h3>
              <ul className="mt-4 space-y-3 list-disc ml-6 text-gray-600" style={{ fontFamily: 'var(--font-inter)' }}>
                <li>Explore rock formations & scenic viewpoints</li>
                <li>Visit St. Joseph's Cathedral or local cultural sites</li>
                <li>View the Nyagak Hydroelectric Power Station from hilltops</li>
                <li>Have a home-cooked local meal</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* WHY VISIT */}
      <section className="py-24 md:py-32 bg-[#fafafa]">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-12 bg-white/50"></div>
            <p className="text-xs uppercase tracking-widest text-black/60 font-medium" style={{ fontFamily: 'var(--font-inter)' }}>
              Experience
            </p>
            <div className="h-px w-12 bg-white/50"></div>
          </div>
          <h2 
            className="text-4xl md:text-5xl font-bold text-[#1a1c1e] mb-4"
            style={{ fontFamily: 'var(--font-cal-sans)', fontWeight: 400 }}
          >
            Why Visit Paidha?
          </h2>
          <p 
            className="text-sm md:text-base text-gray-600 leading-relaxed max-w-3xl mx-auto"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            Paidha offers authentic culture, beautiful landscapes, and warm
            community hospitality. It is one of Uganda's beautiful and
            under-explored destinations—perfect for travelers seeking something real.
          </p>
        </div>
      </section>
    </main>
  );
}

/* ----------------------------------------------
   CATEGORY SECTION (using <img>)
---------------------------------------------- */

type CategorySectionProps = {
  title: string;
  description: string;
  images: string[];
};

function CategorySection({ title, description, images }: CategorySectionProps) {
  return (
    <section className="py-24 md:py-32 bg-[#fafafa]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-12">
          <h2 
            className="text-4xl md:text-5xl font-bold text-[#1a1c1e] mb-4"
            style={{ fontFamily: 'var(--font-cal-sans)', fontWeight: 400 }}
          >
            {title}
          </h2>
          <p 
            className="text-sm md:text-base text-gray-600 mb-8 max-w-3xl leading-relaxed"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            {description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {images.map((url, i) => (
            <div
              key={i}
              className="w-full h-64 md:h-56 rounded-lg overflow-hidden border border-black/10 hover:border-black/20 transition-all group"
            >
              <img
                src={url}
                alt={`${title} image ${i + 1}`}
                className="w-full h-full object-cover rounded-lg transition-transform duration-700 group-hover:scale-110"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
