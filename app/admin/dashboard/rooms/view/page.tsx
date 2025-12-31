"use client"

import React, { useEffect, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"
import { getAllRooms, deleteRoom } from "@/lib/actions/bookings"
import { toast } from "sonner"
import { RoomCard } from "./roomCard"
import { Card, CardContent } from "@/components/ui/card"

const ITEMS_PER_PAGE = 6

export default function Rooms() {
  const [rooms, setRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    loadRooms()
  }, [])

  const loadRooms = async () => {
    setLoading(true)
    const result = await getAllRooms()
    if (result.success) {
      setRooms(result.rooms || [])
    } else {
      toast.error(result.error || "Failed to load rooms")
    }
    setLoading(false)
  }

  const handleDelete = async (roomId: string) => {
    if (!confirm("Are you sure you want to delete this room?")) return

    const result = await deleteRoom(roomId)
    if (result.success) {
      toast.success("Room deleted successfully")
      loadRooms()
    } else {
      toast.error(result.error || "Failed to delete room")
    }
  }

  // Filter rooms based on search - must be called before any early returns
  const filteredRooms = useMemo(() => {
    if (!searchTerm) return rooms;
    const term = searchTerm.toLowerCase();
    return rooms.filter(
      (r) =>
        r.roomNumber?.toLowerCase().includes(term) ||
        r.roomType?.name?.toLowerCase().includes(term) ||
        r.status?.toLowerCase().includes(term) ||
        r.floor?.toString().includes(term)
    );
  }, [rooms, searchTerm]);

  // Early returns must come AFTER all hooks
  if (loading) {
    return (
      <div className="p-6 md:p-8 lg:p-10">
        <div className="text-center py-8 sm:py-12">Loading rooms...</div>
      </div>
    )
  }

  const totalPages = Math.ceil(filteredRooms.length / ITEMS_PER_PAGE)
  const startIndex = (page - 1) * ITEMS_PER_PAGE
  const paginatedRooms = filteredRooms.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  return (
    <div className="p-6 md:p-8 lg:p-10 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white">All Rooms</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">Manage hotel rooms</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search rooms..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1); // Reset to first page on search
            }}
            className="pl-10 w-full"
          />
        </div>
      </div>

      {filteredRooms.length === 0 ? (
        <Card>
          <CardContent className="py-8 sm:py-12 text-center text-gray-500">
            No rooms found
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {paginatedRooms.map((room) => (
              <RoomCard key={room.id} {...room} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-4 sm:mt-6">
              <Button
                variant="outline"
                size="icon"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft />
              </Button>

              <span className="text-sm font-medium">
                Page {page} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="icon"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
