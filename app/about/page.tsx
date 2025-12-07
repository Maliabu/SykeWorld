"use client";

import { useState, useEffect } from "react";
import Container from "../Home/Container";
import { toast } from "sonner";
import { Review } from "../types/types";

export default function AboutPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
   const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL


  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch(`${BACKEND_URL}/api/rooms/reviews/`);
        if (!res.ok) throw new Error("Failed to fetch reviews");
        const data = await res.json();

        const formatted = data.map((r: any) => ({
          id: r.id,
          user: r.user.username || r.user.email,
          message: r.comment,
          stars: r.stars,
          avatar: r.user.avatar || undefined,
        }));

        setReviews(formatted);
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
    const res = await fetch(`${BACKEND_URL}/api/contact/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || "Failed to send message.");
      return;
    }

    toast.success(data.success);
    setForm({ name: "", email: "", message: "" });

  } catch (err) {
    console.error(err);
    toast.error("Something went wrong.");
  }
};


  return (
    <div className="pt-28 bg-gray-50 min-h-screen">

      {/* HERO */}
      <section className="bg-orange-600 text-white py-20">
        <Container>
          <h1 className="text-2xl font-bold">Welcome to Syke World</h1>
          <p className="mt-4 max-w-3xl text-md opacity-90">
            A peaceful hideaway in the heart of Paidha — where hospitality,
            culture, and comfort meet to give you an unforgettable stay.
          </p>
        </Container>
      </section>

      {/* HISTORY */}
      <section className="py-20">
        <Container>
          <h2 className="text-2xl font-semibold mb-4">Our Story</h2>

          <p className="text-gray-700 leading-relaxed max-w-4xl">
            Syke World began as a humble family-run guesthouse in the vibrant 
            town of Paidha. Over the years, it evolved into one of the area’s 
            most beloved hospitality centers, celebrated for its comfort, 
            warmth, and unmatched service.
            What makes Syke World special is its connection to the community. 
            It has become a gathering place — for travelers, families, and 
            friends — where culture, food, and experience blend naturally.
          </p>
        </Container>
      </section>

      {/* LOCATION + GOOGLE MAPS */}
      <section className="py-20 bg-white">
        <Container>
          <h2 className="text-2xl font-extralight mb-6">
            Located in the Heart of Paidha
          </h2>

          <p className="text-gray-700 max-w-4xl mb-8">
            Paidha is a warm and lively town in Zombo District, known for its 
            friendly people, rich Alur culture, and beautiful landscapes. 
            Syke World sits right within the town — easily accessible and close 
            to markets, transport routes, and cultural attractions.
          </p>

          <div className="w-full h-96 rounded-xl overflow-hidden shadow-lg">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1004.9674424425868!2d30.986!3d2.417!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1762d8f79ca3cb0f%3A0xdf4d791d1b0e0!2sPaidha%2C%20Uganda!5e1!3m2!1sen!2sug!4v0000000000"
              width="100%"
              height="100%"
              loading="lazy"
              allowFullScreen
            ></iframe>
          </div>
        </Container>
      </section>

      {/* REVIEWS + GET IN TOUCH — SIDE BY SIDE */}
      <section className="py-20 bg-gray-100">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* LEFT = CUSTOMER REVIEWS */}
            <div>
              <h2 className="text-2xl font-semibold mb-6">Client Reviews</h2>

              {loadingReviews ? (
                <div className="p-4">Loading reviews...</div>
              ) : reviews.length === 0 ? (
                <div className="p-4 text-gray-600">No reviews yet.</div>
              ) : (
                <div className="w-full max-h-96 overflow-y-auto rounded-lg">
                  <div className="flex flex-col space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                          {review.avatar && (
                            <img
                              src={review.avatar}
                              alt={review.user}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          )}
                          <div>
                            <p className="font-medium text-gray-800">{review.user}</p>
                            <p className="text-yellow-500 text-sm">
                              {"★".repeat(review.stars)}
                              <span className="text-gray-400">
                                {"★".repeat(5 - review.stars)}
                              </span>
                            </p>
                          </div>
                        </div>
                        <p className="text-gray-700 text-sm">{review.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* RIGHT = CONTACT FORM */}
            <div>
              <h2 className="text-2xl font-semibold mb-6">Get in Touch</h2>

              <form
                onSubmit={handleSubmit}
                className="bg-white p-8 rounded-xl space-y-5"
              >
                <div>
                  <label className="block font-medium mb-1">Your Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="w-full p-3 rounded-md bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    required
                    className="w-full p-3 rounded-md bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1">Message</label>
                  <textarea
                    value={form.message}
                    onChange={(e) =>
                      setForm({ ...form, message: e.target.value })
                    }
                    required
                    className="w-full p-3 rounded-md bg-gray-50 h-32"
                  ></textarea>
                </div>

                <button className="bg-orange-600 text-white px-6 py-3 rounded-lg shadow hover:bg-orange-700 transition w-full">
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
