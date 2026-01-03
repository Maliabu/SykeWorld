"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { 
  createRoom, 
  getAllRoomTypes, 
  addRoomImage, 
  createRoomType,
  getAllServices,
  createRoomService,
  getRoomTypeServices,
  addServiceToRoomType,
  removeServiceFromRoomType
} from "@/lib/actions/bookings";
import { uploadServerFile } from "@/server/fetch.actions";
import { createRoomSchema } from "@/lib/validations/bookings";
import { toast } from "sonner";
import { X, Upload, Image as ImageIcon, Plus, Check, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function AddRoom() {
  const [roomTypes, setRoomTypes] = React.useState<any[]>([]);
  const [allServices, setAllServices] = React.useState<any[]>([]);
  const [selectedRoomTypeServices, setSelectedRoomTypeServices] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [uploadingImages, setUploadingImages] = React.useState(false);
  const [togglingService, setTogglingService] = React.useState<string | null>(null);
  const [imageFiles, setImageFiles] = React.useState<File[]>([]);
  const [imageUrls, setImageUrls] = React.useState<string[]>([]);
  const [fileSizeError, setFileSizeError] = React.useState<string | null>(null);
  const [isAddRoomTypeDialogOpen, setIsAddRoomTypeDialogOpen] = React.useState(false);
  const [isAddServiceDialogOpen, setIsAddServiceDialogOpen] = React.useState(false);
  const [newRoomTypeData, setNewRoomTypeData] = React.useState({
    name: "",
    description: "",
    basePrice: "",
    maxGuests: 1,
  });
  const [newServiceData, setNewServiceData] = React.useState({
    name: "",
    description: "",
    icon: "",
  });

  const form = useForm<z.infer<typeof createRoomSchema>>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      roomNumber: "",
      floor: 1,
      status: "available",
      roomTypeId: "",
    },
  });

  const loadRoomTypes = async () => {
    const result = await getAllRoomTypes();
    if (result.success && result.roomTypes) {
      setRoomTypes(result.roomTypes);
    }
  };

  const loadServices = async () => {
    const result = await getAllServices();
    if (result.success && result.services) {
      setAllServices(result.services || []);
    }
  };

  const loadRoomTypeServices = async (roomTypeId: string) => {
    const result = await getRoomTypeServices(roomTypeId);
    if (result.success && result.services) {
      setSelectedRoomTypeServices(result.services.map((s: any) => s.id));
    }
  };

  React.useEffect(() => {
    loadRoomTypes();
    loadServices();
  }, []);

  // Watch for room type changes to load its services
  const selectedRoomTypeId = form.watch("roomTypeId");
  
  React.useEffect(() => {
    if (selectedRoomTypeId) {
      loadRoomTypeServices(selectedRoomTypeId);
    } else {
      setSelectedRoomTypeServices([]);
    }
  }, [selectedRoomTypeId]);

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
    
    setUploadingImages(true);
    toast.loading(`Uploading ${newFiles.length} image(s) to cPanel...`, { id: 'upload-status' });
    const newUrls: string[] = [];
    const uploadedFiles: File[] = [];

    try {
      for (let i = 0; i < newFiles.length; i++) {
        const file = newFiles[i];
        try {
          toast.loading(`Uploading ${file.name} (${i + 1}/${newFiles.length})...`, { id: 'upload-status' });
          
          const formData = new FormData();
          formData.append("file", file);
          
          console.log('📤 Uploading file to cPanel:', file.name, 'Size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
          const url = await uploadServerFile(formData, "rooms"); // Uploads to cPanel via /api/server route
          
          if (url && typeof url === "string") {
            console.log('✅ Upload successful! File saved to cPanel:', url);
            // Verify URL is from cPanel (should contain your domain)
            if (!url.includes('http')) {
              console.warn('⚠️ Warning: URL does not appear to be a full URL:', url);
              toast.warning(`Uploaded ${file.name} but URL format may be incorrect: ${url}`, { id: 'upload-status' });
            }
            newUrls.push(url);
            uploadedFiles.push(file);
            toast.success(`✓ ${file.name} uploaded successfully`, { id: `upload-${i}` });
          } else {
            console.error('❌ Upload returned invalid URL:', url);
            throw new Error(`Failed to upload ${file.name}: No URL returned from cPanel`);
          }
        } catch (fileError: any) {
          console.error('Error uploading file:', file.name, fileError);
          toast.error(`Failed to upload ${file.name}: ${fileError.message || "Unknown error"}`, { id: `upload-${i}` });
          // Continue with other files instead of stopping
        }
      }
      
      // Update state with uploaded images
      if (newUrls.length > 0) {
        setImageFiles((prev) => [...prev, ...uploadedFiles]);
        setImageUrls((prev) => [...prev, ...newUrls]);
        toast.success(`✅ ${newUrls.length} of ${newFiles.length} image(s) uploaded successfully to cPanel!`, { id: 'upload-status' });
      } else {
        toast.error("❌ No images were uploaded. Please check the console for errors.", { id: 'upload-status' });
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error("Failed to upload images: " + (error.message || "Unknown error"), { id: 'upload-status' });
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddRoomType = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newRoomTypeData.name || !newRoomTypeData.basePrice) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const result = await createRoomType({
        name: newRoomTypeData.name,
        description: newRoomTypeData.description || "",
        basePrice: parseFloat(newRoomTypeData.basePrice),
        maxGuests: newRoomTypeData.maxGuests,
      });

      if (result.success) {
        toast.success("Room type created successfully!");
        setIsAddRoomTypeDialogOpen(false);
        setNewRoomTypeData({ name: "", description: "", basePrice: "", maxGuests: 1 });
        await loadRoomTypes();
      } else {
        toast.error(result.error || "Failed to create room type");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create room type");
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newServiceData.name) {
      toast.error("Service name is required");
      return;
    }

    try {
      const result = await createRoomService(newServiceData);
      if (result.success) {
        toast.success("Service created successfully!");
        setIsAddServiceDialogOpen(false);
        setNewServiceData({ name: "", description: "", icon: "" });
        await loadServices();
      } else {
        toast.error(result.error || "Failed to create service");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create service");
    }
  };

  const handleServiceToggle = async (serviceId: string, checked: boolean) => {
    if (!selectedRoomTypeId) {
      toast.error("Please select a room type first");
      return;
    }

    // Prevent multiple simultaneous toggles
    if (togglingService === serviceId) {
      return;
    }

    setTogglingService(serviceId);
    try {
      if (checked) {
        const result = await addServiceToRoomType(selectedRoomTypeId, serviceId);
        if (result.success) {
          setSelectedRoomTypeServices((prev) => {
            // Prevent duplicates
            if (prev.includes(serviceId)) return prev;
            return [...prev, serviceId];
          });
          toast.success("Service added to room type");
        } else {
          toast.error(result.error || "Failed to add service");
        }
      } else {
        const result = await removeServiceFromRoomType(selectedRoomTypeId, serviceId);
        if (result.success) {
          setSelectedRoomTypeServices((prev) => prev.filter((id) => id !== serviceId));
          toast.success("Service removed from room type");
        } else {
          toast.error(result.error || "Failed to remove service");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update service");
    } finally {
      setTogglingService(null);
    }
  };

  const onSubmit = async (values: z.infer<typeof createRoomSchema>) => {
    if (!values.roomTypeId) {
      toast.error("Please select a room type");
      return;
    }

    setLoading(true);
    try {
      const result = await createRoom(values);
      if (result.error) {
        toast.error(result.error);
        setLoading(false);
        return;
      }

      if (!result.room?.id) {
        toast.error("Room created but no ID returned");
        setLoading(false);
        return;
      }

      const roomId = result.room.id;
      console.log("✅ Room created with ID:", roomId);

      // Save images to database after room creation
      if (imageUrls.length > 0) {
        console.log(`💾 Saving ${imageUrls.length} image(s) to database for room ${roomId}`);
        console.log("Image URLs to save:", imageUrls);
        
        toast.loading(`Saving ${imageUrls.length} image(s) to database...`, { id: 'save-images' });
        
        let savedCount = 0;
        let failedCount = 0;

        for (let i = 0; i < imageUrls.length; i++) {
          const url = imageUrls[i];
          try {
            console.log(`[${i + 1}/${imageUrls.length}] Saving image to DB:`, url);
            const imageResult = await addRoomImage(roomId, url);
            
            if (imageResult.success && imageResult.image) {
              savedCount++;
              console.log(`✅ Image ${i + 1} saved to DB with ID:`, imageResult.image.id);
            } else {
              failedCount++;
              console.error(`❌ Failed to save image ${i + 1}:`, imageResult.error);
              toast.error(`Image ${i + 1} failed: ${imageResult.error}`, { id: `img-${i}` });
            }
          } catch (error: any) {
            failedCount++;
            console.error(`❌ Exception saving image ${i + 1}:`, error);
            toast.error(`Image ${i + 1} error: ${error.message}`, { id: `img-${i}` });
          }
        }
        
        if (savedCount > 0) {
          toast.success(`✅ Saved ${savedCount} image(s) to database${failedCount > 0 ? ` (${failedCount} failed)` : ''}`, { id: 'save-images' });
        } else if (failedCount > 0) {
          toast.error(`❌ All ${failedCount} image(s) failed to save. Check console.`, { id: 'save-images' });
        }
      }

      toast.success("Room created successfully!");
      form.reset();
      setImageFiles([]);
      setImageUrls([]);
    } catch (err: any) {
      toast.error(err.message || "Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-12 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 mt-4">
      <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Add New Room</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <FormField
              control={form.control}
              name="roomNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Room Number</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., 101" 
                      {...field}
                      className="h-11"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="floor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Floor</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      className="h-11"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2 mb-2">
                    <FormLabel className="text-sm font-medium">Status</FormLabel>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline" size="sm" className="h-7">
                          <Plus className="h-3 w-3 mr-1" />
                          Info
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Room Status Options</DialogTitle>
                          <DialogDescription>Available room statuses and their meanings</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 py-4">
                          <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="font-semibold text-green-900 dark:text-green-200">Available</div>
                            <div className="text-sm text-green-700 dark:text-green-300 mt-1">Room is ready for booking</div>
                          </div>
                          <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                            <div className="font-semibold text-red-900 dark:text-red-200">Occupied</div>
                            <div className="text-sm text-red-700 dark:text-red-300 mt-1">Room is currently occupied by a guest</div>
                          </div>
                          <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
                            <div className="font-semibold text-yellow-900 dark:text-yellow-200">Cleaning</div>
                            <div className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">Room is being cleaned and prepared</div>
                          </div>
                          <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
                            <div className="font-semibold text-orange-900 dark:text-orange-200">Maintenance</div>
                            <div className="text-sm text-orange-700 dark:text-orange-300 mt-1">Room is under maintenance or repair</div>
                          </div>
                          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="font-semibold text-gray-900 dark:text-gray-200">Unavailable</div>
                            <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">Room is temporarily unavailable for booking</div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="occupied">Occupied</SelectItem>
                      <SelectItem value="cleaning">Cleaning</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="unavailable">Unavailable</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="roomTypeId"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2 mb-2">
                    <FormLabel className="text-sm font-medium">Room Type</FormLabel>
                    <Dialog open={isAddRoomTypeDialogOpen} onOpenChange={setIsAddRoomTypeDialogOpen}>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline" size="sm" className="h-7">
                          <Plus className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Room Type</DialogTitle>
                          <DialogDescription>Create a new room type</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddRoomType} className="space-y-4">
                          <div>
                            <Label>Name *</Label>
                            <Input
                              value={newRoomTypeData.name}
                              onChange={(e) => setNewRoomTypeData({ ...newRoomTypeData, name: e.target.value })}
                              required
                            />
                          </div>
                          <div>
                            <Label>Description</Label>
                            <Textarea
                              value={newRoomTypeData.description}
                              onChange={(e) => setNewRoomTypeData({ ...newRoomTypeData, description: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Base Price *</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={newRoomTypeData.basePrice}
                              onChange={(e) => setNewRoomTypeData({ ...newRoomTypeData, basePrice: e.target.value })}
                              required
                            />
                          </div>
                          <div>
                            <Label>Max Guests *</Label>
                            <Input
                              type="number"
                              value={newRoomTypeData.maxGuests}
                              onChange={(e) => setNewRoomTypeData({ ...newRoomTypeData, maxGuests: parseInt(e.target.value) || 1 })}
                              required
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsAddRoomTypeDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button type="submit">Create</Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select Room Type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roomTypes.map((type, index) => (
                        <SelectItem key={type.id || `type-${index}`} value={type.id}>
                          {type.name} - ${type.basePrice}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Room Services Section */}
          {selectedRoomTypeId && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Room Services</Label>
                <Dialog open={isAddServiceDialogOpen} onOpenChange={setIsAddServiceDialogOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="sm" className="h-8">
                      <Plus className="h-3 w-3 mr-1" />
                      Add Service
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Service</DialogTitle>
                      <DialogDescription>Create a new room service</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddService} className="space-y-4">
                      <div>
                        <Label>Name *</Label>
                        <Input
                          value={newServiceData.name}
                          onChange={(e) => setNewServiceData({ ...newServiceData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={newServiceData.description}
                          onChange={(e) => setNewServiceData({ ...newServiceData, description: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Icon (URL or emoji)</Label>
                        <Input
                          value={newServiceData.icon}
                          onChange={(e) => setNewServiceData({ ...newServiceData, icon: e.target.value })}
                          placeholder="e.g., 🛁 or https://..."
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsAddServiceDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit">Create</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 max-h-96 overflow-y-auto">
                {allServices.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No services available. Create one to get started.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {allServices.map((service) => {
                      const isChecked = selectedRoomTypeServices.includes(service.id);
                      const getInitials = (name: string) => {
                        return name
                          .split(" ")
                          .map((word) => word[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2);
                      };

                      const isValidImageUrl = service.icon && (
                        service.icon.startsWith("http://") || 
                        service.icon.startsWith("https://") ||
                        service.icon.startsWith("/")
                      );

                      const isEmoji = service.icon && service.icon.length <= 2 && /[\u{1F300}-\u{1F9FF}]/u.test(service.icon);

                      return (
                        <div
                          key={service.id}
                          className={`relative p-4 rounded-lg border-2 transition-all ${
                            isChecked
                              ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30"
                              : "border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-700 bg-white dark:bg-gray-800"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              id={`service-${service.id}`}
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                handleServiceToggle(service.id, checked as boolean);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                {isValidImageUrl ? (
                                  <Avatar className="h-12 w-12 flex-shrink-0">
                                    <AvatarImage src={service.icon} alt={service.name} />
                                    <AvatarFallback className="bg-orange-500 text-white font-semibold">
                                      {getInitials(service.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                ) : isEmoji ? (
                                  <div className="h-12 w-12 flex items-center justify-center text-2xl bg-gray-100 dark:bg-gray-700 rounded-full flex-shrink-0">
                                    {service.icon}
                                  </div>
                                ) : (
                                  <Avatar className="h-12 w-12 bg-orange-500 flex-shrink-0">
                                    <AvatarFallback className="bg-orange-500 text-white font-semibold">
                                      {getInitials(service.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                                <label
                                  htmlFor={`service-${service.id}`}
                                  className="flex-1 cursor-pointer"
                                >
                                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {service.name}
                                  </div>
                                </label>
                              </div>
                              {service.description && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 ml-[60px]">
                                  {service.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Select services to add to this room type. Services will be available for all rooms of this type.</p>
            </div>
          )}

          {/* Image Upload Section */}
          <div className="space-y-4">
            <Label className="text-sm font-medium text-gray-900 dark:text-white">Room Images</Label>
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
                      onChange={(e) => handleImageUpload(e.target.files)}
                      className="hidden"
                      disabled={uploadingImages}
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
                {uploadingImages && (
                  <p className="text-sm text-gray-500">Uploading...</p>
                )}
              </div>
            </div>

            {/* Preview Images */}
            {imageUrls.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 mt-4">
                {imageUrls.map((url, index) => (
                  <div key={`${url}-${index}`} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                      <img
                        src={url}
                        alt={`Room image ${index + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onLoad={() => {
                          console.log('✅ Image loaded from cPanel:', url);
                        }}
                        onError={(e) => {
                          console.error('❌ Failed to load image from cPanel:', url);
                          // Prevent infinite loop - use data URI placeholder
                          if (!e.currentTarget.src.includes('data:image')) {
                            e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23e5e7eb' width='400' height='300'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='18' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3EImage Not Found%3C/text%3E%3C/svg%3E";
                            toast.error(`Failed to load image: ${url.split('/').pop()}`);
                          }
                        }}
                      />
                      {uploadingImages && index === imageUrls.length - 1 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-white" />
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-orange-600 hover:bg-orange-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded truncate max-w-[calc(100%-1rem)] opacity-0 group-hover:opacity-100 transition-opacity">
                      {url.split('/').pop()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full md:w-auto h-11 px-8 bg-orange-600 hover:bg-orange-700 text-white"
            disabled={loading || uploadingImages}
          >
            {loading ? "Creating..." : "Create Room"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
