import { db } from "@/lib/db";

export async function GET() {
  try {
    const data = await db.query.roomServices.findMany();

    return Response.json({ services: data });
  } catch (error) {
    console.error("API /services error:", error);
    return Response.json({ error: "Failed" }, { status: 500 });
  }
}
