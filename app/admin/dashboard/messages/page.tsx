"use client";

import { useEffect, useState, useMemo } from "react";
import { getAllContactMessages, deleteContactMessage } from "@/lib/actions/contact";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Search, Mail, User, MessageSquare } from "lucide-react";

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "N/A";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "N/A";
  }
};

export default function MessagesPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    setLoading(true);
    const result = await getAllContactMessages();
    if (result.success) {
      setMessages(result.messages || []);
    } else {
      toast.error(result.error || "Failed to load messages");
    }
    setLoading(false);
  };

  const handleDelete = async (messageId: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;

    const result = await deleteContactMessage(messageId);
    if (result.success) {
      toast.success("Message deleted successfully");
      loadMessages();
    } else {
      toast.error(result.error || "Failed to delete message");
    }
  };

  // Filter messages based on search
  const filteredMessages = useMemo(() => {
    if (!searchTerm) return messages;
    const term = searchTerm.toLowerCase();
    return messages.filter(
      (m) =>
        m.name?.toLowerCase().includes(term) ||
        m.email?.toLowerCase().includes(term) ||
        m.message?.toLowerCase().includes(term)
    );
  }, [messages, searchTerm]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Contact Messages</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage customer inquiries and messages</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-6">
        {filteredMessages.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              {searchTerm ? "No messages match your search" : "No messages found"}
            </CardContent>
          </Card>
        ) : (
          filteredMessages.map((message, index) => (
            <Card key={message.id || `message-${index}`} className="overflow-hidden border-gray-200 dark:border-gray-800">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                        <User className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{message.name || "Anonymous"}</CardTitle>
                        <CardDescription className="mt-0.5 flex items-center gap-2">
                          <Mail className="w-3 h-3" />
                          {message.email}
                        </CardDescription>
                      </div>
                    </div>
                    <CardDescription className="mt-2">
                      {formatDate(message.createdAt)}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(message.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              {message.message && (
                <CardContent>
                  <div className="flex gap-3">
                    <MessageSquare className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{message.message}</p>
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
