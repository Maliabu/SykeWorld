"use client";

import { useEffect, useState, useMemo } from "react";
import { getAllSubscriptions, deleteSubscription } from "@/lib/actions/subscriptions";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Mail, Trash2, Users, Loader2, Search } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    setLoading(true);
    const result = await getAllSubscriptions();
    if (result.success) {
      setSubscriptions(result.subscriptions || []);
    } else {
      toast.error(result.error || "Failed to load subscriptions");
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!selectedSubscription) return;

    setDeletingId(selectedSubscription.id);
    try {
      const result = await deleteSubscription(selectedSubscription.id);
      if (result.success) {
        toast.success("Subscription deleted successfully");
        loadSubscriptions();
      } else {
        toast.error(result.error || "Failed to delete subscription");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete subscription");
    } finally {
      setDeletingId(null);
      setDeleteDialogOpen(false);
      setSelectedSubscription(null);
    }
  };

  // Filter subscriptions based on search
  const filteredSubscriptions = useMemo(() => {
    if (!searchTerm) return subscriptions;
    const term = searchTerm.toLowerCase();
    return subscriptions.filter(
      (s) =>
        s.name?.toLowerCase().includes(term) ||
        s.email?.toLowerCase().includes(term) ||
        s.id?.toLowerCase().includes(term)
    );
  }, [subscriptions, searchTerm]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Loading subscriptions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Subscriptions</h1>
          <p className="text-muted-foreground mt-1">Manage newsletter subscriptions</p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search subscriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
            <Users className="h-4 w-4 mr-2" />
            {filteredSubscriptions.length} Total
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Subscriptions</CardTitle>
          <CardDescription>List of all newsletter subscribers</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSubscriptions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchTerm ? "No subscriptions match your search" : "No subscriptions yet"}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredSubscriptions.map((subscription) => (
                <div
                  key={subscription.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-full">
                      <Mail className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground truncate">
                        {subscription.name || "Subscriber"}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {subscription.email}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Subscribed on {new Date(subscription.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedSubscription(subscription);
                      setDeleteDialogOpen(true);
                    }}
                    disabled={deletingId === subscription.id}
                    className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                  >
                    {deletingId === subscription.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the subscription for{" "}
              <strong>{selectedSubscription?.email}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

