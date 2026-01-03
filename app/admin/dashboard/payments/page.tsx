"use client";

import { useEffect, useState, useMemo } from "react";
import { getAllPayments, getAllTransactions } from "@/lib/actions/payments";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, CreditCard, Clock, CheckCircle, XCircle, Search } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 20;

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "N/A";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "N/A";
  }
};

const getStatusColor = (status: string) => {
  const upperStatus = status.toUpperCase();
  if (upperStatus.includes("COMPLETED") || upperStatus.includes("SUCCESS")) {
    return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
  }
  if (upperStatus.includes("PENDING") || upperStatus.includes("PROCESSING")) {
    return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
  }
  if (upperStatus.includes("FAILED") || upperStatus.includes("CANCELLED")) {
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  }
  return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("payments");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [paymentsResult, transactionsResult] = await Promise.all([
      getAllPayments(),
      getAllTransactions(),
    ]);

    if (paymentsResult.success) {
      setPayments(paymentsResult.payments || []);
    } else {
      toast.error(paymentsResult.error || "Failed to load payments");
    }

    if (transactionsResult.success) {
      setTransactions(transactionsResult.transactions || []);
    } else {
      toast.error(transactionsResult.error || "Failed to load transactions");
    }

    setLoading(false);
  };

  // Filter payments and transactions based on search
  const filteredPayments = useMemo(() => {
    if (!searchTerm) return payments;
    const term = searchTerm.toLowerCase();
    return payments.filter(
      (p) =>
        p.id?.toLowerCase().includes(term) ||
        p.bookingId?.toLowerCase().includes(term) ||
        p.pesapalOrderTrackingId?.toLowerCase().includes(term) ||
        p.amount?.toString().includes(term) ||
        p.status?.toLowerCase().includes(term)
    );
  }, [payments, searchTerm]);

  const filteredTransactions = useMemo(() => {
    if (!searchTerm) return transactions;
    const term = searchTerm.toLowerCase();
    return transactions.filter(
      (t) =>
        t.id?.toLowerCase().includes(term) ||
        t.bookingId?.toLowerCase().includes(term) ||
        t.pesapalReference?.toLowerCase().includes(term) ||
        t.merchantReference?.toLowerCase().includes(term) ||
        t.amount?.toString().includes(term) ||
        t.status?.toLowerCase().includes(term) ||
        t.paymentMethod?.toLowerCase().includes(term)
    );
  }, [transactions, searchTerm]);

  // Paginate filtered data
  const paginatedPayments = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredPayments.slice(startIndex, endIndex);
  }, [filteredPayments, currentPage]);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredTransactions.slice(startIndex, endIndex);
  }, [filteredTransactions, currentPage]);

  const totalPagesPayments = Math.ceil(filteredPayments.length / ITEMS_PER_PAGE);
  const totalPagesTransactions = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);

  // Reset to page 1 when search or tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Loading payments...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Payments</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage all payment records and transactions</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-4 mt-6">
          {filteredPayments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                {searchTerm ? "No payments match your search" : "No payments found"}
              </CardContent>
            </Card>
          ) : (
            paginatedPayments.map((payment, index) => (
              <Card key={payment.id || `payment-${index}`} className="overflow-hidden border-gray-200 dark:border-gray-800 ">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">Payment #{payment.id.slice(0, 8)}</CardTitle>
                      <CardDescription className="mt-1">
                        Booking: {payment.bookingId.slice(0, 8)}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(payment.status)}>
                      {payment.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm text-sm">
                    <div>
                      <div className="font-medium text-gray-500">Amount</div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        UGX {Number(payment.amount).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-500">Created</div>
                      <div className="text-gray-900 dark:text-white">
                        {formatDate(payment.created)}
                      </div>
                    </div>
                  </div>
                  {payment.pesapalOrderTrackingId && (
                    <div className="text-sm">
                      <div className="font-medium text-gray-500">Pesapal Tracking ID</div>
                      <div className="text-gray-900 dark:text-white font-mono text-xs">
                        {payment.pesapalOrderTrackingId}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
          {filteredPayments.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPagesPayments}
              onPageChange={setCurrentPage}
              totalItems={filteredPayments.length}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          )}
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4 mt-6">
          {filteredTransactions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                {searchTerm ? "No transactions match your search" : "No transactions found"}
              </CardContent>
            </Card>
          ) : (
            paginatedTransactions.map((transaction, index) => (
              <Card key={transaction.id || `transaction-${index}`} className="overflow-hidden border-gray-200 dark:border-gray-800 ">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">Transaction #{transaction.id.slice(0, 8)}</CardTitle>
                      <CardDescription className="mt-1">
                        {transaction.paymentMethod || "N/A"} • Booking: {transaction.bookingId.slice(0, 8)}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(transaction.status)}>
                      {transaction.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm text-sm">
                    <div>
                      <div className="font-medium text-gray-500">Amount</div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        UGX {Number(transaction.amount).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-500">Created</div>
                      <div className="text-gray-900 dark:text-white">
                        {formatDate(transaction.created)}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-gray-500">Pesapal Reference</div>
                    <div className="text-gray-900 dark:text-white font-mono text-xs">
                      {transaction.pesapalReference}
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-gray-500">Merchant Reference</div>
                    <div className="text-gray-900 dark:text-white font-mono text-xs">
                      {transaction.merchantReference}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
          {filteredTransactions.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPagesTransactions}
              onPageChange={setCurrentPage}
              totalItems={filteredTransactions.length}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

