import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    // Fetch categories with their images in a single query using relations
    const categories = await db.query.galleryCategories.findMany({
      with: {
        images: true, // fetch related galleryImages
      },
    });

    // Transform data for the frontend
    const formatted = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      images: cat.images.map((img) => img.image),
    }));

    return NextResponse.json({ success: true, categories: formatted });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch gallery categories" },
      { status: 500 }
    );
  }
}