// hooks/useAuth.ts
import { useState, useEffect } from "react";

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("accessToken");
    if (t) setToken(t);
  }, []);

  const login = (accessToken: string) => {
    localStorage.setItem("accessToken", accessToken);
    setToken(accessToken);
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    setToken(null);
  };

  return { token, login, logout, isAuthenticated: !!token };
}
