"use client";

import { useEffect, useState } from "react";
import { getAllPosOrders } from "@/lib/actions/pos";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Receipt, 
  Search, 
  Calendar, 
  Printer, 
  Download,
  Filter,
  X
} from "lucide-react";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [filteredReceipts, setFilteredReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<string>("all"); // all, today, week, month, custom
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);

  useEffect(() => {
    loadReceipts();
  }, []);

  useEffect(() => {
    filterReceipts();
  }, [receipts, searchTerm, dateFilter, startDate, endDate]);

  const loadReceipts = async () => {
    setLoading(true);
    try {
      const result = await getAllPosOrders();
      if (result.success) {
        const sortedReceipts = (result.orders || []).sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt || a.created_at).getTime();
          const dateB = new Date(b.createdAt || b.created_at).getTime();
          return dateB - dateA; // Newest first
        });
        setReceipts(sortedReceipts);
      } else {
        toast.error(result.error || "Failed to load receipts");
      }
    } catch (error: any) {
      console.error("Error loading receipts:", error);
      toast.error("Failed to load receipts");
    } finally {
      setLoading(false);
    }
  };

  const filterReceipts = () => {
    let filtered = [...receipts];

    // Date filtering
    const now = new Date();
    let start: Date | null = null;
    let end: Date | null = null;

    switch (dateFilter) {
      case "today":
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case "week":
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        start = weekStart;
        end = now;
        break;
      case "month":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = now;
        break;
      case "custom":
        if (startDate) {
          start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
        }
        if (endDate) {
          end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
        }
        break;
    }

    if (start || end) {
      filtered = filtered.filter((receipt) => {
        const receiptDate = new Date(receipt.createdAt || receipt.created_at);
        if (start && receiptDate < start) return false;
        if (end && receiptDate > end) return false;
        return true;
      });
    }

    // Search filtering
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((receipt) => {
        const orderNumber = receipt.orderNumber?.toLowerCase() || "";
        const totalAmount = receipt.totalAmount?.toString() || "";
        const dateStr = format(new Date(receipt.createdAt || receipt.created_at), "MMM dd, yyyy");
        return (
          orderNumber.includes(term) ||
          totalAmount.includes(term) ||
          dateStr.toLowerCase().includes(term)
        );
      });
    }

    setFilteredReceipts(filtered);
  };

  const groupReceiptsByDate = () => {
    const grouped: { [key: string]: any[] } = {};
    
    filteredReceipts.forEach((receipt) => {
      const date = new Date(receipt.createdAt || receipt.created_at);
      const dateKey = format(date, "yyyy-MM-dd");
      const displayDate = format(date, "EEEE, MMMM dd, yyyy");
      
      if (!grouped[displayDate]) {
        grouped[displayDate] = [];
      }
      grouped[displayDate].push(receipt);
    });

    // Sort dates (newest first)
    return Object.entries(grouped).sort((a, b) => {
      const dateA = new Date(a[0]);
      const dateB = new Date(b[0]);
      return dateB.getTime() - dateA.getTime();
    });
  };

  const viewReceipt = (receipt: any) => {
    setSelectedReceipt(receipt);
    setIsReceiptDialogOpen(true);
  };

  const printReceipt = (receipt: any) => {
    const receiptWindow = window.open("", "_blank");
    if (!receiptWindow) return;

    let receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${receipt.orderNumber}</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            width: 80mm;
            margin: 0;
            padding: 10px;
            font-size: 12px;
          }
          .header {
            text-align: center;
            border-bottom: 1px dashed #000;
            padding-bottom: 10px;
            margin-bottom: 10px;
          }
          .item {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
          }
          .total {
            border-top: 1px solid #000;
            margin-top: 10px;
            padding-top: 10px;
            font-weight: bold;
            text-align: right;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 10px;
            border-top: 1px dashed #000;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>SYKE WORLD HOTEL</h2>
          <p>Receipt</p>
        </div>
        <p><strong>Order #:</strong> ${receipt.orderNumber}</p>
        <p><strong>Date:</strong> ${format(new Date(receipt.createdAt || receipt.created_at), "MMM dd, yyyy HH:mm")}</p>
        <hr>
    `;

    try {
      const items = JSON.parse(receipt.items || "[]");
      items.forEach((item: any) => {
        receiptHtml += `
          <div class="item">
            <span>${item.name} x${item.quantity}</span>
            <span>${parseFloat(item.price || 0).toFixed(2)}</span>
          </div>
        `;
      });
    } catch (e) {
      receiptHtml += `<p>Items data unavailable</p>`;
    }

    receiptHtml += `
        <div class="total">
          <p>Total: UGX ${parseFloat(receipt.totalAmount || 0).toFixed(2)}</p>
        </div>
        <div class="footer">
          <p>Thank you for your business!</p>
        </div>
      </body>
      </html>
    `;

    receiptWindow.document.write(receiptHtml);
    receiptWindow.document.close();
    receiptWindow.print();
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDateFilter("all");
    setStartDate("");
    setEndDate("");
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Loading receipts...</div>
      </div>
    );
  }

  const groupedReceipts = groupReceiptsByDate();
  const hasActiveFilters = searchTerm || dateFilter !== "all" || startDate || endDate;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Receipts</h1>
          <p className="text-muted-foreground mt-1">View and manage all POS receipts</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by order number, amount, or date..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Date filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {dateFilter === "custom" && (
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="Start date"
                />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="End date"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Receipts</p>
                <p className="text-2xl font-bold">{filteredReceipts.length}</p>
              </div>
              <Receipt className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">
                  UGX {filteredReceipts
                    .reduce((sum, r) => sum + parseFloat(r.totalAmount || 0), 0)
                    .toFixed(2)}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Printed</p>
                <p className="text-2xl font-bold">
                  {filteredReceipts.filter((r) => r.isPrinted).length}
                </p>
              </div>
              <Printer className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Receipts by Date */}
      {groupedReceipts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No receipts found
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedReceipts.map(([date, dateReceipts]) => (
            <Card key={date}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {date}
                  <Badge variant="outline" className="ml-2">
                    {dateReceipts.length} receipt{dateReceipts.length !== 1 ? "s" : ""}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dateReceipts.map((receipt) => {
                    let items: any[] = [];
                    try {
                      items = JSON.parse(receipt.items || "[]");
                    } catch (e) {
                      // Ignore parse errors
                    }

                    return (
                      <div
                        key={receipt.id}
                        className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-foreground">
                                Order #{receipt.orderNumber}
                              </h3>
                              <Badge
                                variant={receipt.isPrinted ? "default" : "outline"}
                                className={
                                  receipt.isPrinted
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                    : ""
                                }
                              >
                                {receipt.isPrinted ? "Printed" : "Not Printed"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {format(
                                new Date(receipt.createdAt || receipt.created_at),
                                "HH:mm:ss"
                              )}
                            </p>
                            <div className="text-sm">
                              <p className="text-muted-foreground">
                                Items: {items.length} | Total: UGX{" "}
                                {parseFloat(receipt.totalAmount || 0).toFixed(2)}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewReceipt(receipt)}
                            >
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => printReceipt(receipt)}
                            >
                              <Printer className="h-4 w-4 mr-1" />
                              Print
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Receipt Detail Dialog */}
      <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Receipt Details</DialogTitle>
            <DialogDescription>
              Order #{selectedReceipt?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedReceipt && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">
                  {format(
                    new Date(selectedReceipt.createdAt || selectedReceipt.created_at),
                    "MMMM dd, yyyy 'at' HH:mm:ss"
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Items</p>
                <div className="border rounded-lg p-4">
                  {(() => {
                    try {
                      const items = JSON.parse(selectedReceipt.items || "[]");
                      return (
                        <div className="space-y-2">
                          {items.map((item: any, index: number) => (
                            <div
                              key={index}
                              className="flex justify-between items-center py-2 border-b last:border-0"
                            >
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  Qty: {item.quantity} × UGX {parseFloat(item.price || 0).toFixed(2)}
                                </p>
                              </div>
                              <p className="font-semibold">
                                UGX {(parseFloat(item.price || 0) * (item.quantity || 1)).toFixed(2)}
                              </p>
                            </div>
                          ))}
                        </div>
                      );
                    } catch (e) {
                      return <p className="text-muted-foreground">Items data unavailable</p>;
                    }
                  })()}
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t">
                <p className="text-lg font-semibold">Total</p>
                <p className="text-2xl font-bold text-orange-600">
                  UGX {parseFloat(selectedReceipt.totalAmount || 0).toFixed(2)}
                </p>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => printReceipt(selectedReceipt)}
                  className="flex-1"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Receipt
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Download as JSON
                    const dataStr = JSON.stringify(selectedReceipt, null, 2);
                    const dataBlob = new Blob([dataStr], { type: "application/json" });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = `receipt-${selectedReceipt.orderNumber}.json`;
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}



