"use client";

import { useEffect, useState, useMemo } from "react";
import { getAllReviews, deleteReview } from "@/lib/actions/bookings";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Star, Search } from "lucide-react";

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "N/A";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "N/A";
  }
};

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    setLoading(true);
    const result = await getAllReviews();
    if (result.success) {
      setReviews(result.reviews || []);
    } else {
      toast.error(result.error || "Failed to load reviews");
    }
    setLoading(false);
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    const result = await deleteReview(reviewId);
    if (result.success) {
      toast.success("Review deleted successfully");
      loadReviews();
    } else {
      toast.error(result.error || "Failed to delete review");
    }
  };

  // Filter reviews based on search
  const filteredReviews = useMemo(() => {
    if (!searchTerm) return reviews;
    const term = searchTerm.toLowerCase();
    return reviews.filter(
      (r) => {
        const userName = r.user?.firstName && r.user?.lastName
          ? `${r.user.firstName} ${r.user.lastName}`
          : r.user?.username || r.user?.email?.split("@")[0] || "";
        return (
          userName.toLowerCase().includes(term) ||
          r.user?.email?.toLowerCase().includes(term) ||
          r.comment?.toLowerCase().includes(term) ||
          r.room?.roomNumber?.toLowerCase().includes(term)
        );
      }
    );
  }, [reviews, searchTerm]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Loading reviews...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Reviews</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage guest reviews</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reviews..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-6">
        {filteredReviews.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              {searchTerm ? "No reviews match your search" : "No reviews found"}
            </CardContent>
          </Card>
        ) : (
          filteredReviews.map((review, index) => (
            <Card key={review.id || `review-${index}`} className="overflow-hidden border-gray-200 dark:border-gray-800">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {review.user?.firstName && review.user?.lastName
                        ? `${review.user.firstName} ${review.user.lastName}`
                        : review.user?.username || review.user?.email?.split("@")[0] || "Anonymous"}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Room {review.room?.roomNumber || "N/A"} • {formatDate(review.created)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={`star-${review.id}-${i}`}
                          className={`w-4 h-4 ${
                            i < (review.stars || 0)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-orange-600 hover:text-orange-700"
                      onClick={() => handleDelete(review.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {review.comment && (
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300">{review.comment}</p>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

