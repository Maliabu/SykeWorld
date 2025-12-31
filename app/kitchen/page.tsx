"use client";

import { useState, useEffect } from "react";
import Container from "../Home/Container";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { getAllMenuItems, getAllMenuCategories, getAllDrinks, getAllDrinkCategories } from "@/lib/actions/pos";

/* ------------------------- TYPES ------------------------- */
interface Item {
  id: string;
  name: string;
  description: string | null;
  price: string;
  image: string | null;
  localName?: string | null;
}

interface CategoryMap {
  [category: string]: Item[];
}

/* ------------------------- BANNER IMAGES ------------------------- */
const bannerImages: string[] = ["/images/pexels-creative-vix-370984.jpg", "/images/bg-3.jpg", "/images/counter.png"];

/* ------------------------- PLACEHOLDER IMAGE ------------------------- */
const placeholderSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23e5e7eb' width='400' height='300'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='18' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";

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
    <div className="relative w-full h-64 md:h-96 overflow-hidden rounded-lg border border-black/10">
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
        className="absolute opacity-0 group-hover:opacity-100 transition-all top-1/2 left-4 -translate-y-1/2 bg-white/90 backdrop-blur-sm text-[#1a1c1e] p-2 rounded-full hover:bg-white"
      >
        <FaArrowLeft />
      </button>
      <button
        onClick={() => setCurrent((p) => (p + 1) % images.length)}
        className="absolute opacity-0 group-hover:opacity-100 transition-all top-1/2 right-4 -translate-y-1/2 bg-black/50 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/70"
      >
        <FaArrowRight />
      </button>
    </div>
  );
}

/* ------------------------- PAGE ------------------------- */
export default function BarRestaurantPage() {
  const [drinks, setDrinks] = useState<CategoryMap>({});
  const [menu, setMenu] = useState<CategoryMap>({});
  const [drinkCategories, setDrinkCategories] = useState<string[]>([]);
  const [menuCategories, setMenuCategories] = useState<string[]>([]);
  const [drinkTab, setDrinkTab] = useState<string>("");
  const [menuTab, setMenuTab] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [drinksResult, drinkCategoriesResult, menuItemsResult, menuCategoriesResult] = await Promise.all([
        getAllDrinks(),
        getAllDrinkCategories(),
        getAllMenuItems(),
        getAllMenuCategories(),
      ]);

      // Process drinks
      if (drinksResult.success && drinksResult.items) {
        const drinksMap: CategoryMap = {};
        drinksResult.items.forEach((drink: any) => {
          if (drink.isAvailable && drink.category?.name) {
            const categoryName = drink.category.name;
            if (!drinksMap[categoryName]) {
              drinksMap[categoryName] = [];
            }
            drinksMap[categoryName].push({
              id: drink.id,
              name: drink.name,
              description: drink.description,
              price: `UGX ${parseFloat(drink.price || "0").toLocaleString()}`,
              image: drink.image || placeholderSvg,
              localName: drink.localName,
            });
          }
        });
        setDrinks(drinksMap);
        const drinkCatNames = Object.keys(drinksMap);
        setDrinkCategories(drinkCatNames);
        if (drinkCatNames.length > 0 && !drinkTab) {
          setDrinkTab(drinkCatNames[0]);
        }
      }

      // Process menu items
      if (menuItemsResult.success && menuItemsResult.items) {
        const menuMap: CategoryMap = {};
        menuItemsResult.items.forEach((item: any) => {
          if (item.isAvailable && item.category?.name) {
            const categoryName = item.category.name;
            if (!menuMap[categoryName]) {
              menuMap[categoryName] = [];
            }
            menuMap[categoryName].push({
              id: item.id,
              name: item.name,
              description: item.description,
              price: `UGX ${parseFloat(item.price || "0").toLocaleString()}`,
              image: item.image || placeholderSvg,
              localName: item.localName,
            });
          }
        });
        setMenu(menuMap);
        const menuCatNames = Object.keys(menuMap);
        setMenuCategories(menuCatNames);
        if (menuCatNames.length > 0 && !menuTab) {
          setMenuTab(menuCatNames[0]);
        }
      }
    } catch (error) {
      console.error("Failed to load menu data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 bg-[#fafafa] min-h-screen">
        <Container>
          <div className="text-center py-12 text-[#1a1c1e]" style={{ fontFamily: 'var(--font-inter)' }}>Loading menu...</div>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-24 md:py-32 bg-[#fafafa] min-h-screen">
      <Container>
        {/* Banner */}
        <div className="group mb-16">
          <Carousel images={bannerImages} />
        </div>

        {/* Drinks Section */}
        {drinkCategories.length > 0 && (
          <section className="mt-16">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="h-px w-12 bg-black/20"></div>
                <p className="text-xs uppercase tracking-widest text-black/60 font-medium" style={{ fontFamily: 'var(--font-inter)' }}>
                  Beverages
                </p>
                <div className="h-px w-12 bg-white/50"></div>
              </div>
              <h2 
                className="text-4xl md:text-5xl font-bold text-[#1a1c1e] mb-4"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                Our Drinks
              </h2>
            </div>
            <div className="flex gap-0 mb-6 flex-wrap justify-center">
              {drinkCategories.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setDrinkTab(tab)}
                  className={`px-4 py-2 font-medium transition-all ${
                    drinkTab === tab ? "bg-amber-600 text-white" : "text-[#1a1c1e] border-t border-b border-black/10 hover:bg-black/5 hover:border-black/20"
                  }`}
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  {tab}
                </button>
              ))}
            </div>
            {drinkTab && drinks[drinkTab] && drinks[drinkTab].length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {drinks[drinkTab].map((item) => (
                  <div
                    key={item.id}
                    className="bg-black/2 border border-black/10 rounded-lg overflow-hidden hover:scale-105 hover:border-black/20 transition-all"
                  >
                    <img 
                      src={item.image || placeholderSvg} 
                      alt={item.name} 
                      className="w-full h-64 object-contain"
                      onError={(e) => {
                        if (!e.currentTarget.src.includes('data:image')) {
                          e.currentTarget.src = placeholderSvg;
                        }
                      }}
                    />
                    <div className="p-4">
                      <h3 
                        className="font-semibold text-lg text-[#1a1c1e]"
                        style={{ fontFamily: 'var(--font-playfair)' }}
                      >
                        {item.name}
                      </h3>
                      {item.localName && (
                        <p className="text-sm text-gray-500 italic" style={{ fontFamily: 'var(--font-inter)' }}>{item.localName}</p>
                      )}
                      {item.description && (
                        <p className="text-gray-600 mt-1 text-sm" style={{ fontFamily: 'var(--font-inter)' }}>{item.description}</p>
                      )}
                      <div className="text-amber-600 font-medium mt-2" style={{ fontFamily: 'var(--font-inter)' }}>{item.price}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500" style={{ fontFamily: 'var(--font-inter)' }}>No drinks available in this category</div>
            )}
          </section>
        )}

        {/* Menu Section */}
        {menuCategories.length > 0 && (
          <section className="mt-16">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="h-px w-12 bg-black/20"></div>
                <p className="text-xs uppercase tracking-widest text-black/60 font-medium" style={{ fontFamily: 'var(--font-inter)' }}>
                  Cuisine
                </p>
                <div className="h-px w-12 bg-white/50"></div>
              </div>
              <h2 
                className="text-4xl md:text-5xl font-bold text-[#1a1c1e] mb-4"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                Our Menu
              </h2>
            </div>
            <div className="flex gap-0 mb-6 flex-wrap justify-center">
              {menuCategories.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setMenuTab(tab)}
                  className={`px-4 py-2 font-medium transition-all ${
                    menuTab === tab ? "bg-amber-600 text-white" : "text-[#1a1c1e] border-t border-b border-black/10 hover:bg-black/5 hover:border-black/20"
                  }`}
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  {tab}
                </button>
              ))}
            </div>
            {menuTab && menu[menuTab] && menu[menuTab].length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {menu[menuTab].map((item) => (
                  <div
                    key={item.id}
                    className="bg-black/2 border border-black/10 rounded-lg overflow-hidden hover:scale-105 hover:border-black/20 transition-all"
                  >
                    <img 
                      src={item.image || placeholderSvg} 
                      alt={item.name} 
                      className="w-full h-40 object-cover"
                      onError={(e) => {
                        if (!e.currentTarget.src.includes('data:image')) {
                          e.currentTarget.src = placeholderSvg;
                        }
                      }}
                    />
                    <div className="p-4">
                      <h3 
                        className="font-semibold text-lg text-[#1a1c1e]"
                        style={{ fontFamily: 'var(--font-playfair)' }}
                      >
                        {item.name}
                      </h3>
                      {item.localName && (
                        <p className="text-sm text-gray-500 italic" style={{ fontFamily: 'var(--font-inter)' }}>{item.localName}</p>
                      )}
                      {item.description && (
                        <p className="text-gray-600 mt-1 text-sm" style={{ fontFamily: 'var(--font-inter)' }}>{item.description}</p>
                      )}
                      <div className="text-amber-600 font-medium mt-2" style={{ fontFamily: 'var(--font-inter)' }}>{item.price}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500" style={{ fontFamily: 'var(--font-inter)' }}>No menu items available in this category</div>
            )}
          </section>
        )}
      </Container>
    </div>
  );
}
