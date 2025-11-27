"use client";

import Link from "next/link";

export default function BarRestaurantPage() {
  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div
        className="w-full h-96 bg-cover bg-center relative"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=1950&q=80')",
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-center items-center text-center px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Welcome to Our Bar & Restaurant
          </h1>
          <p className="text-white text-lg md:text-xl mb-6 max-w-xl">
            Experience exquisite cuisine, crafted cocktails, and an unforgettable ambience.
          </p>
          <Link
            href="/book"
            className="px-6 py-3 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition"
          >
            Reserve a Table
          </Link>
        </div>
      </div>

      {/* About & Ambience */}
      <section className="max-w-7xl mx-auto py-16 px-6">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <img
            src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1000&q=80"
            alt="Restaurant interior"
            className="w-full md:w-1/2 rounded-lg shadow-lg"
          />
          <div className="md:w-1/2">
            <h2 className="text-3xl font-semibold mb-4 text-gray-800">
              Elegant Ambience & World-Class Service
            </h2>
            <p className="text-gray-700 mb-4">
              Our bar & restaurant offers a sophisticated atmosphere for both casual dining and special occasions. Enjoy an array of local and international dishes, paired with the finest beverages.
            </p>
            <p className="text-gray-700">
              Whether you're looking for a relaxed dinner with friends, a romantic evening, or a venue for corporate events, we provide an unforgettable experience.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Menu */}
      <section className="bg-white py-16 px-6">
        <h2 className="text-3xl font-semibold text-center mb-12 text-gray-800">
          Featured Dishes & Drinks
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            {
              title: "Signature Cocktail",
              img: "https://images.unsplash.com/photo-1571143764903-5b50e6b49aa3?auto=format&fit=crop&w=800&q=80",
            },
            {
              title: "Gourmet Steak",
              img: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=800&q=80",
            },
            {
              title: "Exquisite Dessert",
              img: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=800&q=80",
            },
          ].map((item, idx) => (
            <div key={idx} className="rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition">
              <img src={item.img} alt={item.title} className="w-full h-64 object-cover" />
              <div className="p-4">
                <h3 className="text-xl font-medium text-gray-800">{item.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Events & Specials */}
      <section className="max-w-7xl mx-auto py-16 px-6">
        <h2 className="text-3xl font-semibold text-gray-800 mb-8 text-center">
          Events & Specials
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: "Live Music Fridays",
              description: "Enjoy live jazz and acoustic performances every Friday evening.",
            },
            {
              title: "Happy Hour",
              description: "Special discounts on drinks from 5 PM to 7 PM daily.",
            },
            {
              title: "Wine Tasting Nights",
              description: "Sample exquisite wines curated by our sommelier every Wednesday.",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-gray-50 p-6 rounded-lg shadow hover:shadow-lg transition"
            >
              <h3 className="text-xl font-medium text-gray-800 mb-2">{item.title}</h3>
              <p className="text-gray-700">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-orange-600 py-16 px-6 text-center text-white">
        <h2 className="text-3xl font-semibold mb-4">Reserve Your Table Today</h2>
        <p className="mb-6 max-w-xl mx-auto">
          Experience the perfect blend of luxury, taste, and ambience at our Bar & Restaurant.
        </p>
        <Link
          href="/book"
          className="px-8 py-3 bg-white text-orange-600 font-semibold rounded-md hover:bg-gray-100 transition"
        >
          Book Now
        </Link>
      </section>
    </div>
  );
}
