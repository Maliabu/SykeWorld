"use client";

import { useEffect, useState } from "react";
import { getUserTickets, createTicket, getTicketById, addTicketMessage, closeTicket, deleteTicket, getAllTickets } from "@/lib/actions/tickets";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Ticket, Plus, MessageSquare, X, Trash2, CheckCircle2, Circle } from "lucide-react";
import { useSession } from "@/lib/hooks/useSession";
import { formatDistanceToNow } from "date-fns";
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

export default function TicketsPage() {
  const { user } = useSession();
  const isAdmin = user?.isSuperuser || user?.userType === "admin";
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    message: "",
  });

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const result = isAdmin ? await getAllTickets() : await getUserTickets();
      if (result.success) {
        setTickets(result.tickets || []);
      } else {
        toast.error(result.error || "Failed to load tickets");
      }
    } catch (error) {
      console.error("Load tickets error:", error);
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await createTicket(formData);
    if (result.success) {
      toast.success("Ticket created successfully");
      setIsCreateDialogOpen(false);
      setFormData({ title: "", message: "" });
      loadTickets();
    } else {
      toast.error(result.error || "Failed to create ticket");
    }
  };

  const handleViewTicket = async (ticketId: string) => {
    const result = await getTicketById(ticketId);
    if (result.success) {
      setSelectedTicket(result.ticket);
      setIsViewDialogOpen(true);
    } else {
      toast.error(result.error || "Failed to load ticket");
    }
  };

  const handleAddMessage = async () => {
    if (!selectedTicket || !newMessage.trim()) return;

    const result = await addTicketMessage({
      ticketId: selectedTicket.id,
      message: newMessage,
    });

    if (result.success) {
      toast.success("Message added");
      setNewMessage("");
      // Reload ticket
      const ticketResult = await getTicketById(selectedTicket.id);
      if (ticketResult.success) {
        setSelectedTicket(ticketResult.ticket);
      }
    } else {
      toast.error(result.error || "Failed to add message");
    }
  };

  const handleCloseTicket = async (ticketId: string) => {
    if (!isAdmin) {
      toast.error("Only admins can close tickets");
      return;
    }

    const result = await closeTicket(ticketId);
    if (result.success) {
      toast.success("Ticket closed");
      setIsViewDialogOpen(false);
      loadTickets();
    } else {
      toast.error(result.error || "Failed to close ticket");
    }
  };

  const handleDelete = async () => {
    if (!selectedTicket || !isAdmin) return;

    const result = await deleteTicket(selectedTicket.id);
    if (result.success) {
      toast.success("Ticket deleted");
      setIsDeleteDialogOpen(false);
      setIsViewDialogOpen(false);
      setSelectedTicket(null);
      loadTickets();
    } else {
      toast.error(result.error || "Failed to delete ticket");
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Loading tickets...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tickets</h1>
          <p className="text-muted-foreground mt-1">Manage support tickets</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Create Ticket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Ticket</DialogTitle>
              <DialogDescription>Open a new support ticket</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate}>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={4}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white">
                  Create
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-2">
        {tickets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No tickets found
            </CardContent>
          </Card>
        ) : (
          tickets.map((ticket) => (
            <Card
              key={ticket.id}
              className={`${
                ticket.status === "open" ? "border-orange-500" : "border-gray-300"
              } cursor-pointer`}
              onClick={() => handleViewTicket(ticket.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{ticket.title}</CardTitle>
                    {isAdmin && ticket.user && (
                      <CardDescription className="mt-1">
                        By: {ticket.user.firstName && ticket.user.lastName
                          ? `${ticket.user.firstName} ${ticket.user.lastName}`
                          : ticket.user.username || ticket.user.email}
                      </CardDescription>
                    )}
                  </div>
                  <Badge
                    variant={ticket.status === "open" ? "default" : "outline"}
                    className={
                      ticket.status === "open"
                        ? "bg-orange-500 text-white"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                    }
                  >
                    {ticket.status === "open" ? (
                      <Circle className="h-3 w-3 mr-1" />
                    ) : (
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                    )}
                    {ticket.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Created {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* View Ticket Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>{selectedTicket?.title}</DialogTitle>
                <DialogDescription>
                  {selectedTicket?.user && (
                    <>By: {selectedTicket.user.firstName && selectedTicket.user.lastName
                      ? `${selectedTicket.user.firstName} ${selectedTicket.user.lastName}`
                      : selectedTicket.user.username || selectedTicket.user.email}</>
                  )}
                </DialogDescription>
              </div>
              <div className="flex gap-2">
                {selectedTicket?.status === "open" && isAdmin && (
                  <Button
                    variant="outline"
                    onClick={() => handleCloseTicket(selectedTicket.id)}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Close Ticket
                  </Button>
                )}
                {isAdmin && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setIsViewDialogOpen(false);
                      setIsDeleteDialogOpen(true);
                    }}
                    className="text-orange-600 hover:text-orange-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Messages */}
            <div className="space-y-3">
              {selectedTicket?.messages?.map((msg: any) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-lg ${
                    msg.user.id === user?.id
                      ? "bg-orange-50 dark:bg-orange-950 ml-auto max-w-[80%]"
                      : "bg-gray-50 dark:bg-gray-800"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">
                      {msg.user.firstName && msg.user.lastName
                        ? `${msg.user.firstName} ${msg.user.lastName}`
                        : msg.user.username || msg.user.email}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{msg.message}</p>
                </div>
              ))}
            </div>

            {/* Add Message */}
            {selectedTicket?.status === "open" && (
              <div className="border-t pt-4">
                <Label htmlFor="newMessage">Add Message</Label>
                <div className="flex gap-2 mt-2">
                  <Textarea
                    id="newMessage"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    rows={3}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleAddMessage}
                    disabled={!newMessage.trim()}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ticket</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this ticket? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-orange-600 hover:bg-orange-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

