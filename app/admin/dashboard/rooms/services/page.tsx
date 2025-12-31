"use client";

import { useEffect, useState } from "react";
import { getAllServices, createRoomService, updateRoomService, deleteRoomService } from "@/lib/actions/bookings";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", description: "", icon: "" });

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setLoading(true);
    const result = await getAllServices();
    if (result.success) {
      setServices(result.services || []);
    } else {
      toast.error(result.error || "Failed to load services");
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = editingService
      ? await updateRoomService(editingService.id, formData)
      : await createRoomService(formData);

    if (result.success) {
      toast.success(editingService ? "Service updated" : "Service created");
      setIsDialogOpen(false);
      setEditingService(null);
      setFormData({ name: "", description: "", icon: "" });
      loadServices();
    } else {
      toast.error(result.error || "Failed to save service");
    }
  };

  const handleEdit = (service: any) => {
    setEditingService(service);
    setFormData({
      name: service.name || "",
      description: service.description || "",
      icon: service.icon || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;

    const result = await deleteRoomService(serviceId);
    if (result.success) {
      toast.success("Service deleted");
      loadServices();
    } else {
      toast.error(result.error || "Failed to delete service");
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Loading services...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Room Services</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage room amenities and services</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingService(null);
            setFormData({ name: "", description: "", icon: "" });
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingService ? "Edit Service" : "Add New Service"}</DialogTitle>
              <DialogDescription>
                {editingService ? "Update service details" : "Create a new room service"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="icon">Icon (URL or emoji)</Label>
                  <Input
                    id="icon"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="e.g., 🛁 or https://..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">{editingService ? "Update" : "Create"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center text-gray-500">
              No services found
            </CardContent>
          </Card>
        ) : (
          services.map((service, index) => (
            <Card key={service.id || `service-${index}`} className="overflow-hidden border-gray-200 dark:border-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(service)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(service.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  const getInitials = (name: string) => {
                    return name
                      .split(" ")
                      .map((word) => word[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2);
                  };

                  // Check if icon is a valid URL (starts with http:// or https://)
                  const isValidImageUrl = service.icon && (
                    service.icon.startsWith("http://") || 
                    service.icon.startsWith("https://") ||
                    service.icon.startsWith("/")
                  );

                  // Check if icon is an emoji (single character or short string)
                  const isEmoji = service.icon && service.icon.length <= 2 && /[\u{1F300}-\u{1F9FF}]/u.test(service.icon);

                  let iconElement;
                  if (isValidImageUrl) {
                    iconElement = (
                      <div className="relative w-full h-48 mb-4">
                        <img
                          src={service.icon}
                          alt={service.name}
                          className="w-full h-full object-cover rounded"
                          onError={(e) => {
                            if (!e.currentTarget.src.includes('data:image')) {
                              e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23e5e7eb' width='400' height='300'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='18' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";
                            }
                          }}
                        />
                      </div>
                    );
                  } else if (isEmoji) {
                    iconElement = (
                      <div className="relative w-full h-48 mb-4 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded">
                        <div className="text-6xl">{service.icon}</div>
                      </div>
                    );
                  } else {
                    iconElement = (
                      <div className="relative w-full h-48 mb-4 flex items-center justify-center bg-orange-500 rounded">
                        <Avatar className="h-24 w-24 bg-orange-500">
                          <AvatarFallback className="bg-orange-500 text-white font-semibold text-3xl">
                            {getInitials(service.name)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    );
                  }

                  return (
                    <>
                      {iconElement}
                      {service.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{service.description}</p>
                      )}
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

