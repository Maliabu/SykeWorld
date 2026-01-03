"use client";

import { useEffect, useState } from "react";
import { getAllMenuItems, getAllDrinks, createPosOrder } from "@/lib/actions/pos";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Plus, Minus, Printer, Save, X, Search } from "lucide-react";
import { useSession } from "@/lib/hooks/useSession";

interface CartItem {
  id: string;
  name: string;
  type: "menu" | "drink";
  price: string;
  quantity: number;
  image?: string;
}

/* ------------------------- PLACEHOLDER IMAGE ------------------------- */
const placeholderSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23e5e7eb' width='400' height='300'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='18' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";

export default function POSPage() {
  const { user } = useSession();
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [drinks, setDrinks] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"menu" | "drinks">("menu");
  
  // Get staff name for receipt
  const getStaffName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.username || user?.email?.split('@')[0] || "Staff";
  };

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    const [menuResult, drinksResult] = await Promise.all([
      getAllMenuItems(),
      getAllDrinks(),
    ]);
    if (menuResult.success) {
      setMenuItems(menuResult.items?.filter((item: any) => item.isAvailable) || []);
    }
    if (drinksResult.success) {
      setDrinks(drinksResult.items?.filter((item: any) => item.isAvailable) || []);
    }
    setLoading(false);
  };

  const addToCart = (item: any, type: "menu" | "drink") => {
    const existingItem = cart.find((cartItem) => cartItem.id === item.id && cartItem.type === type);
    if (existingItem) {
      setCart(
        cart.map((cartItem) =>
          cartItem.id === item.id && cartItem.type === type
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      );
    } else {
      setCart([
        ...cart,
        {
          id: item.id,
          name: item.name,
          type,
          price: item.price,
          quantity: 1,
          image: item.image,
        },
      ]);
    }
    toast.success(`${item.name} added to cart`);
  };

  const updateQuantity = (id: string, type: "menu" | "drink", delta: number) => {
    setCart(
      cart.map((item) => {
        if (item.id === id && item.type === type) {
          const newQuantity = item.quantity + delta;
          if (newQuantity <= 0) {
            return null;
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter((item): item is CartItem => item !== null)
    );
  };

  const removeFromCart = (id: string, type: "menu" | "drink") => {
    setCart(cart.filter((item) => !(item.id === id && item.type === type)));
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    const totalAmount = getTotal().toFixed(2);
    const result = await createPosOrder({
      items: cart.map((item) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        price: item.price,
        quantity: item.quantity,
      })),
      totalAmount,
    });

    if (result.success) {
      toast.success("Order created successfully");
      generateReceipt(result.order);
      setCart([]);
    } else {
      toast.error(result.error || "Failed to create order");
    }
  };

  const generateReceipt = (order: any) => {
    const receiptData = JSON.parse(order.receiptData || "{}");
    const receiptWindow = window.open("", "_blank");
    if (!receiptWindow) return;

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${receiptData.orderNumber}</title>
          <style>
            @media print {
              @page { size: 80mm auto; margin: 0; }
              body { margin: 0; padding: 10px; }
            }
            body {
              font-family: monospace;
              font-size: 12px;
              width: 80mm;
              margin: 0 auto;
              padding: 10px;
            }
            .header { text-align: center; margin-bottom: 10px; }
            .header-row { display: flex; justify-content: space-between; margin: 3px 0; font-size: 11px; }
            .served-by { text-align: right; margin-bottom: 10px; font-size: 11px; }
            .items-header { display: flex; justify-content: space-between; margin: 10px 0 5px 0; font-weight: bold; font-size: 11px; border-bottom: 1px solid #000; padding-bottom: 3px; }
            .items-header span { flex: 1; text-align: left; }
            .items-header span:nth-child(2) { text-align: center; }
            .items-header span:nth-child(3) { text-align: center; }
            .items-header span:nth-child(4) { text-align: right; }
            .item { display: flex; justify-content: space-between; margin: 3px 0; font-size: 11px; }
            .item span { flex: 1; text-align: left; }
            .item span:nth-child(2) { text-align: center; }
            .item span:nth-child(3) { text-align: center; }
            .item span:nth-child(4) { text-align: right; }
            .total { font-weight: bold; margin-top: 10px; padding-top: 10px; border-top: 1px solid #000; }
            .total .item { display: flex; justify-content: space-between; width: 100%; }
            .total .item span:first-child { flex: 0 0 auto; }
            .total .item span:last-child { flex: 0 0 auto; margin-left: auto; }
            .footer { text-align: center; margin-top: 20px; font-size: 10px; }
            .qr-code { text-align: center; margin-top: 15px; }
            .qr-code img { width: 100px; height: 100px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>SYKE WORLD HOTEL</h2>
            <p>Landmark Place, opposite Rock Filling Station, Zombo</p>
          </div>
          <div class="header-row">
            <span>ORDER NO</span>
            <span>${receiptData.orderNumber}</span>
          </div>
          <div class="header-row">
            <span>DATE</span>
            <span>${new Date(receiptData.createdAt).toLocaleString()}</span>
          </div>
          <div class="served-by">
            Served by: ${getStaffName()}
          </div>
          <div class="items">
            <div class="items-header">
              <span>NAME</span>
              <span>QTY</span>
              <span>UNIT.P</span>
              <span>TOTAL</span>
            </div>
            ${receiptData.items.map((item: any) => {
              const itemName = item.name.toUpperCase();
              const qty = item.quantity;
              const unitPrice = parseFloat(item.price);
              const total = unitPrice * qty;
              return `
              <div class="item">
                <span>${itemName}</span>
                <span>${qty}</span>
                <span>${unitPrice.toLocaleString()}</span>
                <span>${total.toLocaleString()}</span>
              </div>
            `;
            }).join("")}
          </div>
          <div class="total">
            <div class="item">
              <span>TOTAL:</span>
              <span>UGX ${parseFloat(receiptData.totalAmount).toLocaleString()}</span>
            </div>
          </div>
          <div class="footer">
            <p>Thank you for your order!</p>
          </div>
          <div class="qr-code">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://sykeworld.com" alt="QR Code" />
          </div>
        </body>
      </html>
    `;

    receiptWindow.document.write(receiptHTML);
    receiptWindow.document.close();
  };

  const handlePrint = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    const orderNumber = `ORD-${Date.now()}`;
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${orderNumber}</title>
          <style>
            @media print {
              @page { size: 80mm auto; margin: 0; }
              body { margin: 0; padding: 10px; }
            }
            body {
              font-family: monospace;
              font-size: 12px;
              width: 80mm;
              margin: 0 auto;
              padding: 10px;
            }
            .header { text-align: center; margin-bottom: 10px; }
            .header-row { display: flex; justify-content: space-between; margin: 3px 0; font-size: 11px; }
            .served-by { text-align: right; margin-bottom: 10px; font-size: 11px; }
            .items-header { display: flex; justify-content: space-between; margin: 10px 0 5px 0; font-weight: bold; font-size: 11px; border-bottom: 1px solid #000; padding-bottom: 3px; }
            .items-header span { flex: 1; text-align: left; }
            .items-header span:nth-child(2) { text-align: center; }
            .items-header span:nth-child(3) { text-align: center; }
            .items-header span:nth-child(4) { text-align: right; }
            .item { display: flex; justify-content: space-between; margin: 3px 0; font-size: 11px; }
            .item span { flex: 1; text-align: left; }
            .item span:nth-child(2) { text-align: center; }
            .item span:nth-child(3) { text-align: center; }
            .item span:nth-child(4) { text-align: right; }
            .total { font-weight: bold; margin-top: 10px; padding-top: 10px; border-top: 1px solid #000; }
            .total .item { display: flex; justify-content: space-between; width: 100%; }
            .total .item span:first-child { flex: 0 0 auto; }
            .total .item span:last-child { flex: 0 0 auto; margin-left: auto; }
            .footer { text-align: center; margin-top: 20px; font-size: 10px; }
            .qr-code { text-align: center; margin-top: 15px; }
            .qr-code img { width: 100px; height: 100px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>SYKE WORLD HOTEL</h2>
            <p>Landmark Place, opposite Rock Filling Station, Zombo</p>
          </div>
          <div class="header-row">
            <span>ORDER NO</span>
            <span>${orderNumber}</span>
          </div>
          <div class="header-row">
            <span>DATE</span>
            <span>${new Date().toLocaleString()}</span>
          </div>
          <div class="served-by">
            Served by: ${getStaffName()}
          </div>
          <div class="items">
            <div class="items-header">
              <span>NAME</span>
              <span>QTY</span>
              <span>UNIT.P</span>
              <span>TOTAL</span>
            </div>
            ${cart.map((item) => {
              const itemName = item.name.toUpperCase();
              const qty = item.quantity;
              const unitPrice = parseFloat(item.price);
              const total = unitPrice * qty;
              return `
              <div class="item">
                <span>${itemName}</span>
                <span>${qty}</span>
                <span>${unitPrice.toLocaleString()}</span>
                <span>${total.toLocaleString()}</span>
              </div>
            `;
            }).join("")}
          </div>
          <div class="total">
            <div class="item">
              <span>TOTAL:</span>
              <span>UGX ${getTotal().toLocaleString()}</span>
            </div>
          </div>
          <div class="footer">
            <p>Thank you for your order!</p>
          </div>
          <div class="qr-code">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://sykeworld.com" alt="QR Code" />
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(receiptHTML);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const filteredMenuItems = menuItems.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.localName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDrinks = drinks.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.localName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 h-screen flex flex-col">
      <div className="mb-4">
        <h1 className="text-3xl font-bold mb-2">Point of Sale</h1>
        <p className="text-gray-600 dark:text-gray-400">Restaurant & Bar</p>
      </div>

      <div className="flex-1 flex-1 grid grid-cols-1 lg:grid-cols-3 gap-2 overflow-hidden overflow-hidden">
        {/* Items Section */}
        <div className="lg:col-span-2 flex flex-col overflow-hidden">
          <div className="mb-4 flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={activeTab === "menu" ? "default" : "outline"}
                onClick={() => setActiveTab("menu")}
              >
                Menu
              </Button>
              <Button
                variant={activeTab === "drinks" ? "default" : "outline"}
                onClick={() => setActiveTab("drinks")}
              >
                Drinks
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-2 p-2 p-2">
            {activeTab === "menu" ? (
              loading ? (
                <div>Loading...</div>
              ) : filteredMenuItems.length === 0 ? (
                <div className="col-span-full text-center text-gray-500">No menu items found</div>
              ) : (
                filteredMenuItems.map((item) => (
                  <Card key={item.id} className="cursor-pointer">
                    <CardContent className="p-4" onClick={() => addToCart(item, "menu")}>
                      <div className="w-full h-32 mb-2 rounded overflow-hidden bg-gray-100">
                        <img 
                          src={item.image || placeholderSvg} 
                          alt={item.name} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            if (!e.currentTarget.src.includes('data:image')) {
                              e.currentTarget.src = placeholderSvg;
                            }
                          }}
                        />
                      </div>
                      <h3 className="font-semibold text-sm">{item.name}</h3>
                      {item.localName && <p className="text-xs text-gray-500">{item.localName}</p>}
                      <p className="text-lg font-bold text-orange-600 mt-2">UGX {parseFloat(item.price || "0").toLocaleString()}</p>
                    </CardContent>
                  </Card>
                ))
              )
            ) : (
              loading ? (
                <div>Loading...</div>
              ) : filteredDrinks.length === 0 ? (
                <div className="col-span-full text-center text-gray-500">No drinks found</div>
              ) : (
                filteredDrinks.map((item) => (
                  <Card key={item.id} className="cursor-pointer">
                    <CardContent className="p-4" onClick={() => addToCart(item, "drink")}>
                      <div className="w-full h-32 mb-2 rounded overflow-hidden bg-gray-100">
                        <img 
                          src={item.image || placeholderSvg} 
                          alt={item.name} 
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            if (!e.currentTarget.src.includes('data:image')) {
                              e.currentTarget.src = placeholderSvg;
                            }
                          }}
                        />
                      </div>
                      <h3 className="font-semibold text-sm">{item.name}</h3>
                      {item.localName && <p className="text-xs text-gray-500">{item.localName}</p>}
                      <p className="text-lg font-bold text-orange-600 mt-2">UGX {parseFloat(item.price || "0").toLocaleString()}</p>
                    </CardContent>
                  </Card>
                ))
              )
            )}
          </div>
        </div>

        {/* Cart Section */}
        <div className="flex flex-col">
          <Card className="flex-1 flex flex-col overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Cart ({cart.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                {cart.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">Cart is empty</div>
                ) : (
                  cart.map((item) => (
                    <div key={`${item.id}-${item.type}`} className="flex items-center gap-2 p-2 border rounded">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-gray-500">UGX {parseFloat(item.price).toLocaleString()} each</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.id, item.type, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.id, item.type, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-600"
                          onClick={() => removeFromCart(item.id, item.type)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>UGX {getTotal().toLocaleString()}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handlePrint}
                    disabled={cart.length === 0}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                  <Button
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                    onClick={handleCheckout}
                    disabled={cart.length === 0}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Checkout
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

