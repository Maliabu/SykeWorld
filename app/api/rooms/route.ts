import { db } from "@/lib/db";
import { rooms, roomImages, roomTypes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const data = await db.query.rooms.findMany({
      with: {
        images: true,
        roomType: true,
        reviews: true,
      },
    });
    console.log(data)

    return Response.json({ rooms: data });
  } catch (error) {
    console.error("API /rooms error:", error);
    return Response.json({ error: "Failed" }, { status: 500 });
  }
}
export async function POST(req: Request) {
  try {
    const data = await req.json();

    const inserted = await db.insert(rooms).values({
      roomNumber: data.roomNumber,
      floor: data.floor,
      status: data.status,
      roomTypeId: data.roomTypeId,
    });

    return Response.json({ success: true, inserted });
  } catch (err) {
    console.error("Add room error:", err);
    return Response.json({ error: "Failed to add room" }, { status: 500 });
  }
}
