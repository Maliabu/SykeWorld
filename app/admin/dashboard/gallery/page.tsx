"use client";

import { useState, useEffect } from "react";
import { getAllGalleryCategories, getGalleryImages, createGalleryCategory, addGalleryImage, deleteGalleryImage } from "@/lib/actions/bookings";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Trash2, Image as ImageIcon, X } from "lucide-react";

export default function AdminGalleryPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageCaption, setNewImageCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [fileSizeError, setFileSizeError] = useState<string | null>(null);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [categoriesResult, imagesResult] = await Promise.all([
      getAllGalleryCategories(),
      getGalleryImages(),
    ]);

    if (categoriesResult.success) {
      setCategories(categoriesResult.categories || []);
    }
    if (imagesResult.success) {
      setImages(imagesResult.images || []);
    }
    setLoading(false);
  };

  const handleAddCategory = async () => {
    if (!newCategoryName) {
      toast.error("Category name is required");
      return;
    }

    const result = await createGalleryCategory({
      name: newCategoryName,
      description: newCategoryDescription,
    });

    if (result.success) {
      toast.success("Category created");
      setShowCategoryModal(false);
      setNewCategoryName("");
      setNewCategoryDescription("");
      loadData();
    } else {
      toast.error(result.error || "Failed to create category");
    }
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setFileSizeError(null);
    const newFiles = Array.from(files);
    const maxSize = 50 * 1024 * 1024; // 50 MB in bytes
    
    // Check file sizes
    const oversizedFiles = newFiles.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      const fileNames = oversizedFiles.map(f => f.name).join(", ");
      const fileSize = (oversizedFiles[0].size / (1024 * 1024)).toFixed(2);
      setFileSizeError(`File size limit exceeded! "${fileNames}" (${fileSize} MB) exceeds the 50 MB limit.`);
      toast.error(`File size limit exceeded! Maximum file size is 50 MB.`);
      return;
    }
    
    setUploading(true);
    const newUrls: string[] = [];

    try {
      for (const file of newFiles) {
        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("category", "gallery");
          
          console.log('Uploading gallery image:', file.name, 'Size:', file.size);
          
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
            console.log('Upload successful, URL:', url);
            newUrls.push(url);
          } else {
            throw new Error("No file URL returned");
          }
        } catch (error: any) {
          console.error('Failed to upload file:', file.name, error);
          toast.error(`Failed to upload ${file.name}: ${error.message}`);
        }
      }

      if (newUrls.length > 0) {
        setImageUrls([...imageUrls, ...newUrls]);
        setImageFiles([...imageFiles, ...newFiles]);
        toast.success(`${newUrls.length} image(s) uploaded successfully`);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to upload images");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
    setImageFiles(imageFiles.filter((_, i) => i !== index));
  };

  const handleAddImage = async () => {
    if (imageUrls.length === 0 || !selectedCategory) {
      toast.error("Please upload at least one image and select a category");
      return;
    }

    setUploading(true);
    try {
      // Save all images to the same category - process sequentially to avoid race conditions
      const results: any[] = [];
      const errors: string[] = [];

      for (let i = 0; i < imageUrls.length; i++) {
        try {
          const result = await addGalleryImage({
            categoryId: selectedCategory,
            image: imageUrls[i],
            caption: newImageCaption,
          });

          if (result.success) {
            results.push({ success: true, index: i });
          } else {
            errors.push(`Image ${i + 1}: ${result.error || "Failed to save"}`);
            console.error(`Failed to save image ${i + 1}:`, result.error);
          }
        } catch (error: any) {
          errors.push(`Image ${i + 1}: ${error.message || "Unknown error"}`);
          console.error(`Error saving image ${i + 1}:`, error);
        }
      }

      // Show results
      if (errors.length > 0) {
        const errorMessage = errors.length === 1 
          ? errors[0] 
          : `${errors.length} images failed: ${errors.slice(0, 2).join(", ")}${errors.length > 2 ? "..." : ""}`;
        toast.error(errorMessage, { duration: 6000 });
      }

      if (results.length > 0) {
        toast.success(`${results.length} image(s) added successfully`);
        // Close and reset if all images were successful
        if (errors.length === 0) {
          setShowImageModal(false);
          setImageFiles([]);
          setImageUrls([]);
          setNewImageCaption("");
          setSelectedCategory("");
          setFileSizeError(null);
        } else {
          // Remove successfully saved images from preview
          const successfulIndices = new Set(results.map(r => r.index));
          setImageUrls(imageUrls.filter((_, i) => !successfulIndices.has(i)));
          setImageFiles(imageFiles.filter((_, i) => !successfulIndices.has(i)));
        }
        loadData(); // Reload to show saved images
      } else {
        toast.error("All images failed to save. Please check the console for details.");
      }
    } catch (error: any) {
      console.error("Error saving images:", error);
      toast.error(error.message || "Failed to add images");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteClick = (imageId: string) => {
    setImageToDelete(imageId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteImage = async () => {
    if (!imageToDelete) return;

    const result = await deleteGalleryImage(imageToDelete);
    if (result.success) {
      toast.success("Image deleted");
      setIsDeleteDialogOpen(false);
      setImageToDelete(null);
      loadData();
    } else {
      toast.error(result.error || "Failed to delete image");
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Loading gallery...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Gallery</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage gallery categories and images</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Category</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newCategoryDescription}
                    onChange={(e) => setNewCategoryDescription(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddCategory}>Save Category</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showImageModal} onOpenChange={(open) => {
            setShowImageModal(open);
            if (!open) {
              setFileSizeError(null);
              setImageFiles([]);
              setImageUrls([]);
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <ImageIcon className="w-4 h-4 mr-2" />
                Add Image
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Image</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Category</Label>
                  <Select onValueChange={setSelectedCategory} value={selectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat: any, index: number) => (
                        <SelectItem key={cat?.id ? String(cat.id) : `cat-${index}`} value={cat?.id ? String(cat.id) : ""}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Image Files</Label>
                  <div className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
                    fileSizeError 
                      ? "border-red-500 dark:border-red-500 bg-red-50 dark:bg-red-950/20" 
                      : "border-gray-300 dark:border-gray-700"
                  }`}>
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <ImageIcon className={`w-12 h-12 ${fileSizeError ? "text-red-500" : "text-gray-400"}`} />
                      <div className="text-center">
                        <label htmlFor="image-upload" className="cursor-pointer">
                          <span className={`text-sm ${fileSizeError ? "text-red-700 dark:text-red-300" : "text-gray-600 dark:text-gray-400"}`}>
                            Click to upload or drag and drop
                          </span>
                          <Input
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleImageUpload(e.target.files)}
                            className="hidden"
                            disabled={uploading}
                          />
                        </label>
                        <p className={`text-xs mt-1 ${
                          fileSizeError 
                            ? "text-red-600 dark:text-red-400 font-medium" 
                            : "text-orange-600 dark:text-orange-400"
                        }`}>
                          {fileSizeError ? (
                            <span className="font-semibold">{fileSizeError}</span>
                          ) : (
                            <>PNG, JPG, GIF up to <span className="font-semibold">50 MB</span> per file</>
                          )}
                        </p>
                      </div>
                      {uploading && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">Uploading...</p>
                      )}
                    </div>
                  </div>

                  {/* Preview Images */}
                  {imageUrls.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 mt-4">
                      {imageUrls.map((url, index) => (
                        <div key={`preview-${index}-${url.substring(0, 20)}`} className="relative group">
                          <div className="aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                            <img
                              src={url}
                              alt={`Gallery image ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Prevent infinite loop - use data URI placeholder
                                if (!e.currentTarget.src.includes('data:image')) {
                                  e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23e5e7eb' width='400' height='300'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='18' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";
                                }
                              }}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <Label>Caption</Label>
                  <Input
                    value={newImageCaption}
                    onChange={(e) => setNewImageCaption(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddImage} disabled={uploading}>
                  {uploading ? "Uploading..." : "Save Image"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsDeleteDialogOpen(false);
          setImageToDelete(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Image?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this image? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteImage} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Display gallery */}
      {categories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500 dark:text-gray-400">
            No categories found. Create one to get started.
          </CardContent>
        </Card>
      ) : (
        categories.map((cat: any, catIndex: number) => {
          const categoryImages = images.filter((img: any) => img.category?.id === cat.id);
          return (
            <Card key={cat?.id ? String(cat.id) : `category-${catIndex}`} className="overflow-hidden border-gray-200 dark:border-gray-800">
              <CardHeader>
                <CardTitle className="text-xl">{cat.name}</CardTitle>
                {cat.description && (
                  <CardDescription>{cat.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {categoryImages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">No images in this category</div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {categoryImages
                      .filter((img: any) => img.image && img.image.trim() !== "")
                      .map((img: any, imgIndex: number) => {
                        const isValidUrl = img.image && (
                          img.image.startsWith("http://") ||
                          img.image.startsWith("https://") ||
                          img.image.startsWith("/")
                        );
                        
                        return (
                          <div key={img?.id ? String(img.id) : `image-${catIndex}-${imgIndex}`} className="relative group">
                            <div className="aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                              {isValidUrl ? (
                                <img
                                  src={img.image}
                                  alt={img.caption || ""}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    // Prevent infinite loop - use data URI placeholder
                                    if (!e.currentTarget.src.includes('data:image')) {
                                      e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23e5e7eb' width='400' height='300'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='18' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";
                                    }
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                  <ImageIcon className="w-8 h-8 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                              onClick={() => handleDeleteClick(img.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            {img.caption && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 truncate">
                                {img.caption}
                              </p>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
