"use client";

import * as React from "react";
import { getAllRoomTypes, getAllRooms, updateRoomStatus } from "@/lib/actions/bookings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Room {
  id: string;
  roomNumber: string;
  floor: number;
  status: "available" | "occupied" | "cleaning" | "maintenance" | "unavailable";
  roomType: {
    id: string;
    name: string;
  };
}

interface RoomType {
  id: string;
  name: string;
}

export default function RoomAllocationsPage() {
  const [roomTypes, setRoomTypes] = React.useState<RoomType[]>([]);
  const [roomsByType, setRoomsByType] = React.useState<Record<string, Room[]>>({});
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<string>("");
  const [selectedRoom, setSelectedRoom] = React.useState<Room | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = React.useState(false);
  const [updatingStatus, setUpdatingStatus] = React.useState(false);

  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load room types
      const typesResult = await getAllRoomTypes();
      if (typesResult.success && typesResult.roomTypes) {
        const types = typesResult.roomTypes;
        setRoomTypes(types);
        
        // Set first room type as active tab
        if (types.length > 0 && !activeTab) {
          setActiveTab(types[0].id);
        }

        // Load all rooms
        const roomsResult = await getAllRooms();
        if (roomsResult.success && roomsResult.rooms) {
          // Group rooms by room type
          const grouped: Record<string, Room[]> = {};
          
          types.forEach((type) => {
            grouped[type.id] = [];
          });

          roomsResult.rooms.forEach((room: any) => {
            const typeId = room.roomType?.id;
            if (typeId && grouped[typeId]) {
              grouped[typeId].push({
                id: room.id,
                roomNumber: room.roomNumber,
                floor: room.floor,
                status: room.status,
                roomType: {
                  id: room.roomType.id,
                  name: room.roomType.name,
                },
              });
            }
          });

          // Sort rooms by room number within each type
          Object.keys(grouped).forEach((typeId) => {
            grouped[typeId].sort((a, b) => {
              // Extract numbers from room numbers for proper sorting
              const numA = parseInt(a.roomNumber.replace(/\D/g, "")) || 0;
              const numB = parseInt(b.roomNumber.replace(/\D/g, "")) || 0;
              return numA - numB;
            });
          });

          setRoomsByType(grouped);
        }
      }
    } catch (error) {
      console.error("Error loading room allocations:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-500 hover:bg-green-600";
      case "occupied":
        return "hover:opacity-90";
      case "cleaning":
        return "hover:opacity-90";
      case "maintenance":
        return "hover:opacity-90";
      case "unavailable":
        return "hover:opacity-90";
      default:
        return "bg-gray-400 hover:bg-gray-500";
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "available":
        return "#10b981"; // green-500
      case "occupied":
        return "#F9AC67"; // warm orange/peach
      case "cleaning":
        return "#ECE6CD"; // light creamy yellow
      case "maintenance":
        return "#EE6A59"; // coral/red
      case "unavailable":
        return "#3A3F58"; // dark navy
      default:
        return "#9ca3af"; // gray-400
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "available":
        return "Available";
      case "occupied":
        return "Booked";
      case "cleaning":
        return "Cleaning";
      case "maintenance":
        return "Maintenance";
      case "unavailable":
        return "Unavailable";
      default:
        return status;
    }
  };

  const getStatusCounts = (rooms: Room[]) => {
    const counts = {
      available: 0,
      occupied: 0,
      cleaning: 0,
      maintenance: 0,
      unavailable: 0,
    };

    rooms.forEach((room) => {
      if (counts.hasOwnProperty(room.status)) {
        counts[room.status as keyof typeof counts]++;
      }
    });

    return counts;
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedRoom) return;

    setUpdatingStatus(true);
    try {
      const result = await updateRoomStatus(selectedRoom.id, newStatus);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(`Room ${selectedRoom.roomNumber} status updated to ${getStatusLabel(newStatus)}`);
      setIsStatusDialogOpen(false);
      setSelectedRoom(null);
      await loadData(); // Reload to refresh the display
    } catch (error: any) {
      toast.error(error.message || "Failed to update room status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const openStatusDialog = (room: Room) => {
    setSelectedRoom(room);
    setIsStatusDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  if (roomTypes.length === 0) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Room Allocations</CardTitle>
            <CardDescription>No room types found. Please create room types first.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Room Allocations</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Track room availability and booking status across all room types
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="mb-8 mt-4 border-b border-gray-200 dark:border-gray-700">
          <TabsList className="flex flex-wrap items-center gap-0 p-0 bg-transparent h-auto">
            {roomTypes.map((type, index) => {
              const rooms = roomsByType[type.id] || [];
              const counts = getStatusCounts(rooms);
              const totalRooms = rooms.length;
              const isActive = activeTab === type.id;

              return (
                <div key={type.id} className="flex items-center">
                  {index > 0 && (
                    <div className="h-12 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>
                  )}
                  <TabsTrigger
                    value={type.id}
                    className="flex flex-row items-center justify-center gap-3 px-5 py-3 h-auto data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-orange-600 data-[state=active]:text-orange-600 data-[state=inactive]:text-gray-600 data-[state=inactive]:dark:text-gray-400 rounded-none transition-all whitespace-nowrap border-b-2 border-transparent hover:text-gray-900 dark:hover:text-gray-200"
                  >
                    <div className="flex flex-col items-start gap-0.5">
                      <div className={`font-semibold text-sm ${isActive ? 'text-orange-600 dark:text-orange-500' : 'text-gray-700 dark:text-gray-300'}`}>
                        {type.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {totalRooms} room{totalRooms !== 1 ? "s" : ""}
                      </div>
                    </div>
                    {totalRooms > 0 && (
                      <div className="flex items-center gap-3 ml-1">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                          <span className="text-xs font-medium">{counts.available}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#F9AC67' }}></div>
                          <span className="text-xs font-medium">{counts.occupied}</span>
                        </div>
                      </div>
                    )}
                  </TabsTrigger>
                </div>
              );
            })}
          </TabsList>
        </div>

        {roomTypes.map((type) => {
          const rooms = roomsByType[type.id] || [];
          const counts = getStatusCounts(rooms);

          return (
            <TabsContent key={type.id} value={type.id} className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle className="text-2xl">{type.name} Rooms</CardTitle>
                      <CardDescription className="mt-1">
                        Total: {rooms.length} room{rooms.length !== 1 ? "s" : ""} | Available: {counts.available} | Booked: {counts.occupied}
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1 bg-green-600 border-green-600">
                        <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                        <span className="font-medium text-white">Available: {counts.available}</span>
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1 border" style={{ backgroundColor: '#F9AC67', borderColor: '#F9AC67' }}>
                        <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                        <span className="font-medium text-white">Booked: {counts.occupied}</span>
                      </Badge>
                      {counts.cleaning > 0 && (
                        <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1 border" style={{ backgroundColor: '#ECE6CD', borderColor: '#ECE6CD' }}>
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#3A3F58' }}></div>
                          <span className="font-medium" style={{ color: '#3A3F58' }}>Cleaning: {counts.cleaning}</span>
                        </Badge>
                      )}
                      {counts.maintenance > 0 && (
                        <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1 border" style={{ backgroundColor: '#EE6A59', borderColor: '#EE6A59' }}>
                          <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                          <span className="font-medium text-white">Maintenance: {counts.maintenance}</span>
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {rooms.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      No rooms of this type found. Create rooms in the "Add Room" page.
                    </div>
                  ) : (
                    <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-4">
                      {rooms.map((room) => (
                        <div
                          key={room.id}
                          className="flex flex-col items-center gap-2 group"
                        >
                          <div
                            onClick={() => openStatusDialog(room)}
                            className="w-full aspect-square transition-all duration-200 cursor-pointer hover:scale-105"
                            style={{ backgroundColor: getStatusBgColor(room.status) }}
                            title={`Room ${room.roomNumber} - ${getStatusLabel(room.status)} (Floor ${room.floor}) - Click to change status`}
                          >
                          </div>
                          <div className="text-center w-full">
                            <div className="text-sm font-bold text-gray-900 dark:text-white">
                              Room {room.roomNumber}
                            </div>
                            <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mt-0.5">
                              {getStatusLabel(room.status)}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                              Floor {room.floor}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Status Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-lg bg-green-500"></div>
              <span className="text-sm">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-lg" style={{ backgroundColor: '#F9AC67' }}></div>
              <span className="text-sm">Booked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-lg" style={{ backgroundColor: '#ECE6CD' }}></div>
              <span className="text-sm">Cleaning</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-lg" style={{ backgroundColor: '#EE6A59' }}></div>
              <span className="text-sm">Maintenance</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-lg" style={{ backgroundColor: '#3A3F58' }}></div>
              <span className="text-sm">Unavailable</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
            💡 Tip: Click on any colored box to change the room status
          </p>
        </CardContent>
      </Card>

      {/* Status Change Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Room Status</DialogTitle>
            <DialogDescription>
              Select a new status for Room {selectedRoom?.roomNumber} (Floor {selectedRoom?.floor})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {(["available", "occupied", "cleaning", "maintenance", "unavailable"] as const).map((status) => {
              const isCurrentStatus = selectedRoom?.status === status;
              const statusColors: Record<string, string> = {
                available: "#10b981", // green-500
                occupied: "#F9AC67", // warm orange/peach
                cleaning: "#ECE6CD", // light creamy yellow
                maintenance: "#EE6A59", // coral/red
                unavailable: "#3A3F58", // dark navy
              };
              
              return (
                <Button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={updatingStatus || isCurrentStatus}
                  variant={isCurrentStatus ? "default" : "outline"}
                  className="w-full justify-start gap-3 h-auto py-3 rounded-none"
                >
                  <div className="w-4 h-4 rounded-lg" style={{ backgroundColor: statusColors[status] }}></div>
                  <div className="flex flex-col items-start">
                    <span className="font-semibold">{getStatusLabel(status)}</span>
                    {isCurrentStatus && (
                      <span className="text-xs opacity-75">Current status</span>
                    )}
                  </div>
                </Button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
