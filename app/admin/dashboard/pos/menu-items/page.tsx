"use client";

import { useEffect, useState } from "react";
import { getAllMenuItems, getAllMenuCategories, createMenuItem, updateMenuItem, deleteMenuItem, createMenuCategory } from "@/lib/actions/pos";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Upload, X } from "lucide-react";

export default function MenuItemsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);
  const [newCategoryData, setNewCategoryData] = useState({
    name: "",
    description: "",
    displayOrder: 0,
  });
  const [formData, setFormData] = useState({
    categoryId: "",
    name: "",
    localName: "",
    description: "",
    price: "",
    displayOrder: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [itemsResult, categoriesResult] = await Promise.all([
      getAllMenuItems(),
      getAllMenuCategories(),
    ]);
    if (itemsResult.success) {
      setItems(itemsResult.items || []);
    }
    if (categoriesResult.success) {
      setCategories(categoriesResult.categories || []);
    }
    setLoading(false);
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", "menu");
      
      // Call API route directly instead of server action to avoid body size limit
      const response = await fetch("/api/server", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(error.error || "Failed to upload image");
      }
      
      const result = await response.json();
      const url = result.fileUrl;
      
      if (url && typeof url === "string") {
        setImageUrl(url);
        toast.success("Image uploaded");
      } else {
        throw new Error("No file URL returned");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (imageFile && !imageUrl) {
      await handleImageUpload(imageFile);
      return;
    }

    const result = editingItem
      ? await updateMenuItem({ ...formData, id: editingItem.id, image: imageUrl })
      : await createMenuItem({ ...formData, image: imageUrl });

    if (result.success) {
      toast.success(editingItem ? "Item updated" : "Item created");
      setIsDialogOpen(false);
      resetForm();
      loadData();
    } else {
      toast.error(result.error || "Failed to save item");
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteMenuItem(id);
    if (result.success) {
      toast.success("Item deleted");
      loadData();
    } else {
      toast.error(result.error || "Failed to delete item");
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      categoryId: item.categoryId || "",
      name: item.name || "",
      localName: item.localName || "",
      description: item.description || "",
      price: item.price || "",
      displayOrder: item.displayOrder || 0,
    });
    setImageUrl(item.image || "");
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      categoryId: "",
      name: "",
      localName: "",
      description: "",
      price: "",
      displayOrder: 0,
    });
    setImageFile(null);
    setImageUrl("");
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await createMenuCategory(newCategoryData);
    if (result.success) {
      toast.success("Category created");
      setIsAddCategoryDialogOpen(false);
      setNewCategoryData({ name: "", description: "", displayOrder: 0 });
      // Reload categories
      const categoriesResult = await getAllMenuCategories();
      if (categoriesResult.success) {
        setCategories(categoriesResult.categories || []);
        // Auto-select the newly created category
        if (result.category) {
          setFormData({ ...formData, categoryId: result.category.id });
        }
      }
    } else {
      toast.error(result.error || "Failed to create category");
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Menu Items</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage menu items</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit" : "Add"} Menu Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label>Category *</Label>
                  <Dialog open={isAddCategoryDialogOpen} onOpenChange={setIsAddCategoryDialogOpen}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="sm" className="h-7">
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Category</DialogTitle>
                        <DialogDescription>Create a new menu category</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleAddCategory} className="space-y-4">
                        <div>
                          <Label>Name *</Label>
                          <Input
                            value={newCategoryData.name}
                            onChange={(e) => setNewCategoryData({ ...newCategoryData, name: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={newCategoryData.description}
                            onChange={(e) => setNewCategoryData({ ...newCategoryData, description: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Display Order</Label>
                          <Input
                            type="number"
                            value={newCategoryData.displayOrder}
                            onChange={(e) => setNewCategoryData({ ...newCategoryData, displayOrder: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => setIsAddCategoryDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit">Create</Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
                <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Name *</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div>
                <Label>Local Name (Optional)</Label>
                <Input value={formData.localName} onChange={(e) => setFormData({ ...formData, localName: e.target.value })} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div>
                <Label>Price *</Label>
                <Input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
              </div>
              <div>
                <Label>Image</Label>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImageFile(file);
                        handleImageUpload(file);
                      }
                    }}
                    disabled={uploading}
                  />
                  {imageUrl && (
                    <div className="relative w-20 h-20">
                      <img src={imageUrl} alt="Preview" className="w-full h-full object-cover rounded" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute -top-2 -right-2"
                        onClick={() => {
                          setImageUrl("");
                          setImageFile(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <Label>Display Order</Label>
                <Input type="number" value={formData.displayOrder} onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={uploading}>
                  {editingItem ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {items.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{item.name}</CardTitle>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Item?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(item.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {item.image && (
                <div className="relative w-full h-48 mb-4">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded" onError={(e) => {
                    // Prevent infinite loop - use data URI placeholder
                    if (!e.currentTarget.src.includes('data:image')) {
                      e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23e5e7eb' width='400' height='300'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='18' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";
                    }
                  }} />
                </div>
              )}
              <p className="text-lg font-bold text-orange-600">UGX {parseFloat(item.price || "0").toLocaleString()}</p>
              {item.localName && <p className="text-sm text-gray-600 dark:text-gray-400">{item.localName}</p>}
              {item.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{item.description}</p>}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Category: {item.category?.name}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

