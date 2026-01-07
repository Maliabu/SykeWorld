"use client";

import { useState, useEffect } from "react";
import Container from "../Home/Container";
import { getAllGalleryCategories, getGalleryImages } from "@/lib/actions/bookings";

interface GalleryCategory {
  id: string;
  name: string;
  images: string[];
}

export default function GalleryPage() {
  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState<string>("");

  useEffect(() => {
    async function loadGallery() {
      try {
        const categoriesResult = await getAllGalleryCategories();
        if (categoriesResult.success && categoriesResult.categories) {
          const categoriesWithImages = await Promise.all(
            categoriesResult.categories.map(async (cat: any) => {
              const imagesResult = await getGalleryImages(cat.id);
              return {
                id: cat.id,
                name: cat.name,
                images: imagesResult.success && imagesResult.images
                  ? imagesResult.images.map((img: any) => img.image)
                  : [],
              };
            })
          );
          setCategories(categoriesWithImages);
          if (categoriesWithImages.length > 0) {
            setActiveCategory(categoriesWithImages[0].name);
          }
        } else {
          setError(categoriesResult.error || "Failed to load gallery");
        }
      } catch (err) {
        console.error("Gallery load error:", err);
        setError("Failed to load gallery");
      } finally {
        setLoading(false);
      }
    }
    loadGallery();
  }, []);

  const activeImages = categories.find((c) => c.name === activeCategory)?.images || [];

  const rowSpans = ["row-span-2", "row-span-3", "row-span-1", "row-span-2"];

  if (loading) return <div className="p-10 text-center text-[#1a1c1e] bg-[#fafafa] min-h-screen flex items-center justify-center" style={{ fontFamily: 'var(--font-inter)' }}>Loading gallery...</div>;
  if (error) return <div className="p-10 text-center text-red-600 bg-[#fafafa] min-h-screen flex items-center justify-center" style={{ fontFamily: 'var(--font-inter)' }}>Failed to load gallery.</div>;

  return (
    <div className="py-24 md:py-32 bg-[#fafafa] min-h-screen">
      <Container>
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-12 bg-black/20"></div>
            <p className="text-xs uppercase tracking-widest text-black/60 font-medium" style={{ fontFamily: 'var(--font-inter)' }}>
              Explore
            </p>
            <div className="h-px w-12 bg-black/20"></div>
          </div>
          <h1 
            className="text-4xl md:text-5xl font-bold text-[#1a1c1e] mb-4"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Gallery
          </h1>
          <p 
            className="text-sm text-gray-600 max-w-3xl mx-auto leading-relaxed"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            Explore our beautiful spaces and amenities
          </p>
        </div>

        <div className="flex flex-col gap-8">
          {/* Categories Tabs - Horizontal Scrollable Row */}
          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <div className="flex gap-2 min-w-max md:flex-wrap md:min-w-0">
              {categories.map((cat, idx) => (
                <button
                  key={cat.id ?? `cat-${idx}`}
                  onClick={() => setActiveCategory(cat.name)}
                  className={`whitespace-nowrap px-6 py-3 font-medium transition-all rounded-lg ${
                    activeCategory === cat.name
                      ? "bg-amber-600 text-white"
                      : "text-[#1a1c1e] border border-black/10 hover:bg-black/5 hover:border-black/20"
                  }`}
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Images Grid - Full Width */}
          <div className="w-full">
            {activeImages.length > 0 ? (
              <div className="grid grid-cols-3 grid-rows-auto gap-4 auto-rows-[150px] grid-flow-dense">
                {activeImages
                  .filter((img) => img && img.trim() !== "")
                  .filter((img) => {
                    const isValidUrl = img && (
                      img.startsWith("http://") ||
                      img.startsWith("https://") ||
                      img.startsWith("/")
                    );
                    return isValidUrl;
                  })
                  .map((img, idx) => (
                    <div
                      key={idx}
                      className={`overflow-hidden rounded-lg border border-black/10 transform hover:scale-105 transition-all duration-500 hover:border-black/20 cursor-pointer group ${
                        rowSpans[idx % rowSpans.length]
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${activeCategory}-${idx}`}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => {
                          // Prevent infinite loop - use data URI placeholder
                          if (!e.currentTarget.src.includes('data:image')) {
                            e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23333' width='400' height='300'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='18' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";
                          }
                        }}
                      />
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500" style={{ fontFamily: 'var(--font-inter)' }}>No images in this category.</div>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
