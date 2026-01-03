"use client";

import { useEffect, useState } from "react";
import { getAllTransactions } from "@/lib/actions/payments";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Clock, CheckCircle, XCircle } from "lucide-react";

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

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    const result = await getAllTransactions();
    if (result.success) {
      setTransactions(result.transactions || []);
    } else {
      toast.error(result.error || "Failed to load transactions");
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Loading transactions...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Transactions</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">View all payment transactions</p>
      </div>

      <div className="grid gap-4">
        {transactions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              No transactions found
            </CardContent>
          </Card>
        ) : (
          transactions.map((transaction, index) => (
            <Card key={transaction.id || `transaction-${index}`} className="overflow-hidden border-gray-200 dark:border-gray-800">
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
                <div className="grid grid-cols-2 gap-4 text-sm">
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
      </div>
    </div>
  );
}

