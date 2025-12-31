"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/hooks/useSession";

export default function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      const isAdmin = user.isSuperuser || user.userType === "admin";
      if (!isAdmin) {
        router.push("/admin/dashboard");
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Loading...</div>
      </div>
    );
  }

  if (!user || (!user.isSuperuser && user.userType !== "admin")) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-red-500">
          Access Denied: Admin privileges required
        </div>
      </div>
    );
  }

  return <>{children}</>;
}



