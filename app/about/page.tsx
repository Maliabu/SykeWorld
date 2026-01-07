"use client";

import { useState, useEffect } from "react";
import Container from "../Home/Container";
import { toast } from "sonner";
import { Review } from "../types/types";
import { getAllRooms, getRoomReviews } from "@/lib/actions/bookings";
import { createContactMessage } from "@/lib/actions/contact";

export default function AboutPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  useEffect(() => {
    async function fetchReviews() {
      try {
        // Get all rooms first
        const roomsResult = await getAllRooms();
        if (roomsResult.error || !roomsResult.rooms) {
          console.error(roomsResult.error);
          setLoadingReviews(false);
          return;
        }

        // Collect reviews from all rooms
        const allReviews: Review[] = [];
        for (const room of roomsResult.rooms.slice(0, 5)) { // Limit to first 5 rooms
          const reviewsResult = await getRoomReviews(room.id);
          if (reviewsResult.success && reviewsResult.reviews) {
            for (const review of reviewsResult.reviews) {
              allReviews.push({
                id: review.id,
                user: review.user?.firstName && review.user?.lastName
                  ? `${review.user.firstName} ${review.user.lastName}`
                  : review.user?.email || "Anonymous",
                message: review.comment || "",
                stars: review.stars || 5,
                avatar: review.user?.profilePicture && review.user.profilePicture !== "default.jpg" 
                  ? review.user.profilePicture 
                  : review.user?.email || undefined,
                created_at: review.created.toDateString()
              });
            }
          }
        }

        setReviews(allReviews);
      } catch (err) {
        console.error("Error fetching reviews", err);
      } finally {
        setLoadingReviews(false);
      }
    }

    fetchReviews();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await createContactMessage(form);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Message sent successfully!");
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong.");
    }
  };


  return (
    <div className="bg-[#fafafa] min-h-screen">

      {/* HERO */}
      <section className="py-24 md:py-32 bg-[#fafafa]">
        <Container>
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-12 bg-black/20"></div>
              <p className="text-xs uppercase tracking-widest text-black/60 font-medium" style={{ fontFamily: 'var(--font-inter)' }}>
                About Us
              </p>
              <div className="h-px w-12 bg-black/20"></div>
            </div>
            <h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#1a1c1e] mb-6 tracking-tight"
              style={{ fontFamily: 'var(--font-playfair)' }}
            >
              Welcome to Syke World
            </h1>
            <p 
              className="text-sm text-gray-600 max-w-3xl mx-auto leading-relaxed"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              A peaceful hideaway in the heart of Paidha — where hospitality,
              culture, and comfort meet to give you an unforgettable stay.
            </p>
          </div>
        </Container>
      </section>

      {/* HISTORY */}
      <section className="py-24 md:py-32 bg-[#fafafa]">
        <Container>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="h-px w-12 bg-black/20"></div>
                <p className="text-xs uppercase tracking-widest text-black/60 font-medium" style={{ fontFamily: 'var(--font-inter)' }}>
                  Our History
                </p>
                <div className="h-px w-12 bg-black/20"></div>
              </div>
              <h2 
                className="text-4xl md:text-5xl font-bold text-[#1a1c1e] mb-4"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                Our Story
              </h2>
            </div>

            <p 
              className="text-sm md:text-base text-gray-600 leading-relaxed max-w-4xl mx-auto text-center"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              Syke World began as a humble family-run guesthouse in the vibrant 
              town of Paidha. Over the years, it evolved into one of the area's 
              most beloved hospitality centers, celebrated for its comfort, 
              warmth, and unmatched service.
              What makes Syke World special is its connection to the community. 
              It has become a gathering place — for travelers, families, and 
              friends — where culture, food, and experience blend naturally.
            </p>
          </div>
        </Container>
      </section>

      {/* LOCATION + GOOGLE MAPS */}
      <section className="py-24 md:py-32 bg-[#fafafa]">
        <Container>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="h-px w-12 bg-black/20"></div>
                <p className="text-xs uppercase tracking-widest text-black/60 font-medium" style={{ fontFamily: 'var(--font-inter)' }}>
                  Location
                </p>
                <div className="h-px w-12 bg-black/20"></div>
              </div>
              <h2 
                className="text-4xl md:text-5xl font-bold text-[#1a1c1e] mb-4"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                Located in the Heart of Paidha
              </h2>
              <p 
                className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                Paidha is a warm and lively town in Zombo District, known for its 
                friendly people, rich Alur culture, and beautiful landscapes. 
                Syke World sits right within the town — easily accessible and close 
                to markets, transport routes, and cultural attractions.
              </p>
            </div>

            <div className="w-full h-96 rounded-lg overflow-hidden border border-black/10">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1004.9674424425868!2d30.986!3d2.417!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1762d8f79ca3cb0f%3A0xdf4d791d1b0e0!2sPaidha%2C%20Uganda!5e1!3m2!1sen!2sug!4v0000000000"
                width="100%"
                height="100%"
                loading="lazy"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </Container>
      </section>

      {/* REVIEWS + GET IN TOUCH — SIDE BY SIDE */}
      <section className="py-24 md:py-32 bg-[#fafafa]">
        <Container>
          <div className="flex flex-col md:flex-row gap-8 md:gap-16 justify-center items-start">
            
            {/* LEFT = CUSTOMER REVIEWS */}
            <div className="p-8 border-t border-b border-black/10 max-w-[400px]">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px w-12 bg-black/20"></div>
                  <p className="text-xs uppercase tracking-widest text-black/60 font-medium" style={{ fontFamily: 'var(--font-inter)' }}>
                    Testimonials
                  </p>
                  <div className="h-px w-12 bg-black/20"></div>
                </div>
                <h2 
                  className="text-2xl md:text-3xl font-bold text-[#1a1c1e] mb-4"
                  style={{ fontFamily: 'var(--font-playfair)' }}
                >
                  Client Reviews
                </h2>
              </div>

              {loadingReviews ? (
                <div className="p-4 text-gray-600" style={{ fontFamily: 'var(--font-inter)' }}>Loading reviews...</div>
              ) : reviews.length === 0 ? (
                <div className="p-4 text-gray-500" style={{ fontFamily: 'var(--font-inter)' }}>No reviews yet.</div>
              ) : (
                <div className="w-full max-h-96 overflow-y-auto rounded-lg">
                  <div className="flex flex-col space-y-4">
                    {reviews.map((review) => {
                      // Generate avatar URL with fallback
                      const getAvatarUrl = () => {
                        // If avatar is a URL or path, use it directly
                        if (review.avatar && (review.avatar.startsWith('http') || review.avatar.startsWith('/'))) {
                          return review.avatar;
                        }
                        // If avatar is an email, generate avatar from it (will use first letter)
                        if (review.avatar && review.avatar.includes('@')) {
                          const emailInitial = review.avatar[0].toUpperCase();
                          return `https://ui-avatars.com/api/?name=${encodeURIComponent(emailInitial)}&background=d97706&color=fff&size=128`;
                        }
                        // Fallback to generating from user name (first letter only)
                        const nameForAvatar = review.user || 'User';
                        const firstLetter = nameForAvatar[0].toUpperCase();
                        return `https://ui-avatars.com/api/?name=${encodeURIComponent(firstLetter)}&background=d97706&color=fff&size=128`;
                      };
                      
                      return (
                        <div key={review.id} className="bg-black/2 p-5 rounded-lg border border-black/10 hover:bg-black/5 transition">
                          <div className="flex items-center gap-3 mb-2">
                            <img
                              src={getAvatarUrl()}
                              alt={review.user}
                              className="w-10 h-10 rounded-full object-cover"
                              onError={(e) => {
                                // Final fallback to initials from name
                                const name = review.user || 'User';
                                const initial = name
                                  .split(' ')
                                  .map((n: string) => n[0])
                                  .join('')
                                  .toUpperCase()
                                  .slice(0, 1) || 'U';
                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initial)}&background=d97706&color=fff&size=128`;
                              }}
                            />
                            <div>
                              <p className="font-medium text-[#1a1c1e]" style={{ fontFamily: 'var(--font-inter)' }}>{review.user}</p>
                              <p className="text-amber-500 text-sm">
                                {"★".repeat(review.stars)}
                                <span className="text-gray-400">
                                  {"★".repeat(5 - review.stars)}
                                </span>
                              </p>
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm" style={{ fontFamily: 'var(--font-inter)' }}>{review.message}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            {/* RIGHT = CONTACT FORM */}
            <div className="p-8 border-t border-b border-black/10 max-w-[400px]">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px w-12 bg-black/20"></div>
                  <p className="text-xs uppercase tracking-widest text-black/60 font-medium" style={{ fontFamily: 'var(--font-inter)' }}>
                    Contact
                  </p>
                  <div className="h-px w-12 bg-black/20"></div>
                </div>
                <h2 
                  className="text-2xl md:text-3xl font-bold text-[#1a1c1e] mb-4"
                  style={{ fontFamily: 'var(--font-playfair)' }}
                >
                  Get in Touch
                </h2>
              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                <div>
                  <label 
                    className="block text-xs uppercase tracking-widest text-black/60 font-medium mb-2"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="w-full bg-transparent border-b border-gray-400/50 px-0 py-3 text-[#1a1c1e] placeholder-gray-500 focus:outline-none focus:border-b-amber-600 transition-all"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  />
                </div>

                <div>
                  <label 
                    className="block text-xs uppercase tracking-widest text-black/60 font-medium mb-2"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    required
                    className="w-full bg-transparent border-b border-gray-400/50 px-0 py-3 text-[#1a1c1e] placeholder-gray-500 focus:outline-none focus:border-b-amber-600 transition-all"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  />
                </div>

                <div>
                  <label 
                    className="block text-xs uppercase tracking-widest text-black/60 font-medium mb-2"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    Message
                  </label>
                  <textarea
                    value={form.message}
                    onChange={(e) =>
                      setForm({ ...form, message: e.target.value })
                    }
                    required
                    className="w-full bg-transparent border-b border-gray-400/50 px-0 py-3 text-[#1a1c1e] placeholder-gray-500 focus:outline-none focus:border-b-amber-600 transition-all resize-none h-32"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  ></textarea>
                </div>

                <button 
                  className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 font-medium tracking-wide uppercase transition w-full"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  Send Message
                </button>
              </form>
            </div>

          </div>
        </Container>
      </section>
    </div>
  );
}
