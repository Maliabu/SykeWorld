"use client";

import { useEffect, useState } from "react";
import { getAllRoomTypes, createRoomType, updateRoomType, deleteRoomType } from "@/lib/actions/bookings";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Users, DollarSign } from "lucide-react";

export default function RoomTypesPage() {
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", description: "", basePrice: "", maxGuests: 2 });

  useEffect(() => {
    loadRoomTypes();
  }, []);

  const loadRoomTypes = async () => {
    setLoading(true);
    const result = await getAllRoomTypes();
    if (result.success) {
      setRoomTypes(result.roomTypes || []);
    } else {
      toast.error(result.error || "Failed to load room types");
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = editingType
      ? await updateRoomType(editingType.id, formData)
      : await createRoomType(formData);

    if (result.success) {
      toast.success(editingType ? "Room type updated" : "Room type created");
      setIsDialogOpen(false);
      setEditingType(null);
      setFormData({ name: "", description: "", basePrice: "", maxGuests: 2 });
      loadRoomTypes();
    } else {
      toast.error(result.error || "Failed to save room type");
    }
  };

  const handleEdit = (type: any) => {
    setEditingType(type);
    setFormData({
      name: type.name || "",
      description: type.description || "",
      basePrice: type.basePrice || "",
      maxGuests: type.maxGuests || 2,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (typeId: string) => {
    if (!confirm("Are you sure you want to delete this room type?")) return;

    const result = await deleteRoomType(typeId);
    if (result.success) {
      toast.success("Room type deleted");
      loadRoomTypes();
    } else {
      toast.error(result.error || "Failed to delete room type");
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Loading room types...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Room Types</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage room categories and pricing</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingType(null);
            setFormData({ name: "", description: "", basePrice: "", maxGuests: 2 });
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Room Type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingType ? "Edit Room Type" : "Add New Room Type"}</DialogTitle>
              <DialogDescription>
                {editingType ? "Update room type details" : "Create a new room type"}
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
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="basePrice">Base Price (UGX)</Label>
                    <Input
                      id="basePrice"
                      type="number"
                      value={formData.basePrice}
                      onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxGuests">Max Guests</Label>
                    <Input
                      id="maxGuests"
                      type="number"
                      min="1"
                      value={formData.maxGuests}
                      onChange={(e) => setFormData({ ...formData, maxGuests: parseInt(e.target.value) || 2 })}
                      required
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">{editingType ? "Update" : "Create"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {roomTypes.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center text-gray-500">
              No room types found
            </CardContent>
          </Card>
        ) : (
          roomTypes.map((type, index) => (
            <Card key={type.id || `type-${index}`} className="overflow-hidden border-gray-200 dark:border-gray-800">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{type.name}</CardTitle>
                    {type.description && (
                      <CardDescription className="mt-2">{type.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(type)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-orange-600 hover:text-orange-700"
                      onClick={() => handleDelete(type.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <span className="font-semibold text-lg">UGX {Number(type.basePrice).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span>{type.maxGuests} guests</span>
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

