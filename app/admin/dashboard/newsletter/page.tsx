"use client";

import { useEffect, useState } from "react";
import { getAllSubscribers, sendNewsletter } from "@/lib/actions/newsletter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Mail, Send, Users, Loader2 } from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";

export default function NewsletterPage() {
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [subject, setSubject] = useState("");
  const [fromName, setFromName] = useState("Syke World Hotel");
  const [fromEmail, setFromEmail] = useState("support@sykeworld.com");
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before initializing editor (client-side only)
  useEffect(() => {
    setMounted(true);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Write your newsletter content here...",
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-orange-500 underline",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full rounded-lg",
        },
      }),
    ],
    content: "",
    immediatelyRender: false, // Fix SSR hydration mismatch
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[400px] p-4",
      },
    },
  });

  useEffect(() => {
    loadSubscribers();
  }, []);

  const loadSubscribers = async () => {
    setLoading(true);
    const result = await getAllSubscribers();
    if (result.success) {
      setSubscribers(result.subscribers || []);
    } else {
      toast.error(result.error || "Failed to load subscribers");
    }
    setLoading(false);
  };

  const handleSend = async () => {
    if (!subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }

    if (!editor || !editor.getHTML() || editor.getHTML().trim() === "<p></p>") {
      toast.error("Please write newsletter content");
      return;
    }

    if (subscribers.length === 0) {
      toast.error("No subscribers to send to");
      return;
    }

    setSending(true);
    try {
      const result = await sendNewsletter({
        subject,
        body: editor.getHTML(),
        fromName,
        fromEmail,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.success) {
        toast.success(
          `Newsletter sent successfully! ${result.successful} sent, ${result.failed} failed`
        );
        // Clear form
        setSubject("");
        editor.commands.clearContent();
      }
    } catch (error: any) {
      console.error("Send newsletter error:", error);
      toast.error("Failed to send newsletter");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Loading subscribers...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Newsletter</h1>
          <p className="text-muted-foreground mt-1">Compose and send newsletters to all subscribers</p>
        </div>
        <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
          <Users className="h-4 w-4 mr-2" />
          {subscribers.length} Subscribers
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        {/* Newsletter Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compose Newsletter</CardTitle>
              <CardDescription>Create and send a newsletter to all subscribers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* From Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="fromName">From Name</Label>
                  <Input
                    id="fromName"
                    value={fromName}
                    onChange={(e) => setFromName(e.target.value)}
                    placeholder="Syke World Hotel"
                  />
                </div>
                <div>
                  <Label htmlFor="fromEmail">From Email</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                    placeholder="support@sykeworld.com"
                  />
                </div>
              </div>

              {/* Subject */}
              <div>
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Newsletter subject line"
                  required
                />
              </div>

              {/* Editor Toolbar */}
              <div>
                <Label>Email Body *</Label>
                <div className="border rounded-lg mt-2">
                  {/* Toolbar */}
                  {mounted && editor && (
                    <div className="border-b p-2 flex flex-wrap gap-2 bg-gray-50 dark:bg-gray-800">
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={`px-3 py-1 rounded text-sm ${
                          editor.isActive("bold")
                            ? "bg-orange-500 text-white"
                            : "bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                        }`}
                      >
                        <strong>B</strong>
                      </button>
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={`px-3 py-1 rounded text-sm ${
                          editor.isActive("italic")
                            ? "bg-orange-500 text-white"
                            : "bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                        }`}
                      >
                        <em>I</em>
                      </button>
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        className={`px-3 py-1 rounded text-sm ${
                          editor.isActive("underline")
                            ? "bg-orange-500 text-white"
                            : "bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                        }`}
                      >
                        <u>U</u>
                      </button>
                      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        className={`px-3 py-1 rounded text-sm ${
                          editor.isActive("heading", { level: 1 })
                            ? "bg-orange-500 text-white"
                            : "bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                        }`}
                      >
                        H1
                      </button>
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        className={`px-3 py-1 rounded text-sm ${
                          editor.isActive("heading", { level: 2 })
                            ? "bg-orange-500 text-white"
                            : "bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                        }`}
                      >
                        H2
                      </button>
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className={`px-3 py-1 rounded text-sm ${
                          editor.isActive("bulletList")
                            ? "bg-orange-500 text-white"
                            : "bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                        }`}
                      >
                        •
                      </button>
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        className={`px-3 py-1 rounded text-sm ${
                          editor.isActive("orderedList")
                            ? "bg-orange-500 text-white"
                            : "bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                        }`}
                      >
                        1.
                      </button>
                      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
                      <button
                        type="button"
                        onClick={() => {
                          const url = window.prompt("Enter URL:");
                          if (url) {
                            editor.chain().focus().setLink({ href: url }).run();
                          }
                        }}
                        className={`px-3 py-1 rounded text-sm ${
                          editor.isActive("link")
                            ? "bg-orange-500 text-white"
                            : "bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                        }`}
                      >
                        Link
                      </button>
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().unsetLink().run()}
                        disabled={!editor.isActive("link")}
                        className="px-3 py-1 rounded text-sm bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50"
                      >
                        Unlink
                      </button>
                    </div>
                  )}

                  {/* Editor Content */}
                  <div className="min-h-[400px] p-4">
                    {mounted && editor ? (
                      <EditorContent editor={editor} />
                    ) : (
                      <div className="text-muted-foreground text-center py-20">
                        Loading editor...
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Send Button */}
              <Button
                onClick={handleSend}
                disabled={sending || !subject.trim() || !editor?.getHTML() || subscribers.length === 0}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              >
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send to {subscribers.length} Subscribers
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Subscribers List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Subscribers ({subscribers.length})
              </CardTitle>
              <CardDescription>All newsletter subscribers</CardDescription>
            </CardHeader>
            <CardContent>
              {subscribers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No subscribers yet
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {subscribers.map((subscriber) => (
                    <div
                      key={subscriber.id || subscriber.email}
                      className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    >
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-orange-500" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-foreground truncate">
                            {subscriber.name || "Subscriber"}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {subscriber.email}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

