// app/api/reviews/route.ts (Next.js 13+)
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Fetch all rooms with their reviews
    const data = await db.query.rooms.findMany({
      with: {
        reviews: true
      },
    });

    // Flatten reviews and map to frontend interface
    const allReviews = data.flatMap((room) =>
      (room.reviews || []).map((rev) => ({
        id: rev.id,
        user: rev.userId, // replace with proper mapping if you have user table
        message: rev.comment || "",
        stars: rev.stars,
        avatar: undefined, // optional
        createdAt: rev.createdAt,
      }))
    );

    // Sort by newest first
    allReviews.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return Response.json({ reviews: allReviews });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}
