import { NextRequest, NextResponse } from "next/server";
import { db, galleryImages } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { categoryId, image, caption } = body;

    if (!categoryId || !image) {
      return NextResponse.json({ error: "Category and image are required" }, { status: 400 });
    }

    const newImage = await db.insert(galleryImages).values({
      categoryId,
      image,
      caption,
    }).returning();

    return NextResponse.json(newImage[0]);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to add image" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const images = await db.select().from(galleryImages);
    return NextResponse.json({ images });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 });
  }
}
