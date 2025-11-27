"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode, useEffect } from "react";
import { signOut } from "next-auth/react";
import { scheduleAutoLogout } from "./lib/tokenWatcher";

export default function SessionProviderWrapper({ children }: { children: ReactNode }) {
  
  useEffect(() => {
    const access = localStorage.getItem("access");

    if (access) {
      scheduleAutoLogout(access, () => {
        console.warn("🔒 Token expired — auto logging out");

        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("google_exchanged");

        signOut(); // next-auth logout
      });
    }
  }, []);

  return <SessionProvider>{children}</SessionProvider>;
}
