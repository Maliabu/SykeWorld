"use client";

import React, { useEffect, useState } from "react";

interface Review {
  id: number;
  user: string;
  message: string;
  stars: number;
  avatar?: string;
}

export default function ReviewsColumn() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch(`${BACKEND_URL}/api/rooms/reviews/`); // adjust your endpoint
        if (!res.ok) throw new Error("Failed to fetch reviews");
        const data = await res.json();

        // format data if needed
        const formatted = data.map((r: any) => ({
          id: r.id,
          user: r.user.username || r.user.email, // assuming user object
          message: r.comment,
          stars: r.stars,
          avatar: r.user.avatar || undefined, // if you store avatars
        }));

        setReviews(formatted);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchReviews();
  }, []);

  if (loading) return <div className="p-4 text-center">Loading reviews...</div>;
  if (reviews.length === 0)
    return <div className="p-4 text-center">No reviews yet.</div>;

  return (
    <div className="w-full max-w-md h-96 overflow-y-auto rounded-lg p-4 bg-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Client Reviews</h2>
      <div className="flex flex-col space-y-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="flex flex-col bg-gray-50 p-4 rounded-lg "
          >
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
                  {"★".repeat(review.stars)}{" "}
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
  );
}
