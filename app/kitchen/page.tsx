"use client";

import { useState, useEffect } from "react";
import Container from "../Home/Container";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";

/* ------------------------- TYPES ------------------------- */
interface Item {
  name: string;
  description: string;
  price: string;
  image: string;
}

interface CategoryMap {
  [category: string]: Item[];
}

/* ------------------------- MOCK DATA ------------------------- */
const bannerImages: string[] = ["/images/pexels-creative-vix-370984.jpg", "/images/bg-3.jpg", "/images/counter.png"];

const drinks: CategoryMap = {
  Cocktails: [
    { name: "Mojito", description: "Minty refreshing cocktail", price: "UGX 12", image: "/images/Mojito.jpeg" },
    { name: "Margarita", description: "Classic tequila delight", price: "UGX 14", image: "/images/juice.png" },
  ],
  Wine: [
    { name: "Wines", description: "White wine, crisp and fruity", price: "UGX 18", image: "/images/wine.jpeg" },
  ],
  Beers: [
    { name: "Lagers", description: "Crisp and light beer", price: "UGX 8", image: "/images/I Tasted Heineken's New Non-Alcoholic Beer and It Was Fine, I Guess.jpeg" },
  ],
  "Spirits & Whiskeys": [
    { name: "Uganda Waragi", description: "Hoppy and aromatic", price: "UGX 9", image: "/images/Uganda Waragi.jpeg" },
  ],
  "Soft Drinks": [
    { name: "sodas", description: "Classic soft drink", price: "UGX 3", image: "/images/coke.jpeg" },
    { name: "Orange Juice", description: "Freshly squeezed", price: "UGX 4", image: "/images/juice.png" },
  ],
};

const menu: CategoryMap = {
  "Breakfast": [
    { name: "Coffee", description: "Toasted bread with tomato and basil", price: "UGX 10", image: "/images/coffee.png" },
    { name: "Tea", description: "Served with garlic butter sauce", price: "UGX 14", image: "/images/tea.png" },
  ],
  "Brunch": [
    { name: "Pilau", description: "Served with seasonal vegetables", price: "UGX 25", image: "/images/pilao.png" },
    { name: "Katogo", description: "Juicy ribeye with sides", price: "UGX 30", image: "/images/katogo.jpeg" },
    { name: "Gnuts", description: "From our gardens to you", price: "UGX 30", image: "/images/Gnuts.png" },
  ],
  "Desserts": [
    { name: "cup cakes", description: "Rich and moist", price: "UGX 8", image: "/images/pastry.png" },
  ],
};

/* ------------------------- CAROUSEL ------------------------- */
interface CarouselProps {
  images: string[];
}

function Carousel({ images }: CarouselProps) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="relative w-full h-64 md:h-96 overflow-hidden rounded-xl ">
      {images.map((img, idx) => (
        <img
          key={idx}
          src={img}
          alt="Banner"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            idx === current ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
        <h1 className="text-white text-4xl md:text-6xl hidden">Bar & Restaurant</h1>
      </div>
      <button
        onClick={() => setCurrent((p) => (p - 1 + images.length) % images.length)}
        className="absolute top-1/2 left-4 -translate-y-1/2 bg-white p-2 rounded-full "
      >
        <FaArrowLeft />
      </button>
      <button
        onClick={() => setCurrent((p) => (p + 1) % images.length)}
        className="absolute top-1/2 right-4 -translate-y-1/2 bg-white p-2 rounded-full "
      >
        <FaArrowRight />
      </button>
    </div>
  );
}

/* ------------------------- PAGE ------------------------- */
export default function BarRestaurantPage() {
  const [drinkTab, setDrinkTab] = useState<string>(Object.keys(drinks)[0]);
  const [menuTab, setMenuTab] = useState<string>(Object.keys(menu)[0]);

  return (
    <div className="py-20 bg-gray-100 min-h-screen">
      <Container>
        {/* Banner */}
        <Carousel images={bannerImages} />

        {/* Drinks Section */}
        <section className="mt-16">
          <h2 className="text-3xl  mb-4">Our Drinks</h2>
          <div className="flex gap-4 mb-6 flex-wrap">
            {Object.keys(drinks).map((tab) => (
              <button
                key={tab}
                onClick={() => setDrinkTab(tab)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  drinkTab === tab ? "bg-orange-600 text-white" : "bg-gray-200 text-gray-800"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {drinks[drinkTab].map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl  overflow-hidden hover:scale-105 transition-all"
              >
                <img src={item.image} alt={item.name} className="w-full h-64 object-contain" />
                <div className="p-4">
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  <p className="text-gray-600 mt-1">{item.description}</p>
                  <div className="text-orange-600 font-medium mt-2">{item.price}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Menu Section */}
        <section className="mt-16">
          <h2 className="text-3xl  mb-4">Our Menu</h2>
          <div className="flex gap-4 mb-6 flex-wrap">
            {Object.keys(menu).map((tab) => (
              <button
                key={tab}
                onClick={() => setMenuTab(tab)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  menuTab === tab ? "bg-orange-600 text-white" : "bg-gray-200 text-gray-800"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {menu[menuTab].map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl  overflow-hidden hover:scale-105 transition-all"
              >
                <img src={item.image} alt={item.name} className="w-full h-40 object-cover" />
                <div className="p-4">
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  <p className="text-gray-600 mt-1">{item.description}</p>
                  <div className="text-orange-600 font-medium mt-2">{item.price}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </Container>
    </div>
  );
}
