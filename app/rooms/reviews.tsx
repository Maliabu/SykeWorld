"use client";

import React, { useEffect, useState } from "react";
import { getAllRooms } from "@/lib/actions/bookings";

interface Review {
  id: string;
  user: string;
  message: string;
  stars: number;
  avatar?: string;
  createdAt?: string;
}

export default function ReviewsColumn() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    getAllRooms()
      .then((result) => {
        if (result.success && result.rooms) {
          // Flatten all reviews from all rooms
          const allReviews = result.rooms.flatMap((room: any) =>
            (room.reviews || []).map((rev: any) => ({
              id: rev.id || `review-${room.id}-${rev.stars}`,
              user: rev.user?.firstName && rev.user?.lastName
                ? `${rev.user.firstName} ${rev.user.lastName}`
                : rev.user?.email || "Anonymous",
              message: rev.comment || "",
              stars: rev.stars ?? 5,
              avatar: rev.user?.avatar || undefined,
              createdAt: rev.created || rev.createdAt,
            }))
          );
          // Sort by newest first and take top 10
          allReviews.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          });
          setReviews(allReviews.slice(0, 10));
        } else {
          setError(new Error(result.error || "Failed to load reviews"));
        }
      })
      .catch((err) => {
        setError(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-4 text-center">Loading reviews...</div>;
  if (error) return <div className="p-4 text-center text-red-500">Failed to load reviews.</div>;

  if (reviews.length === 0)
    return <div className="p-4 text-center">No reviews yet.</div>;

  return (
    <div className="w-full max-w-md h-96 overflow-y-auto rounded-lg p-4 bg-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Client Reviews</h2>
      <div className="flex flex-col space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="flex flex-col bg-gray-50 p-4 rounded-lg">
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
                  <span className="text-gray-400">{"★".repeat(5 - review.stars)}</span>
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
