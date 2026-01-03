"use client";

import { useEffect, useState, useMemo } from "react";
import { getAllBookings, updateBookingStatus } from "@/lib/actions/bookings";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Users, MapPin, Mail, Phone, Search } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";

// Simple date formatter
const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "N/A";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "N/A";
  }
};

const ITEMS_PER_PAGE = 20;

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadBookings();
  }, [statusFilter]);

  const loadBookings = async () => {
    setLoading(true);
    const result = await getAllBookings(statusFilter === "all" ? undefined : statusFilter);
    if (result.success) {
      setBookings(result.bookings || []);
    } else {
      toast.error(result.error || "Failed to load bookings");
    }
    setLoading(false);
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    const result = await updateBookingStatus(bookingId, newStatus);
    if (result.success) {
      toast.success("Booking status updated");
      loadBookings();
    } else {
      toast.error(result.error || "Failed to update status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "checked_in":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "checked_out":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  // Filter bookings based on search
  const filteredBookings = useMemo(() => {
    let filtered = bookings;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (b) => {
          const userName = b.user?.firstName && b.user?.lastName
            ? `${b.user.firstName} ${b.user.lastName}`
            : b.user?.username || b.user?.email?.split("@")[0] || "";
          return (
            b.id?.toLowerCase().includes(term) ||
            b.room?.roomNumber?.toLowerCase().includes(term) ||
            b.user?.email?.toLowerCase().includes(term) ||
            userName.toLowerCase().includes(term) ||
            b.roomType?.name?.toLowerCase().includes(term) ||
            b.status?.toLowerCase().includes(term)
          );
        }
      );
    }

    return filtered;
  }, [bookings, searchTerm]);

  // Paginate filtered bookings
  const paginatedBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredBookings.slice(startIndex, endIndex);
  }, [filteredBookings, currentPage]);

  const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Loading bookings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Bookings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage all hotel bookings</p>
        </div>
        <div className="flex gap-3 items-start">
          <div className="relative w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 z-10 pointer-events-none" />
              <Input
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-1">
              Search by: customer name, email, room number, or booking ID
            </p>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Bookings</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="checked_in">Checked In</SelectItem>
              <SelectItem value="checked_out">Checked Out</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-2">
        {filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500 dark:text-gray-400">
              {searchTerm ? "No bookings match your search" : "No bookings found"}
            </CardContent>
          </Card>
        ) : (
          paginatedBookings.map((booking, index) => (
            <Card key={booking.id || `booking-${index}`} className="overflow-hidden border-gray-200 dark:border-gray-800">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">Booking #{booking.id.slice(0, 8)}</CardTitle>
                    <CardDescription className="mt-1">
                      Room {booking.room.roomNumber} • Floor {booking.room.floor}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(booking.status)}>
                    {booking.status.replace("_", " ").toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Check-in</div>
                      <div className="text-gray-600 dark:text-gray-400">
                        {formatDate(booking.checkIn)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Check-out</div>
                      <div className="text-gray-600 dark:text-gray-400">
                        {formatDate(booking.checkOut)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Guests</div>
                      <div className="text-gray-600 dark:text-gray-400">{booking.guests}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Room Type</div>
                      <div className="text-gray-600 dark:text-gray-400">{booking.roomType.name}</div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                  <div className="flex items-center gap-3 text-sm mb-3">
                    <Mail className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Guest</div>
                      <div className="text-gray-600 dark:text-gray-400">
                        {booking.user?.firstName && booking.user?.lastName
                          ? `${booking.user.firstName} ${booking.user.lastName}`
                          : booking.user?.username || booking.user?.email?.split("@")[0] || "Unknown"} ({booking.user?.email || "N/A"})
                      </div>
                    </div>
                  </div>
                  {booking.specialRequests && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      <span className="font-medium text-gray-900 dark:text-white">Special Requests: </span>
                      {booking.specialRequests}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Select
                    value={booking.status}
                    onValueChange={(value) => handleStatusUpdate(booking.id, value)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="checked_in">Checked In</SelectItem>
                      <SelectItem value="checked_out">Checked Out</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {filteredBookings.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredBookings.length}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      )}
    </div>
  );
}

