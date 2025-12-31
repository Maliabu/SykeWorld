"use client";

import { useEffect, useState } from "react";
import { getAllTasks, createTask, getAllTaskStatuses, getAllStaff, createStaff, getAllRoles } from "@/lib/actions/staff";
import { getAllRooms, createRoom, getAllRoomTypes } from "@/lib/actions/bookings";
import { getAllUsers, createUser } from "@/lib/actions/users";
import { checkUserPermission } from "@/lib/actions/permissions";
import { useSession } from "@/lib/hooks/useSession";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, ListChecks, Calendar, User, Home, AlertCircle } from "lucide-react";

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "N/A";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "N/A";
  }
};

export default function TasksPage() {
  const { user } = useSession();
  const isAdmin = user?.isSuperuser || user?.userType === "admin";
  const [tasks, setTasks] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddStaffDialogOpen, setIsAddStaffDialogOpen] = useState(false);
  const [isAddRoomDialogOpen, setIsAddRoomDialogOpen] = useState(false);
  const [canCreateStaff, setCanCreateStaff] = useState(false);
  const [canCreateRooms, setCanCreateRooms] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [newStaffData, setNewStaffData] = useState({
    userId: "",
    roleId: "",
  });
  const [newRoomData, setNewRoomData] = useState({
    roomNumber: "",
    floor: 1,
    status: "available",
    roomTypeId: "",
  });
  const [formData, setFormData] = useState({
    staffId: "",
    roomId: "",
    title: "",
    details: "",
    dueDate: "",
    statusId: "",
  });

  useEffect(() => {
    loadData();
    checkPermissions();
  }, [user]);

  const checkPermissions = async () => {
    if (!user) return;
    if (isAdmin) {
      setCanCreateStaff(true);
      setCanCreateRooms(true);
      return;
    }
    try {
      const [staffPerm, roomsPerm] = await Promise.all([
        checkUserPermission("staff_create"),
        checkUserPermission("rooms_create"),
      ]);
      setCanCreateStaff(staffPerm.hasPermission);
      setCanCreateRooms(roomsPerm.hasPermission);
    } catch {
      setCanCreateStaff(false);
      setCanCreateRooms(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    const [tasksResult, staffResult, roomsResult, statusesResult, usersResult, rolesResult, roomTypesResult] = await Promise.all([
      getAllTasks(),
      getAllStaff(),
      getAllRooms(),
      getAllTaskStatuses(),
      getAllUsers().catch(() => ({ success: false, users: [] })),
      getAllRoles().catch(() => ({ success: false, roles: [] })),
      getAllRoomTypes().catch(() => ({ success: false, roomTypes: [] })),
    ]);

    if (tasksResult.success) {
      setTasks(tasksResult.tasks || []);
    } else {
      toast.error(tasksResult.error || "Failed to load tasks");
    }

    if (staffResult.success) {
      const staffList = staffResult.staff || [];
      console.log("Tasks page: Loaded staff result:", {
        success: staffResult.success,
        count: staffList.length,
        staff: staffList,
      });
      setStaff(staffList);
      if (staffList.length === 0) {
        console.warn("Tasks page: No staff members returned, but query was successful");
      }
    } else {
      console.error("Tasks page: Failed to load staff:", staffResult.error);
      toast.error(staffResult.error || "Failed to load staff members");
      setStaff([]);
    }

    if (roomsResult.success) {
      setRooms(roomsResult.rooms || []);
    }

    if (statusesResult.success) {
      setStatuses(statusesResult.statuses || []);
      if (statusesResult.statuses && statusesResult.statuses.length > 0 && !formData.statusId) {
        setFormData((prev) => ({
          ...prev,
          statusId: statusesResult.statuses[0].id,
        }));
      }
    }

    if (usersResult.success) {
      setUsers(usersResult.users || []);
    }

    if (rolesResult.success) {
      setRoles(rolesResult.roles || []);
    }

    if (roomTypesResult.success) {
      setRoomTypes(roomTypesResult.roomTypes || []);
    }

    setLoading(false);
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateStaff && !isAdmin) {
      toast.error("You don't have permission to create staff. Please contact an admin.");
      return;
    }

    const result = await createStaff(newStaffData);
    if (result.success) {
      toast.success("Staff member created successfully");
      setIsAddStaffDialogOpen(false);
      setNewStaffData({ userId: "", roleId: "" });
      loadData();
      if (result.staff) {
        setFormData((prev) => ({ ...prev, staffId: result.staff.id }));
      }
    } else {
      toast.error(result.error || "Failed to create staff member");
    }
  };

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateRooms && !isAdmin) {
      toast.error("You don't have permission to create rooms. Please contact an admin.");
      return;
    }

    const result = await createRoom(newRoomData);
    if (result.success) {
      toast.success("Room created successfully");
      setIsAddRoomDialogOpen(false);
      setNewRoomData({ roomNumber: "", floor: 1, status: "available", roomTypeId: "" });
      loadData();
      if (result.room) {
        setFormData((prev) => ({ ...prev, roomId: result.room.id }));
      }
    } else {
      toast.error(result.error || "Failed to create room");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await createTask(formData);
    if (result.success) {
      toast.success("Task created successfully!");
      setIsDialogOpen(false);
      setFormData({
        staffId: "",
        roomId: "",
        title: "",
        details: "",
        dueDate: "",
        statusId: statuses[0]?.id || "",
      });
      loadData();
      // Dispatch event to update task count in header
      window.dispatchEvent(new Event('taskUpdated'));
    } else {
      toast.error(result.error || "Failed to create task");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Staff Tasks</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Create Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>Assign a task to a staff member.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="staffId">Staff Member *</Label>
                    {(canCreateStaff || isAdmin) ? (
                      <Dialog open={isAddStaffDialogOpen} onOpenChange={setIsAddStaffDialogOpen}>
                        <DialogTrigger asChild>
                          <Button type="button" variant="outline" size="sm" className="h-7">
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add New Staff Member</DialogTitle>
                            <DialogDescription>Create a staff profile for a user</DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleAddStaff} className="space-y-4">
                            <div>
                              <Label>User *</Label>
                              <Select
                                value={newStaffData.userId}
                                onValueChange={(value) => setNewStaffData({ ...newStaffData, userId: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select user" />
                                </SelectTrigger>
                                <SelectContent>
                                  {users.map((u) => (
                                    <SelectItem key={u.id} value={u.id}>
                                      {u.firstName && u.lastName
                                        ? `${u.firstName} ${u.lastName} (${u.email})`
                                        : u.username || u.email}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Role *</Label>
                              <Select
                                value={newStaffData.roleId}
                                onValueChange={(value) => setNewStaffData({ ...newStaffData, roleId: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                  {roles.map((r) => (
                                    <SelectItem key={r.id} value={r.id}>
                                      {r.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <DialogFooter>
                              <Button type="button" variant="outline" onClick={() => setIsAddStaffDialogOpen(false)}>
                                Cancel
                              </Button>
                              <Button type="submit">Add Staff</Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <AlertCircle className="h-3 w-3" />
                        <span>No permission. <a href="/admin/dashboard/tickets" className="text-orange-600 hover:underline">Open a ticket</a> to request access.</span>
                      </div>
                    )}
                  </div>
                  <Select
                    value={formData.staffId}
                    onValueChange={(value) => setFormData({ ...formData, staffId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {staff.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">No staff members available</div>
                      ) : (
                        staff.map((member) => {
                          const displayName = member.user?.firstName && member.user?.lastName
                            ? `${member.user.firstName} ${member.user.lastName}`
                            : member.user?.username || member.user?.email || `Staff ${member.id.slice(0, 8)}`;
                          return (
                            <SelectItem key={member.id || `staff-${member.userId}`} value={member.id}>
                              {displayName} - {member.role?.name || "No Role"}
                            </SelectItem>
                          );
                        })
                      )}
                    </SelectContent>
                  </Select>
                  {staff.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {isAdmin 
                        ? "No staff members found. Click 'Add' to create a new staff member."
                        : "No staff members available. Contact an admin if you need to create a staff member."}
                    </p>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="roomId">Room (Optional)</Label>
                    {(canCreateRooms || isAdmin) ? (
                      <Dialog open={isAddRoomDialogOpen} onOpenChange={setIsAddRoomDialogOpen}>
                        <DialogTrigger asChild>
                          <Button type="button" variant="outline" size="sm" className="h-7">
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Add New Room</DialogTitle>
                            <DialogDescription>Create a new room</DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleAddRoom} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Room Number *</Label>
                                <Input
                                  value={newRoomData.roomNumber}
                                  onChange={(e) => setNewRoomData({ ...newRoomData, roomNumber: e.target.value })}
                                  required
                                />
                              </div>
                              <div>
                                <Label>Floor *</Label>
                                <Input
                                  type="number"
                                  value={newRoomData.floor}
                                  onChange={(e) => setNewRoomData({ ...newRoomData, floor: parseInt(e.target.value) || 1 })}
                                  required
                                />
                              </div>
                            </div>
                            <div>
                              <Label>Room Type *</Label>
                              <Select
                                value={newRoomData.roomTypeId}
                                onValueChange={(value) => setNewRoomData({ ...newRoomData, roomTypeId: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select room type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {roomTypes.map((rt) => (
                                    <SelectItem key={rt.id} value={rt.id}>
                                      {rt.name} - ${rt.basePrice}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Status *</Label>
                              <Select
                                value={newRoomData.status}
                                onValueChange={(value) => setNewRoomData({ ...newRoomData, status: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="available">Available</SelectItem>
                                  <SelectItem value="occupied">Occupied</SelectItem>
                                  <SelectItem value="cleaning">Cleaning</SelectItem>
                                  <SelectItem value="maintenance">Maintenance</SelectItem>
                                  <SelectItem value="unavailable">Unavailable</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <DialogFooter>
                              <Button type="button" variant="outline" onClick={() => setIsAddRoomDialogOpen(false)}>
                                Cancel
                              </Button>
                              <Button type="submit">Add Room</Button>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <AlertCircle className="h-3 w-3" />
                        <span>No permission. <a href="/admin/dashboard/tickets" className="text-orange-600 hover:underline">Open a ticket</a> to request access.</span>
                      </div>
                    )}
                  </div>
                  <Select
                    value={formData.roomId || "none"}
                    onValueChange={(value) => setFormData({ ...formData, roomId: value === "none" ? "" : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a room (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {rooms.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">No rooms available</div>
                      ) : (
                        rooms.map((room) => (
                          <SelectItem key={room.id || `room-${room.roomNumber}`} value={room.id}>
                            Room {room.roomNumber} - {room.roomType?.name || "No Type"}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {rooms.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {isAdmin 
                        ? "No rooms found. Click 'Add' to create a new room."
                        : "No rooms available. Contact an admin if you need to create a room."}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="title">Task Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Clean room 101"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="details">Details</Label>
                  <Textarea
                    id="details"
                    value={formData.details}
                    onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                    placeholder="Task details and instructions..."
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="statusId">Status</Label>
                    <Select
                      value={formData.statusId}
                      onValueChange={(value) => setFormData({ ...formData, statusId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((status) => (
                          <SelectItem key={status.id || `status-${status.status}`} value={status.id}>
                            {status.status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white">
                  Create Task
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Tasks</CardTitle>
          <CardDescription>View and manage staff tasks.</CardDescription>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No tasks found.</div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <div
                  key={task.id || `task-${task.title}`}
                  className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <ListChecks className="h-5 w-5 text-orange-600" />
                        <h3 className="font-semibold text-foreground">{task.title}</h3>
                        <Badge className={getStatusColor(task.status?.status)}>
                          {task.status?.status || "Unknown"}
                        </Badge>
                      </div>
                      {task.details && (
                        <p className="text-sm text-muted-foreground mb-3">{task.details}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {task.roomId && (
                          <div className="flex items-center gap-1">
                            <Home className="h-4 w-4" />
                            Room {task.roomId.slice(0, 8)}...
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Due: {formatDate(task.dueDate)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Assigned: {formatDate(task.assignedDate)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

