"use client";

import { useEffect, useState } from "react";
import { whoami } from "@/lib/actions/auth";

export interface SessionUser {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  userType: string;
  isSuperuser?: boolean;
  isStaff?: boolean;
}

export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      const result = await whoami();
      if (result.success && result.user) {
        setUser(result.user as SessionUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return { user, loading, refetch: loadSession };
}



