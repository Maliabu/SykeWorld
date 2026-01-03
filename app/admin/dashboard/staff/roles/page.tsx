"use client";

import { useEffect, useState } from "react";
import { getAllRoles, createRole, updateRole, deleteRole } from "@/lib/actions/staff";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, GraduationCap, Shield, Trash2, Settings, Key } from "lucide-react";
import Link from "next/link";
import { getAllPermissionDefinitions, getRolePermissions, grantRolePermission, revokeRolePermission } from "@/lib/actions/permissions";
import { Checkbox } from "@/components/ui/checkbox";

export default function RolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    setLoading(true);
    const result = await getAllRoles();
    if (result.success) {
      setRoles(result.roles || []);
    } else {
      toast.error(result.error || "Failed to load roles");
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await createRole(formData);
    if (result.success) {
      toast.success("Role created successfully!");
      setIsDialogOpen(false);
      setFormData({ name: "", description: "" });
      loadRoles();
    } else {
      toast.error(result.error || "Failed to create role");
    }
  };

  const handleOpenPermissions = async (role: any) => {
    setSelectedRole(role);
    setIsPermissionsDialogOpen(true);
    setLoadingPermissions(true);
    
    try {
      const [permsResult, rolePermsResult] = await Promise.all([
        getAllPermissionDefinitions(),
        getRolePermissions(role.id),
      ]);
      
      if (permsResult.success) {
        setPermissions(permsResult.permissions || []);
      }
      
      if (rolePermsResult.success) {
        setRolePermissions((rolePermsResult.permissions || []).map((p: any) => p.permission.id));
      }
    } catch (error) {
      toast.error("Failed to load permissions");
    } finally {
      setLoadingPermissions(false);
    }
  };

  const handleTogglePermission = async (permissionId: string, checked: boolean) => {
    if (!selectedRole) return;
    
    try {
      if (checked) {
        const result = await grantRolePermission(selectedRole.id, permissionId);
        if (result.success) {
          setRolePermissions([...rolePermissions, permissionId]);
          toast.success("Permission granted");
        } else {
          toast.error(result.error || "Failed to grant permission");
        }
      } else {
        const result = await revokeRolePermission(selectedRole.id, permissionId);
        if (result.success) {
          setRolePermissions(rolePermissions.filter(id => id !== permissionId));
          toast.success("Permission revoked");
        } else {
          toast.error(result.error || "Failed to revoke permission");
        }
      }
    } catch (error) {
      toast.error("Failed to update permission");
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Loading roles...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Staff Roles</h1>
        <div className="flex gap-2">
          <Link href="/admin/dashboard/permissions/setup">
            <Button variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50">
              <Key className="mr-2 h-4 w-4" />
              Setup Permissions
            </Button>
          </Link>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Add Role
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
              <DialogDescription>Add a new staff role to the system.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">Role Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Manager, Housekeeper, Receptionist"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the role's responsibilities..."
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white">
                  Create Role
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Roles</CardTitle>
          <CardDescription>Manage staff roles and permissions.</CardDescription>
        </CardHeader>
        <CardContent>
          {roles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No roles found. Create your first role.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {roles.map((role) => (
                <div
                  key={role.id || `role-${role.name}`}
                  className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground mb-1">{role.name}</h3>
                        {role.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {role.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenPermissions(role)}
                        className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          if (confirm(`Are you sure you want to delete "${role.name}"?`)) {
                            const result = await deleteRole(role.id);
                            if (result.success) {
                              toast.success("Role deleted successfully!");
                              loadRoles();
                            } else {
                              toast.error(result.error || "Failed to delete role");
                            }
                          }
                        }}
                        className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permissions Dialog */}
      <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Permissions: {selectedRole?.name}</DialogTitle>
            <DialogDescription>
              Assign permissions to this role. Staff members with this role will have access to the selected pages and features.
            </DialogDescription>
          </DialogHeader>
          
          {loadingPermissions ? (
            <div className="py-8 text-center text-muted-foreground">Loading permissions...</div>
          ) : (
            <div className="space-y-4 py-4">
              {permissions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No permissions defined. Create permission definitions first.
                </div>
              ) : (
                <div className="space-y-3">
                  {permissions.map((permission) => (
                    <div
                      key={permission.id}
                      className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    >
                      <Checkbox
                        id={`perm-${permission.id}`}
                        checked={rolePermissions.includes(permission.id)}
                        onCheckedChange={(checked) =>
                          handleTogglePermission(permission.id, checked as boolean)
                        }
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor={`perm-${permission.id}`}
                          className="font-medium cursor-pointer"
                        >
                          {permission.displayName}
                        </Label>
                        {permission.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {permission.description}
                          </p>
                        )}
                        {permission.pagePath && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Path: {permission.pagePath}
                          </p>
                        )}
                        {permission.category && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            {permission.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsPermissionsDialogOpen(false);
                setSelectedRole(null);
                setRolePermissions([]);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

