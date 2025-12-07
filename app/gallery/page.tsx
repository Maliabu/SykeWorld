"use client";

import { useState, useEffect } from "react";
import Container from "../Home/Container";

interface GalleryCategory {
  id: number;
  name: string;
  images: string[];
}

export default function GalleryPage() {
  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL


  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/gallery/`);
        if (!res.ok) throw new Error("Failed to fetch gallery");
        const data: GalleryCategory[] = await res.json();
        setCategories(data);
        if (data.length > 0) setActiveCategory(data[0].name);
      } catch (err) {
        console.error(err);
      }
    };
    fetchGallery();
  }, []);

  const activeImages =
    categories.find((c) => c.name === activeCategory)?.images ?? [];

  // Assign variable row spans (like puzzle blocks)
  const rowSpans = ["row-span-2", "row-span-3", "row-span-1", "row-span-2"];

  return (
    <div className="py-20 bg-gray-100 min-h-screen">
      <Container>
        <h1 className="text-3xl mb-8">Hotel Gallery</h1>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Left sidebar categories */}
          <div className="md:w-1/4 flex flex-col gap-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.name)}
                className={`text-left px-4 py-2 rounded-lg font-medium transition ${
                  activeCategory === cat.name
                    ? "bg-orange-600 text-white"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Right masonry/puzzle grid */}
          <div className="md:w-3/4">
            {activeImages.length > 0 ? (
              <div className="grid grid-cols-3 grid-rows-auto gap-4 auto-rows-[150px] grid-flow-dense">
                {activeImages.map((img, idx) => (
                  <div
                    key={idx}
                    className={`overflow-hidden rounded-xl transform hover:scale-105 transition-all duration-300 shadow ${
                      rowSpans[idx % rowSpans.length]
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${activeCategory}-${idx}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">No images in this category.</div>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
