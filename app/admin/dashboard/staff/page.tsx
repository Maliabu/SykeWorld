"use client";

import { useEffect, useState } from "react";
import { getAllStaff, createStaff } from "@/lib/actions/staff";
import { getAllUsers } from "@/lib/actions/users";
import { getAllRoles } from "@/lib/actions/staff";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, UserCheck2, Shield, Calendar, Edit } from "lucide-react";
import { updateStaff } from "@/lib/actions/staff";

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "N/A";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "N/A";
  }
};

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [formData, setFormData] = useState({
    userId: "",
    roleId: "",
  });
  const [editFormData, setEditFormData] = useState({
    roleId: "",
    active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [staffResult, usersResult, rolesResult] = await Promise.all([
        getAllStaff(),
        getAllUsers(),
        getAllRoles(),
      ]);

      console.log("Staff page: Results:", {
        staff: staffResult,
        users: usersResult.success ? `${usersResult.users?.length || 0} users` : usersResult.error,
        roles: rolesResult.success ? `${rolesResult.roles?.length || 0} roles` : rolesResult.error,
      });

      if (staffResult.success) {
        const staffList = staffResult.staff || [];
        console.log("Staff page: Loaded", staffList.length, "staff members");
        console.log("Staff page: Staff data:", staffList);
        setStaff(staffList);
        if (staffList.length === 0) {
          console.warn("Staff page: No staff members found, but query was successful");
          // Check if there are users with isStaff = true
          if (usersResult.success && usersResult.users) {
            const staffUsers = usersResult.users.filter((u: any) => u.isStaff || u.userType === "staff");
            console.log("Staff page: Found", staffUsers.length, "users with isStaff=true or userType=staff");
            if (staffUsers.length > 0) {
              console.log("Staff page: These users need staff profiles created:", staffUsers.map((u: any) => ({
                id: u.id,
                email: u.email,
                name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username,
              })));
            }
          }
        }
      } else {
        console.error("Staff page: Failed to load staff:", staffResult.error);
        toast.error(staffResult.error || "Failed to load staff");
        setStaff([]);
      }

      if (usersResult.success) {
        setUsers(usersResult.users || []);
      } else {
        toast.error(usersResult.error || "Failed to load users");
      }

      if (rolesResult.success) {
        setRoles(rolesResult.roles || []);
      } else {
        toast.error(rolesResult.error || "Failed to load roles");
      }
    } catch (error: any) {
      console.error("Staff page: Error loading data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await createStaff(formData);
    if (result.success) {
      toast.success("Staff member created successfully!");
      setIsDialogOpen(false);
      setFormData({ userId: "", roleId: "" });
      loadData();
    } else {
      toast.error(result.error || "Failed to create staff member");
    }
  };

  const handleEdit = (member: any) => {
    setEditingStaff(member);
    setEditFormData({
      roleId: member.role?.id || "",
      active: member.active !== false,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    // If staff doesn't have a profile (id starts with "user-"), create one
    if (editingStaff.id?.startsWith("user-")) {
      const result = await createStaff({
        userId: editingStaff.userId,
        roleId: editFormData.roleId,
      });
      if (result.success) {
        toast.success("Staff profile created and role assigned!");
        setIsEditDialogOpen(false);
        setEditingStaff(null);
        loadData();
      } else {
        toast.error(result.error || "Failed to create staff profile");
      }
    } else {
      // Update existing staff profile
      const result = await updateStaff(editingStaff.id, {
        roleId: editFormData.roleId,
        active: editFormData.active,
      });
      if (result.success) {
        toast.success("Staff member updated successfully!");
        setIsEditDialogOpen(false);
        setEditingStaff(null);
        loadData();
      } else {
        toast.error(result.error || "Failed to update staff member");
      }
    }
  };

  const getUserById = (userId: string) => {
    return users.find((u) => u.id === userId);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Loading staff...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Staff Management</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Add Staff Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Staff Member</DialogTitle>
              <DialogDescription>Assign a user to a staff role.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="userId">User</Label>
                  <Select
                    value={formData.userId}
                    onValueChange={(value) => setFormData({ ...formData, userId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users
                        .filter((u) => !staff.some((s) => s.userId === u.id))
                        .map((user) => (
                          <SelectItem key={user.id || `user-${user.email}`} value={user.id}>
                            {user.firstName && user.lastName
                              ? `${user.firstName} ${user.lastName}`
                              : user.username || user.email}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="roleId">Role</Label>
                  <Select
                    value={formData.roleId}
                    onValueChange={(value) => setFormData({ ...formData, roleId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id || `role-${role.name}`} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white">
                  Create
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Staff Members</CardTitle>
          <CardDescription>Manage staff members and their roles.</CardDescription>
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No staff members found.</div>
          ) : (
            <div className="space-y-4">
              {staff.map((member) => {
                const user = getUserById(member.userId) || member.user;
                return (
                  <div
                    key={member.id || `staff-${member.userId}`}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                        <UserCheck2 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">
                          {user
                            ? user.firstName && user.lastName
                              ? `${user.firstName} ${user.lastName}`
                              : user.username || user.email
                            : member.userId 
                              ? `User ID: ${member.userId.slice(0, 8)}...`
                              : "Unknown User"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user?.email || (member.userId ? `User ID: ${member.userId}` : "No email")}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                        {member.role?.name || "No Role"}
                      </Badge>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {member.hiredDate ? formatDate(member.hiredDate) : (member.user?.dateJoined ? formatDate(member.user.dateJoined) : "N/A")}
                      </div>
                      <Badge variant={member.active ? "default" : "secondary"}>
                        {member.active ? "Active" : "Inactive"}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(member)}
                        className="h-8"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Staff Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>
              {editingStaff?.user 
                ? `Update role for ${editingStaff.user.firstName && editingStaff.user.lastName
                    ? `${editingStaff.user.firstName} ${editingStaff.user.lastName}`
                    : editingStaff.user.username || editingStaff.user.email}`
                : "Update staff member role"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate}>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="editRoleId">Role *</Label>
                <Select
                  value={editFormData.roleId}
                  onValueChange={(value) => setEditFormData({ ...editFormData, roleId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id || `role-${role.name}`} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!editFormData.roleId && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {editingStaff?.id?.startsWith("user-") 
                      ? "This user doesn't have a staff profile yet. Assigning a role will create one."
                      : "Select a role for this staff member"}
                  </p>
                )}
              </div>
              {editingStaff && !editingStaff.id?.startsWith("user-") && (
                <div>
                  <Label htmlFor="editActive">Status</Label>
                  <Select
                    value={editFormData.active ? "active" : "inactive"}
                    onValueChange={(value) => setEditFormData({ ...editFormData, active: value === "active" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setIsEditDialogOpen(false);
                setEditingStaff(null);
              }}>
                Cancel
              </Button>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white" disabled={!editFormData.roleId}>
                {editingStaff?.id?.startsWith("user-") ? "Create Profile & Assign Role" : "Update"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

