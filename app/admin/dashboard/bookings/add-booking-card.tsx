"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Calendar, User, Mail, Phone, Bed, Users, CreditCard, DollarSign, Smartphone } from "lucide-react";
import { createDashboardBooking } from "@/lib/actions/bookings";
import { getAllRooms, getAllRoomTypes } from "@/lib/actions/bookings";
import { checkUserPermission } from "@/lib/actions/permissions";
import { useSession } from "@/lib/hooks/useSession";

export default function AddBookingCard() {
  const { user } = useSession();
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingPermission, setCheckingPermission] = useState(true);
  const [rooms, setRooms] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    roomId: "",
    checkIn: "",
    checkOut: "",
    guests: 1,
    specialRequests: "",
    paymentMethod: "cash" as "cash" | "mtn_mobile_money" | "airtel_money" | "visa" | "mastercard",
    // Card details for Visa/Mastercard
    cardNumber: "",
    cardholderName: "",
    expiryDate: "",
    cvv: "",
  });

  useEffect(() => {
    checkPermission();
    loadRooms();
    loadRoomTypes();
  }, []);

  useEffect(() => {
    if (formData.checkIn && formData.checkOut) {
      filterAvailableRooms();
    }
  }, [formData.checkIn, formData.checkOut, rooms]);

  const checkPermission = async () => {
    try {
      // Admins and superusers have access by default
      if (user?.isSuperuser || user?.userType === "admin") {
        setHasPermission(true);
        setCheckingPermission(false);
        return;
      }
      
      // Check specific permission for staff
      const result = await checkUserPermission("bookings_add");
      setHasPermission(result.hasPermission);
    } catch (error) {
      console.error("Permission check error:", error);
      setHasPermission(false);
    } finally {
      setCheckingPermission(false);
    }
  };

  const loadRooms = async () => {
    try {
      const result = await getAllRooms();
      if (result.success && result.rooms) {
        setRooms(result.rooms);
      }
    } catch (error) {
      console.error("Failed to load rooms:", error);
    }
  };

  const loadRoomTypes = async () => {
    try {
      const result = await getAllRoomTypes();
      if (result.success && result.roomTypes) {
        setRoomTypes(result.roomTypes);
      }
    } catch (error) {
      console.error("Failed to load room types:", error);
    }
  };

  const filterAvailableRooms = () => {
    // Filter rooms that are available
    const available = rooms.filter((room) => room.status === "available");
    setAvailableRooms(available);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Admins and superusers have access by default
    const canAccess = hasPermission || user?.isSuperuser || user?.userType === "admin";
    
    if (!canAccess) {
      toast.error("You don't have permission to add bookings");
      return;
    }

    // Validation
    if (!formData.customerName || !formData.customerEmail || !formData.roomId || !formData.checkIn || !formData.checkOut) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (new Date(formData.checkOut) <= new Date(formData.checkIn)) {
      toast.error("Check-out date must be after check-in date");
      return;
    }

    // Validate card details if Visa or Mastercard
    if (formData.paymentMethod === "visa" || formData.paymentMethod === "mastercard") {
      if (!formData.cardNumber || !formData.cardholderName || !formData.expiryDate || !formData.cvv) {
        toast.error("Please fill in all card details");
        return;
      }
      if (formData.cardNumber.replace(/\s/g, "").length < 13) {
        toast.error("Please enter a valid card number");
        return;
      }
      if (formData.cvv.length < 3) {
        toast.error("Please enter a valid CVV");
        return;
      }
    }

    setLoading(true);
    try {
      const result = await createDashboardBooking(formData);
      
      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.success) {
        toast.success(`Booking created successfully! Receipt sent to ${formData.customerEmail}`);
        // Reset form
        setFormData({
          customerName: "",
          customerEmail: "",
          customerPhone: "",
          roomId: "",
          checkIn: "",
          checkOut: "",
          guests: 1,
          specialRequests: "",
          paymentMethod: "cash",
          cardNumber: "",
          cardholderName: "",
          expiryDate: "",
          cvv: "",
        });
      }
    } catch (error: any) {
      console.error("Booking error:", error);
      toast.error(error.message || "Failed to create booking");
    } finally {
      setLoading(false);
    }
  };

  const calculateNights = () => {
    if (!formData.checkIn || !formData.checkOut) return 0;
    const checkIn = new Date(formData.checkIn);
    const checkOut = new Date(formData.checkOut);
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 0;
  };

  const calculateTotal = () => {
    const selectedRoom = rooms.find((r) => r.id === formData.roomId);
    if (!selectedRoom || !selectedRoom.roomType) return 0;
    const nights = calculateNights();
    const pricePerNight = parseFloat(selectedRoom.roomType.basePrice || "0");
    return nights * pricePerNight;
  };

  if (checkingPermission) {
    return null;
  }

  if (!hasPermission) {
    return null;
  }

  return (
    <Card className="border-0 backdrop-blur-md bg-white/90 dark:bg-gray-900/90">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bed className="h-5 w-5 text-orange-600" />
          Add New Booking (Reception)
        </CardTitle>
        <CardDescription>
          Create a booking for customers checking in at the reception
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer Name *
              </Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerEmail" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Customer Email *
              </Label>
              <Input
                id="customerEmail"
                type="email"
                value={formData.customerEmail}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                placeholder="customer@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerPhone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number
              </Label>
              <Input
                id="customerPhone"
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                placeholder="+256 XXX XXX XXX"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="roomId" className="flex items-center gap-2">
                <Bed className="h-4 w-4" />
                Room *
              </Label>
              <Select
                value={formData.roomId}
                onValueChange={(value) => setFormData({ ...formData, roomId: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a room" />
                </SelectTrigger>
                <SelectContent>
                  {availableRooms.length === 0 && formData.checkIn && formData.checkOut ? (
                    <SelectItem value="" disabled>No available rooms for selected dates</SelectItem>
                  ) : (
                    rooms
                      .filter((room) => room.status === "available")
                      .map((room) => (
                        <SelectItem key={room.id} value={room.id}>
                          {room.roomNumber} - {room.roomType?.name} (UGX {parseFloat(room.roomType?.basePrice || "0").toLocaleString()}/night)
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="checkIn" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Check-in Date *
              </Label>
              <Input
                id="checkIn"
                type="date"
                value={formData.checkIn}
                onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                min={new Date().toISOString().split("T")[0]}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="checkOut" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Check-out Date *
              </Label>
              <Input
                id="checkOut"
                type="date"
                value={formData.checkOut}
                onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                min={formData.checkIn || new Date().toISOString().split("T")[0]}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guests" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Number of Guests *
              </Label>
              <Input
                id="guests"
                type="number"
                min="1"
                value={formData.guests}
                onChange={(e) => setFormData({ ...formData, guests: parseInt(e.target.value) || 1 })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payment Method *
              </Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value: "cash" | "mtn_mobile_money" | "airtel_money" | "visa" | "mastercard") => 
                  setFormData({ ...formData, paymentMethod: value, cardNumber: "", cardholderName: "", expiryDate: "", cvv: "" })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Cash
                    </div>
                  </SelectItem>
                  <SelectItem value="mtn_mobile_money">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      MTN Mobile Money
                    </div>
                  </SelectItem>
                  <SelectItem value="airtel_money">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      Airtel Money
                    </div>
                  </SelectItem>
                  <SelectItem value="visa">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Visa
                    </div>
                  </SelectItem>
                  <SelectItem value="mastercard">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Mastercard
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Card Details for Visa/Mastercard */}
            {(formData.paymentMethod === "visa" || formData.paymentMethod === "mastercard") && (
              <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <Label className="text-sm font-medium">Card Details</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="cardNumber">Card Number *</Label>
                    <Input
                      id="cardNumber"
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={formData.cardNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\s/g, "").replace(/\D/g, "");
                        const formatted = value.match(/.{1,4}/g)?.join(" ") || value;
                        setFormData({ ...formData, cardNumber: formatted });
                      }}
                      maxLength={19}
                      required
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="cardholderName">Cardholder Name *</Label>
                    <Input
                      id="cardholderName"
                      type="text"
                      placeholder="John Doe"
                      value={formData.cardholderName}
                      onChange={(e) => setFormData({ ...formData, cardholderName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">Expiry Date (MM/YY) *</Label>
                    <Input
                      id="expiryDate"
                      type="text"
                      placeholder="12/25"
                      value={formData.expiryDate}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, "");
                        if (value.length >= 2) {
                          value = value.slice(0, 2) + "/" + value.slice(2, 4);
                        }
                        setFormData({ ...formData, expiryDate: value });
                      }}
                      maxLength={5}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV *</Label>
                    <Input
                      id="cvv"
                      type="text"
                      placeholder="123"
                      value={formData.cvv}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                        setFormData({ ...formData, cvv: value });
                      }}
                      maxLength={4}
                      required
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialRequests">Special Requests</Label>
            <Textarea
              id="specialRequests"
              value={formData.specialRequests}
              onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
              placeholder="Any special requests or preferences..."
              rows={3}
            />
          </div>

          {formData.roomId && formData.checkIn && formData.checkOut && (
            <div className="bg-orange-50 dark:bg-orange-950/30 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {calculateNights()} night{calculateNights() !== 1 ? "s" : ""} × UGX{" "}
                    {rooms.find((r) => r.id === formData.roomId)?.roomType?.basePrice
                      ? parseFloat(rooms.find((r) => r.id === formData.roomId)?.roomType?.basePrice || "0").toLocaleString()
                      : "0"}
                  </div>
                  <div className="text-lg font-bold text-orange-600 dark:text-orange-400 mt-1">
                    Total: UGX {calculateTotal().toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            {loading ? "Creating Booking..." : "Create Booking & Send Receipt"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

