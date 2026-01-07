import { db } from "@/lib/db";
import { rooms } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { logActivity } from "@/lib/utils/activityLog";
import { NextRequest } from "next/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const roomId = id;

    // Get room info before deleting for logging
    const [room] = await db
      .select()
      .from(rooms)
      .where(eq(rooms.id, roomId))
      .limit(1);

    if (!room) {
      return Response.json({ error: "Room not found" }, { status: 404 });
    }

    // Check if room has active bookings (prevent deletion)
    const { bookings } = await import("@/lib/db/schema");
    const activeBookings = await db
      .select()
      .from(bookings)
      .where(eq(bookings.roomId, roomId))
      .limit(1);

    if (activeBookings.length > 0) {
      return Response.json(
        { error: "Cannot delete room with active bookings" },
        { status: 400 }
      );
    }

    // Delete the room
    await db.delete(rooms).where(eq(rooms.id, roomId));

    // Log activity
    await logActivity({
      action: "DELETE_ROOM",
      entityType: "room",
      entityId: roomId,
      description: `Deleted room: ${room.roomNumber}`,
      metadata: { roomNumber: room.roomNumber, floor: room.floor },
    });

    return Response.json({ success: true });
  } catch (error: any) {
    console.error("Delete room error:", error);
    return Response.json(
      { error: error.message || "Failed to delete room" },
      { status: 500 }
    );
  }
}
