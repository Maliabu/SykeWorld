"use client";

import { useEffect, useState } from "react";
import { getUserNotifications, markNotificationAsRead, createNotification, deleteNotification, getAllNotifications } from "@/lib/actions/notifications";
import { getAllUsers, createUser } from "@/lib/actions/users";
import { checkUserPermission } from "@/lib/actions/permissions";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Plus, Trash2, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { useSession } from "@/lib/hooks/useSession";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function NotificationsPage() {
  const { user } = useSession();
  const isAdmin = user?.isSuperuser || user?.userType === "admin";
  const [notifications, setNotifications] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [canCreateUsers, setCanCreateUsers] = useState(false);
  const [newUserData, setNewUserData] = useState({
    email: "",
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    userType: "guest" as "guest" | "staff",
    phone: "",
  });
  const [formData, setFormData] = useState({
    userId: "",
    title: "",
    message: "",
  });

  useEffect(() => {
    loadData();
    checkPermissions();
  }, [user]);

  const checkPermissions = async () => {
    if (!user) return;
    // Admins can always create users
    if (isAdmin) {
      setCanCreateUsers(true);
      return;
    }
    // Check if user has permission to create users
    try {
      const result = await checkUserPermission("users_create");
      setCanCreateUsers(result.hasPermission);
    } catch {
      setCanCreateUsers(false);
    }
  };

  // Mark all new notifications as read when page loads (user views them)
  useEffect(() => {
    if (notifications.length > 0) {
      const markNewAsRead = async () => {
        const newNotifications = notifications.filter((n: any) => n.status === "new");
        if (newNotifications.length > 0) {
          // Mark each as read
          await Promise.all(
            newNotifications.map((n: any) => markNotificationAsRead(n.id))
          );
          loadData();
          window.dispatchEvent(new Event('notificationUpdated'));
        }
      };
      markNewAsRead();
    }
  }, [notifications.length]); // Only when notifications are loaded

  const loadData = async () => {
    setLoading(true);
    try {
      const [notifResult, usersResult] = await Promise.all([
        isAdmin ? getAllNotifications() : getUserNotifications(),
        getAllUsers(), // Always try to load users, permission check happens in the action
      ]);

      if (notifResult.success) {
        setNotifications(notifResult.notifications || []);
      } else {
        toast.error(notifResult.error || "Failed to load notifications");
      }

      if (usersResult.success) {
        setUsers(usersResult.users || []);
      } else if (usersResult.error && !usersResult.error.includes("Unauthorized")) {
        // Only show error if it's not a permission issue
        console.error("Failed to load users:", usersResult.error);
      }
    } catch (error) {
      console.error("Load data error:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateUsers && !isAdmin) {
      toast.error("You don't have permission to create users. Please contact an admin.");
      return;
    }

    const result = await createUser(newUserData);
    if (result.success) {
      toast.success("User created successfully");
      setIsAddUserDialogOpen(false);
      setNewUserData({
        email: "",
        username: "",
        password: "",
        firstName: "",
        lastName: "",
        userType: "guest",
        phone: "",
      });
      // Reload users and auto-select the new user
      const usersResult = await getAllUsers();
      if (usersResult.success) {
        setUsers(usersResult.users || []);
        if (result.user) {
          setFormData({ ...formData, userId: result.user.id });
        }
      }
    } else {
      toast.error(result.error || "Failed to create user");
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    const result = await markNotificationAsRead(notificationId);
    if (result.success) {
      toast.success("Notification marked as read");
      loadData();
      // Update notification count in header by triggering a refresh
      window.dispatchEvent(new Event('notificationUpdated'));
    } else {
      toast.error(result.error || "Failed to mark as read");
    }
  };

  // Mark all new notifications as read when page loads
  useEffect(() => {
    const markNewAsRead = async () => {
      const newNotifications = notifications.filter(n => n.status === "new");
      if (newNotifications.length > 0) {
        // Mark each as read
        await Promise.all(
          newNotifications.map(n => markNotificationAsRead(n.id))
        );
        loadData();
        window.dispatchEvent(new Event('notificationUpdated'));
      }
    };

    if (notifications.length > 0) {
      markNewAsRead();
    }
  }, []); // Only run once on mount

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error("Only admins can create notifications");
      return;
    }

    const result = await createNotification(formData);
    if (result.success) {
      toast.success("Notification created");
      setIsDialogOpen(false);
      setFormData({ userId: "", title: "", message: "" });
      loadData();
    } else {
      toast.error(result.error || "Failed to create notification");
    }
  };

  const handleDelete = async () => {
    if (!selectedNotification) return;

    const result = await deleteNotification(selectedNotification.id);
    if (result.success) {
      toast.success("Notification deleted");
      setDeleteDialogOpen(false);
      setSelectedNotification(null);
      loadData();
    } else {
      toast.error(result.error || "Failed to delete notification");
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground mt-1">Manage and view your notifications</p>
        </div>
        {isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create Notification
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Notification</DialogTitle>
                <DialogDescription>Send a notification to a user</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate}>
                <div className="space-y-4 py-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Label htmlFor="userId">User *</Label>
                      {(canCreateUsers || isAdmin) ? (
                        <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
                          <DialogTrigger asChild>
                            <Button type="button" variant="outline" size="sm" className="h-7">
                              <Plus className="h-3 w-3 mr-1" />
                              Add
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Add New User</DialogTitle>
                              <DialogDescription>Create a new user account</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleAddUser} className="space-y-4">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label>Email *</Label>
                                  <Input
                                    type="email"
                                    value={newUserData.email}
                                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                                    required
                                  />
                                </div>
                                <div>
                                  <Label>Username *</Label>
                                  <Input
                                    value={newUserData.username}
                                    onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                                    required
                                  />
                                </div>
                              </div>
                              <div>
                                <Label>Password *</Label>
                                <Input
                                  type="password"
                                  value={newUserData.password}
                                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                                  required
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label>First Name</Label>
                                  <Input
                                    value={newUserData.firstName}
                                    onChange={(e) => setNewUserData({ ...newUserData, firstName: e.target.value })}
                                  />
                                </div>
                                <div>
                                  <Label>Last Name</Label>
                                  <Input
                                    value={newUserData.lastName}
                                    onChange={(e) => setNewUserData({ ...newUserData, lastName: e.target.value })}
                                  />
                                </div>
                              </div>
                              <div>
                                <Label>Phone</Label>
                                <Input
                                  value={newUserData.phone}
                                  onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label>User Type</Label>
                                <Select
                                  value={newUserData.userType}
                                  onValueChange={(value: "guest" | "staff") => setNewUserData({ ...newUserData, userType: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="guest">Guest</SelectItem>
                                    <SelectItem value="staff">Staff</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button type="submit">Create User</Button>
                              </div>
                            </form>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <AlertCircle className="h-3 w-3" />
                          <span>No permission to add users. <a href="/admin/dashboard/tickets" className="text-orange-600 hover:underline">Open a ticket</a> to request access.</span>
                        </div>
                      )}
                    </div>
                    <Select
                      value={formData.userId}
                      onValueChange={(value) => setFormData({ ...formData, userId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.length === 0 ? (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">No users available</div>
                        ) : (
                          users.map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.firstName && u.lastName
                                ? `${u.firstName} ${u.lastName} (${u.email})`
                                : u.username || u.email}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {users.length === 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {isAdmin 
                          ? "No users found. Click 'Add' to create a new user."
                          : "No users available. Contact an admin if you need to create a user."}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={4}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white">
                    Create
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-2">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No notifications found
            </CardContent>
          </Card>
        ) : (
          notifications.map((notif) => (
            <Card
              key={notif.id}
              className={`${
                notif.status === "new" ? "border-orange-500 bg-orange-50 dark:bg-orange-950" : ""
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{notif.title}</CardTitle>
                      <Badge
                        variant={notif.status === "new" ? "default" : "outline"}
                        className={
                          notif.status === "new"
                            ? "bg-orange-500 text-white"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                        }
                      >
                        {notif.status === "new" ? (
                          <Circle className="h-3 w-3 mr-1" />
                        ) : (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        )}
                        {notif.status}
                      </Badge>
                    </div>
                    {isAdmin && notif.user && (
                      <CardDescription>
                        To: {notif.user.firstName && notif.user.lastName
                          ? `${notif.user.firstName} ${notif.user.lastName}`
                          : notif.user.username || notif.user.email}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {notif.status === "new" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkAsRead(notif.id)}
                      >
                        Mark as Read
                      </Button>
                    )}
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedNotification(notif);
                          setDeleteDialogOpen(true);
                        }}
                        className="text-orange-600 hover:text-orange-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground">{notif.message}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(notif.createdAt).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this notification? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-orange-600 hover:bg-orange-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

