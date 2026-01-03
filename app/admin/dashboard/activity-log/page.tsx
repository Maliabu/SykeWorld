"use client";

import { useEffect, useState, useMemo } from "react";
import { getAllActivityLogs } from "@/lib/actions/activityLog";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Activity, User, Calendar, Globe, Monitor, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const limit = 50;

  useEffect(() => {
    loadLogs();
  }, [page]);

  const loadLogs = async () => {
    setLoading(true);
    const result = await getAllActivityLogs(limit, (page - 1) * limit);
    if (result.success) {
      setLogs(result.logs || []);
      setTotal(result.total || 0);
    } else {
      toast.error(result.error || "Failed to load activity logs");
    }
    setLoading(false);
  };

  const getActionColor = (action: string) => {
    if (action.startsWith("CREATE")) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    if (action.startsWith("UPDATE")) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    if (action.startsWith("DELETE")) return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    if (action.startsWith("LOGIN")) return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  };

  const formatAction = (action: string) => {
    return action.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Filter logs based on search
  const filteredLogs = useMemo(() => {
    if (!searchTerm) return logs;
    const term = searchTerm.toLowerCase();
    return logs.filter(
      (l) =>
        l.action?.toLowerCase().includes(term) ||
        l.entityType?.toLowerCase().includes(term) ||
        l.description?.toLowerCase().includes(term) ||
        l.userName?.toLowerCase().includes(term) ||
        l.entityId?.toLowerCase().includes(term) ||
        l.ipAddress?.toLowerCase().includes(term)
    );
  }, [logs, searchTerm]);

  if (loading && logs.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Loading activity logs...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Activity Log</h1>
          <p className="text-muted-foreground mt-1">Track all system activities and user actions</p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
            <Activity className="h-4 w-4 mr-2" />
            {filteredLogs.length} / {total} Activities
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
          <CardDescription>All system activities performed by users</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchTerm ? "No activities match your search" : "No activity logs found"}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getActionColor(log.action)}>
                          {formatAction(log.action)}
                        </Badge>
                        <Badge variant="outline">{log.entityType}</Badge>
                        {log.entityId && (
                          <span className="text-xs text-muted-foreground">
                            ID: {log.entityId.substring(0, 8)}...
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm font-medium text-foreground">
                        {log.description}
                      </p>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{log.userName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        {log.ipAddress && log.ipAddress !== "unknown" && (
                          <div className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            <span>{log.ipAddress}</span>
                          </div>
                        )}
                      </div>

                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                            View Details
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} activities
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * limit >= total}
                  className="px-4 py-2 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

