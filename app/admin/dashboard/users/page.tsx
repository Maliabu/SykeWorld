"use client";

import { useEffect, useState, useMemo } from "react";
import { getAllUsers, createUser, updateUser, deleteUser } from "@/lib/actions/users";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, User, Mail, Phone, Shield, UserCheck, Search } from "lucide-react";

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "N/A";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "N/A";
  }
};

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    userType: "guest" as "guest" | "staff",
    phone: "",
    isStaff: false,
    isSuperuser: false,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const result = await getAllUsers();
    if (result.success) {
      setUsers(result.users || []);
    } else {
      toast.error(result.error || "Failed to load users");
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = editingUser
      ? await updateUser({ ...formData, id: editingUser.id })
      : await createUser(formData);

    if (result.success) {
      toast.success(editingUser ? "User updated" : "User created");
      setIsDialogOpen(false);
      setEditingUser(null);
      setFormData({
        email: "",
        username: "",
        password: "",
        firstName: "",
        lastName: "",
        userType: "guest",
        phone: "",
        isStaff: false,
        isSuperuser: false,
      });
      loadUsers();
    } else {
      toast.error(result.error || "Failed to save user");
    }
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      email: user.email || "",
      username: user.username || "",
      password: "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      userType: user.userType || "guest",
      phone: user.phone || "",
      isStaff: user.isStaff || false,
      isSuperuser: user.isSuperuser || false,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    const result = await deleteUser(userId);
    if (result.success) {
      toast.success("User deleted");
      loadUsers();
    } else {
      toast.error(result.error || "Failed to delete user");
    }
  };

  // Filter users based on search
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const term = searchTerm.toLowerCase();
    return users.filter(
      (u) =>
        u.email?.toLowerCase().includes(term) ||
        u.username?.toLowerCase().includes(term) ||
        u.firstName?.toLowerCase().includes(term) ||
        u.lastName?.toLowerCase().includes(term) ||
        u.phone?.toLowerCase().includes(term) ||
        u.userType?.toLowerCase().includes(term) ||
        u.id?.toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Users</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage system users</p>
        </div>
        <div className="flex gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingUser(null);
            setFormData({
              email: "",
              username: "",
              password: "",
              firstName: "",
              lastName: "",
              userType: "guest",
              phone: "",
              isStaff: false,
              isSuperuser: false,
            });
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
              <DialogDescription>
                {editingUser ? "Update user details" : "Create a new user account"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="username">Username *</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      required
                    />
                  </div>
                </div>
                {!editingUser && (
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={!editingUser}
                    />
                  </div>
                )}
                {editingUser && (
                  <div>
                    <Label htmlFor="password">New Password (leave empty to keep current)</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="userType">User Type</Label>
                  <Select
                    value={formData.userType}
                    onValueChange={(value: "guest" | "staff") => setFormData({ ...formData, userType: value })}
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
                <div className="flex gap-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isStaff"
                      checked={formData.isStaff}
                      onChange={(e) => setFormData({ ...formData, isStaff: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="isStaff">Is Staff</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isSuperuser"
                      checked={formData.isSuperuser}
                      onChange={(e) => setFormData({ ...formData, isSuperuser: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="isSuperuser">Is Admin</Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">{editingUser ? "Update" : "Create"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="grid gap-2">
        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              {searchTerm ? "No users match your search" : "No users found"}
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((user) => (
            <Card key={user.id} className="overflow-hidden border-gray-200 dark:border-gray-800">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                      {user.profilePicture && user.profilePicture !== "default.jpg" ? (
                        <img
                          src={user.profilePicture}
                          alt={user.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                          <User className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {user.firstName && user.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : user.username}
                      </CardTitle>
                      <CardDescription className="mt-1 flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </span>
                        {user.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {user.phone}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {user.isSuperuser && (
                      <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        <Shield className="w-3 h-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                    {user.isStaff && !user.isSuperuser && (
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        <UserCheck className="w-3 h-3 mr-1" />
                        Staff
                      </Badge>
                    )}
                    {user.userType === "guest" && (
                      <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                        Guest
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(user)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-orange-600 hover:text-orange-700"
                      onClick={() => handleDelete(user.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-sm">
                  <div>
                    <div className="font-medium text-gray-500">Joined</div>
                    <div className="text-gray-900 dark:text-white">{formatDate(user.dateJoined)}</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-500">Last Login</div>
                    <div className="text-gray-900 dark:text-white">{formatDate(user.lastLogin)}</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-500">Status</div>
                    <div className="text-gray-900 dark:text-white">
                      {user.isActive && !user.isDisabled ? "Active" : "Inactive"}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-500">Verified</div>
                    <div className="text-gray-900 dark:text-white">
                      {user.isVerified ? "Yes" : "No"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

