"use client";
import React from "react";

export default function VisitPaidha() {
  return (
    <main className="w-full min-h-screen bg-white text-gray-900">
      {/* HERO SECTION */}
      <section className="relative w-full h-[60vh] md:h-[75vh] overflow-hidden">
        <img
          src="/images/town.jpg"
          alt="Paidha town view Uganda"
          className="w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center px-6">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white drop-shadow-lg">
            Discover Paidha
          </h1>
          <p className="text-md md:text-2xl text-gray-200 mt-4 max-w-3xl">
            The Hidden Gem of West Nile – where nature, culture, and adventure meet.
          </p>
        </div>
      </section>

      {/* INTRO */}
      <section className="py-16 max-w-5xl mx-auto px-6">
        <h2 className="text-3xl  mb-4">Welcome to Paidha</h2>
        <p className="text-sm leading-relaxed text-gray-700">
          Paidha is a vibrant border town in the Zombo District of West Nile,
          Northern Uganda. Surrounded by hills, rivers, and rich cultural
          heritage, it offers unforgettable scenery, warm community life, lively
          music, and deep Alur traditions.
        </p>
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
      <section className="py-16 max-w-5xl mx-auto px-6">
        <h2 className="text-3xl  mb-6">Suggested 2-Day Itinerary</h2>
        <div className="space-y-10">
          {/* Day 1 */}
          <div>
            <h3 className="text-2xl font-semibold">Day 1</h3>
            <ul className="mt-4 space-y-2 list-disc ml-6 text-gray-700">
              <li>Sunrise trek in the hills surrounding Paidha</li>
              <li>Visit Paidha Market for crafts and foods</li>
              <li>Walk the Nyagak River area</li>
              <li>Enjoy Alur music and dance in the evening</li>
            </ul>
          </div>

          {/* Day 2 */}
          <div>
            <h3 className="text-2xl font-semibold">Day 2</h3>
            <ul className="mt-4 space-y-2 list-disc ml-6 text-gray-700">
              <li>Explore rock formations & scenic viewpoints</li>
              <li>Visit St. Joseph’s Cathedral or local cultural sites</li>
              <li>View the Nyagak Hydroelectric Power Station from hilltops</li>
              <li>Have a home-cooked local meal</li>
            </ul>
          </div>
        </div>
      </section>

      {/* WHY VISIT */}
      <section className="py-16 bg-gray-100">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-2xl  mb-4">Why Visit Paidha?</h2>
          <p className="text-md text-gray-700 leading-relaxed max-w-3xl mx-auto">
            Paidha offers authentic culture, beautiful landscapes, and warm
            community hospitality. It is one of Uganda’s beautiful and
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
    <section className="pt-16 max-w-6xl mx-auto px-6">
      <h2 className="text-2xl  mb-4">{title}</h2>
      <p className="text-md text-gray-700 mb-8 max-w-3xl">{description}</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {images.map((url, i) => (
          <div
            key={i}
            className="w-full h-64 md:h-56 rounded-lg overflow-hidden shadow-md"
          >
            <img
              src={url}
              alt={`${title} image ${i + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
