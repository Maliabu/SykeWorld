// app/api/admin/gallery/route.ts
import { db, galleryCategories } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const categories = await db.query.galleryCategories.findMany({});
  const images = await db.query.galleryImages.findMany({});
  return NextResponse.json({ categories, images });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description } = body;

    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const newCategory = await db.insert(galleryCategories).values({
      name,
      description,
    }).returning();

    return NextResponse.json(newCategory[0]);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
