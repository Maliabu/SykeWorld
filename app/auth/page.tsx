"use client";

import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { toast } from "sonner";
import { z } from "zod";

const SignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const SignUpSchema = z
  .object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(8),
    password: z.string().min(6),
    confirmPassword: z.string().min(1),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords must match",
  });

export default function AuthTabs() {
  const { data: session, status } = useSession();
  const API = process.env.NEXT_PUBLIC_API_URL!;

  const [tab, setTab] = useState<"signin" | "signup">("signin");

  const [signinData, setSigninData] = useState({
    email: "",
    password: "",
  });

  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  // -----------------------
  // GOOGLE LOGIN → Exchange idToken for Django JWTs (once)
  // -----------------------
  useEffect(() => {
    if (status !== "authenticated") return;

    const idToken = (session as any)?.user?.idToken;
    if (!idToken) return;

    // Prevent infinite retry loop
    const alreadyExchanged = localStorage.getItem("google_exchanged");
    if (alreadyExchanged === "yes") return;

    (async () => {
      try {
        console.log("🚀 SENDING TOKEN TO DJANGO");
const res = await fetch(`${API}/api/accounts/auth/google-login/`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({ id_token: idToken }),
});

        console.log("Response status:", res.status);
const raw = await res.text();
console.log("Raw response:", raw);

let data = null;
try { data = JSON.parse(raw); } catch {}

if (!res.ok) {
  console.log("❌ Exchange FAILED");
  toast.error(data?.error || "Google exchange failed");
  return;
}

console.log("Exchange success:", data);

if (data.access) localStorage.setItem("access", data.access);
if (data.refresh) localStorage.setItem("refresh", data.refresh);
localStorage.setItem("google_exchanged", "yes");
        // If backend returns tokens in JSON (access/refresh), save them
        if (data && (data.access || data.refresh)) {
          if (data.access) localStorage.setItem("access", data.access);
          if (data.refresh) localStorage.setItem("refresh", data.refresh);
          localStorage.setItem("google_exchanged", "yes");
          toast.success("Signed in with Google");
          // no reload necessary — but you can reload if you want:
          // window.location.reload();
          return;
        }

        // If backend didn't return tokens but did set cookies (common approach),
        // verify server-side auth by calling whoami endpoint (credentials included).
        try {
          const who = await fetch(`${API}/api/accounts/auth/whoami/`, {
            method: "GET",
            credentials: "include",
          });
          if (who.ok) {
            localStorage.setItem("google_exchanged", "yes");
            toast.success("Signed in with Google (server cookie set)");
            return;
          } else {
            const whodata = await who.json().catch(() => null);
            toast.error((whodata && whodata.error) || "Server did not accept Google token");
            return;
          }
        } catch (whoErr) {
          console.error("whoami error", whoErr);
          toast.error("Could not verify server authentication after Google login");
          return;
        }
      } catch (err) {
        console.error(err);
        toast.error("Server error");
      }
    })();
    // Only run when session/status/API change
  }, [status, session, API]);

  // -----------------------
  // EMAIL/PASSWORD SIGN-IN
  // -----------------------
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = SignInSchema.safeParse(signinData);

    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => toast.error(issue.message));
      return;
    }

    try {
      const res = await fetch(`${API}/api/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(parsed.data),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        toast.error((data && data.error) || "Login failed");
        return;
      }

      // If backend returns tokens, save them (some backends set cookies instead)
      if (data && (data.access || data.refresh)) {
        if (data.access) localStorage.setItem("access", data.access);
        if (data.refresh) localStorage.setItem("refresh", data.refresh);
      }

      // mark that server auth is done (if you rely on this)
      localStorage.setItem("google_exchanged", "yes");

      toast.success("Logged in");
      window.location.reload();
    } catch (err) {
      console.error(err);
      toast.error("Server error");
    }
  };

  // -----------------------
  // SIGN-UP
  // -----------------------
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = SignUpSchema.safeParse(signupData);
    if (!parsed.success) {
      parsed.error.issues.forEach((i) => toast.error(i.message));
      return;
    }

    try {
      const res = await fetch(`${API}/api/auth/signup/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: parsed.data.name,
          email: parsed.data.email,
          phone: parsed.data.phone,
          password: parsed.data.password,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        toast.error((data && data.error) || "Signup failed");
        return;
      }

      toast.success("Account created");
      window.location.reload();
    } catch (err) {
      console.error(err);
      toast.error("Server error");
    }
  };

  // -----------------------
  // If logged in (Google OR email/pass)
  // -----------------------
  if (status === "authenticated") {
    return (
      <div className="bg-white p-6 my-20 rounded-xl max-w-md mx-auto text-center">
        <p className="mb-4">{`Signed in as ${(session as any)?.user?.email || "User"}`}</p>

        <button
          onClick={() => {
            // clear local tokens and exchange flag
            localStorage.removeItem("access");
            localStorage.removeItem("refresh");
            localStorage.removeItem("google_exchanged");
            signOut();
          }}
          className="bg-orange-600 text-white py-2 px-4 rounded"
        >
          Sign Out
        </button>
      </div>
    );
  }

  // -----------------------
  // RENDER AUTH FORMS
  // -----------------------
  return (
    <div className="bg-white p-6 my-20 rounded-xl max-w-md mx-auto">
      <div className="flex mb-4 border-b">
        <button
          onClick={() => setTab("signin")}
          className={`flex-1 py-2 ${tab === "signin" ? "border-b-2 border-orange-600" : ""}`}
        >
          Sign In
        </button>
        <button
          onClick={() => setTab("signup")}
          className={`flex-1 py-2 ${tab === "signup" ? "border-b-2 border-orange-600" : ""}`}
        >
          Sign Up
        </button>
      </div>

      {/* GOOGLE BUTTON */}
      <div className="space-y-3 mb-4">
        <button onClick={() => signIn("google")} className="w-full bg-red-500 text-white py-2 rounded-lg">
          Continue with Google
        </button>
      </div>

      {/* SIGN IN FORM */}
      {tab === "signin" && (
        <form onSubmit={handleSignIn} className="space-y-3">
          <input
            value={signinData.email}
            onChange={(e) => setSigninData({ ...signinData, email: e.target.value })}
            placeholder="Email"
            className="w-full border p-2 rounded"
          />

          <input
            type="password"
            value={signinData.password}
            onChange={(e) => setSigninData({ ...signinData, password: e.target.value })}
            placeholder="Password"
            className="w-full border p-2 rounded"
          />

          <button type="submit" className="w-full bg-orange-600 text-white py-2 rounded-lg">
            Sign In
          </button>
        </form>
      )}

      {/* SIGN UP FORM */}
      {tab === "signup" && (
        <form onSubmit={handleSignUp} className="space-y-3">
          <input
            value={signupData.name}
            onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
            placeholder="Full Name"
            className="w-full border p-2 rounded"
          />

          <input
            value={signupData.email}
            onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
            placeholder="Email"
            className="w-full border p-2 rounded"
          />

          <input
            value={signupData.phone}
            onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
            placeholder="Phone"
            className="w-full border p-2 rounded"
          />

          <input
            type="password"
            value={signupData.password}
            onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
            placeholder="Password"
            className="w-full border p-2 rounded"
          />

          <input
            type="password"
            value={signupData.confirmPassword}
            onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
            placeholder="Confirm Password"
            className="w-full border p-2 rounded"
          />

          <button type="submit" className="w-full bg-orange-600 text-white py-2 rounded-lg">
            Sign Up
          </button>
        </form>
      )}
    </div>
  );
}
