"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { createDefaultPermissions } from "@/scripts/create-default-permissions";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function PermissionsSetupPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleCreatePermissions = async () => {
    setLoading(true);
    setResults([]);
    
    try {
      // Import and call the function
      const response = await fetch("/api/admin/create-permissions", {
        method: "POST",
      });
      
      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
        const successCount = data.results?.filter((r: any) => r.success).length || 0;
        toast.success(`Created ${successCount} permissions successfully!`);
      } else {
        toast.error("Failed to create permissions");
      }
    } catch (error) {
      console.error("Error creating permissions:", error);
      toast.error("Failed to create permissions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Permission Setup</h1>
        <p className="text-muted-foreground mt-2">
          Create default permission definitions for your dashboard pages
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Default Permissions</CardTitle>
          <CardDescription>
            This will create permission definitions for all common dashboard pages including:
            Rooms, Bookings, Payments, POS, Staff, Newsletter, and more.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleCreatePermissions}
            disabled={loading}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Permissions...
              </>
            ) : (
              "Create Default Permissions"
            )}
          </Button>

          {results.length > 0 && (
            <div className="mt-6 space-y-2">
              <h3 className="font-semibold">Results:</h3>
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 rounded border"
                  >
                    {result.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm">
                      {result.permission}: {result.success ? "Created" : result.error || "Failed"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}



