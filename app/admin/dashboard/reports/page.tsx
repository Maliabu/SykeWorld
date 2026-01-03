"use client";

import { useEffect, useState, useMemo } from "react";
import { getMonthlyReport, getMonthlyEarnings } from "@/lib/actions/reports";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileDown,
  Download,
  Search,
  Filter,
  Calendar,
  DollarSign,
  TrendingUp,
  Loader2,
  Clock,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  });

  useEffect(() => {
    loadReport();
  }, [year, month, dateRange.start, dateRange.end]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const result = await getMonthlyReport(
        dateRange.start && dateRange.end ? undefined : year,
        dateRange.start && dateRange.end ? undefined : month,
        dateRange.start || undefined,
        dateRange.end || undefined
      );

      if (result.success) {
        setPayments(result.payments || []);
        setTransactions(result.transactions || []);
        setSummary(result.summary || null);
      } else {
        toast.error(result.error || "Failed to load report");
      }
    } catch (error) {
      console.error("Load report error:", error);
      toast.error("Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  // Filter and search data
  const filteredData = useMemo(() => {
    const allData = [
      ...payments.map((p) => ({ ...p, type: "payment" })),
      ...transactions.map((t) => ({ ...t, type: "transaction" })),
    ];

    let filtered = allData;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.user?.email?.toLowerCase().includes(term) ||
          item.user?.firstName?.toLowerCase().includes(term) ||
          item.user?.lastName?.toLowerCase().includes(term) ||
          item.id?.toLowerCase().includes(term) ||
          item.bookingId?.toLowerCase().includes(term) ||
          item.pesapalReference?.toLowerCase().includes(term) ||
          item.pesapalOrderTrackingId?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    return filtered.sort(
      (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
    );
  }, [payments, transactions, searchTerm, statusFilter]);

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    // Title
    doc.setFontSize(18);
    doc.text("Monthly Earnings Report", margin, 20);
    doc.setFontSize(12);
    doc.text(
      `Period: ${month ? new Date(year, month - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : `${dateRange.start} to ${dateRange.end}`}`,
      margin,
      30
    );

    // Summary
    if (summary) {
      doc.setFontSize(14);
      doc.text("Summary", margin, 45);
      doc.setFontSize(10);
      let yPos = 55;
      doc.text(`Total Earnings: UGX ${summary.totalEarnings.toLocaleString()}`, margin, yPos);
      yPos += 7;
      doc.text(`Total Transactions: ${summary.totalTransactions}`, margin, yPos);
      yPos += 7;
      doc.text(`Completed: ${summary.completedTransactions}`, margin, yPos);
      yPos += 7;
      doc.text(`Pending: ${summary.pendingTransactions}`, margin, yPos);
      yPos += 15;
    }

    // Table data
    const tableData = filteredData.map((item) => [
      new Date(item.created).toLocaleDateString(),
      item.user?.email || "N/A",
      item.user?.firstName && item.user?.lastName
        ? `${item.user.firstName} ${item.user.lastName}`
        : item.user?.username || "N/A",
      `UGX ${item.amount.toLocaleString()}`,
      item.status,
      item.type,
    ]);

    autoTable(doc, {
      head: [["Date", "Email", "Name", "Amount", "Status", "Type"]],
      body: tableData,
      startY: summary ? 85 : 50,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [249, 115, 22] },
    });

    doc.save(`earnings-report-${year}-${month || "custom"}.pdf`);
    toast.success("PDF exported successfully");
  };

  // Export to Excel
  const exportToExcel = () => {
    const worksheetData = [
      ["Date", "Email", "Name", "Amount", "Status", "Type", "Booking ID", "Payment Method"],
      ...filteredData.map((item) => [
        new Date(item.created).toLocaleDateString(),
        item.user?.email || "N/A",
        item.user?.firstName && item.user?.lastName
          ? `${item.user.firstName} ${item.user.lastName}`
          : item.user?.username || "N/A",
        item.amount,
        item.status,
        item.type,
        item.bookingId || "N/A",
        item.paymentMethod || "N/A",
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Earnings Report");

    // Add summary sheet
    if (summary) {
      const summaryData = [
        ["Metric", "Value"],
        ["Total Earnings (UGX)", summary.totalEarnings],
        ["Total Transactions", summary.totalTransactions],
        ["Completed Transactions", summary.completedTransactions],
        ["Pending Transactions", summary.pendingTransactions],
      ];
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");
    }

    XLSX.writeFile(wb, `earnings-report-${year}-${month || "custom"}.xlsx`);
    toast.success("Excel file exported successfully");
  };

  const currentMonthName = month
    ? new Date(year, month - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "Custom Range";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Monthly Reports</h1>
          <p className="text-muted-foreground mt-1">Detailed earnings and transaction reports</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={exportToPDF}
            disabled={loading || filteredData.length === 0}
            className="text-white"
            style={{ backgroundColor: '#F9AC67' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#EE6A59'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F9AC67'}
          >
            <FileDown className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button
            onClick={exportToExcel}
            disabled={loading || filteredData.length === 0}
            className="text-white"
            style={{ backgroundColor: '#F9AC67' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#EE6A59'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F9AC67'}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Year Select */}
            <div>
              <label className="text-sm font-medium mb-2 block">Year</label>
              <Select
                value={year.toString()}
                onValueChange={(value) => {
                  setYear(parseInt(value));
                  setDateRange({ start: "", end: "" });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Month Select */}
            <div>
              <label className="text-sm font-medium mb-2 block">Month</label>
              <Select
                value={month.toString()}
                onValueChange={(value) => {
                  setMonth(parseInt(value));
                  setDateRange({ start: "", end: "" });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <SelectItem key={m} value={m.toString()}>
                      {new Date(2000, m - 1).toLocaleDateString("en-US", { month: "long" })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom Date Range */}
            <div>
              <label className="text-sm font-medium mb-2 block">Start Date</label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => {
                  setDateRange({ ...dateRange, start: e.target.value });
                  if (e.target.value) {
                    setYear(0);
                    setMonth(0);
                  }
                }}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => {
                  setDateRange({ ...dateRange, end: e.target.value });
                  if (e.target.value) {
                    setYear(0);
                    setMonth(0);
                  }
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Search */}
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email, name, ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="REFUNDED">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border" style={{ backgroundColor: '#F9AC67', borderColor: '#F9AC67' }}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/90">Total Earnings</p>
                  <p className="text-2xl font-bold text-white">
                    UGX {summary.totalEarnings.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-white" />
              </div>
            </CardContent>
          </Card>

          <Card className="border" style={{ backgroundColor: '#3A3F58', borderColor: '#3A3F58' }}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/90">Total Transactions</p>
                  <p className="text-2xl font-bold text-white">{summary.totalTransactions}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-600 dark:bg-green-700 border-green-700 dark:border-green-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/90">Completed</p>
                  <p className="text-2xl font-bold text-white">
                    {summary.completedTransactions}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-white" />
              </div>
            </CardContent>
          </Card>

          <Card className="border" style={{ backgroundColor: '#F9AC67', borderColor: '#F9AC67' }}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/90">Pending</p>
                  <p className="text-2xl font-bold text-white">
                    {summary.pendingTransactions}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-white" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Report Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {currentMonthName} Report ({filteredData.length} records)
          </CardTitle>
          <CardDescription>Detailed transaction and payment records</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-600" />
              <p className="text-muted-foreground">Loading report...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No records found for the selected period
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50 dark:bg-gray-800">
                    <th className="p-3 text-left text-sm font-semibold">Date</th>
                    <th className="p-3 text-left text-sm font-semibold">User</th>
                    <th className="p-3 text-left text-sm font-semibold">Email</th>
                    <th className="p-3 text-left text-sm font-semibold">Amount</th>
                    <th className="p-3 text-left text-sm font-semibold">Status</th>
                    <th className="p-3 text-left text-sm font-semibold">Type</th>
                    <th className="p-3 text-left text-sm font-semibold">Payment Method</th>
                    <th className="p-3 text-left text-sm font-semibold">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item) => (
                    <tr
                      key={`${item.type}-${item.id}`}
                      className="border-b hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    >
                      <td className="p-3 text-sm">
                        {new Date(item.created).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-sm">
                        {item.user?.firstName && item.user?.lastName
                          ? `${item.user.firstName} ${item.user.lastName}`
                          : item.user?.username || "N/A"}
                      </td>
                      <td className="p-3 text-sm">{item.user?.email || "N/A"}</td>
                      <td className="p-3 text-sm font-semibold">
                        UGX {item.amount.toLocaleString()}
                      </td>
                      <td className="p-3">
                        <Badge
                          className={
                            item.status === "COMPLETED"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : item.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }
                        >
                          {item.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm">
                        <Badge variant="outline">{item.type}</Badge>
                      </td>
                      <td className="p-3 text-sm">{item.paymentMethod || "N/A"}</td>
                      <td className="p-3 text-sm font-mono text-xs">
                        {item.pesapalReference ||
                          item.pesapalOrderTrackingId ||
                          item.merchantReference ||
                          "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

