"use client";

import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { toast } from "sonner";
import { z } from "zod";
import { login, registerGuest, googleLogin } from "@/lib/actions/auth";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

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
  // GOOGLE LOGIN → Exchange idToken for Next.js JWTs (once)
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
        console.log("🚀 Exchanging Google token with Next.js server");
        
        // Use Next.js server action instead of Django API
        const result = await googleLogin({ idToken });

        if (result.error) {
          console.log("❌ Exchange FAILED:", result.error);
          toast.error(result.error || "Google login failed");
          return;
        }

        console.log("✅ Exchange success");
        localStorage.setItem("google_exchanged", "yes");
        toast.success("Signed in with Google successfully!");
        
        // Redirect to home or booking page
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 1000);
      } catch (err) {
        console.error("Google login error:", err);
        toast.error("Failed to sign in with Google");
      }
    })();
    // Only run when session/status change
  }, [status, session, router]);

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
      // Use Next.js server action instead of Django API
      const result = await login(parsed.data);

      if (result.error) {
        toast.error(result.error || "Login failed");
        return;
      }

      if (result.success) {
        toast.success("Logged in successfully!");
        // Redirect to home or booking page
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 1000);
      }
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
      // Split name into firstName and lastName
      const nameParts = parsed.data.name.trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      // Use Next.js server action instead of Django API
      const result = await registerGuest({
        email: parsed.data.email,
        password: parsed.data.password,
        firstName,
        lastName,
        phone: parsed.data.phone,
        userType: "guest" as const,
      });

      if (result.error) {
        toast.error(result.error || "Signup failed");
        return;
      }

      if (result.success) {
        toast.success("Account created successfully!");
        // Auto-login after signup
        const loginResult = await login({
          email: parsed.data.email,
          password: parsed.data.password,
        });

        if (loginResult.success) {
          setTimeout(() => {
            router.push("/");
            router.refresh();
          }, 1000);
        } else {
          // If auto-login fails, switch to sign-in tab
          setTab("signin");
          toast.info("Account created. Please sign in.");
        }
      }
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
      <div className="min-h-screen relative overflow-hidden">
        {/* Background gradients matching dashboard */}
        <div className="fixed inset-0 -z-10">
          {/* Base gradient layer */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-orange-50/8 to-gray-50 dark:from-black dark:via-gray-950 dark:to-black transition-all duration-1000" />
          
          <div className="dark:hidden absolute inset-0">
            {/* Subtle gray and orange blur orbs */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-gray-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
            <div className="absolute top-1/4 right-0 w-96 h-96 bg-orange-200/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
            <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-gray-300/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }} />
            <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-orange-200/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '9s', animationDelay: '1s' }} />
            <div className="absolute bottom-1/4 left-1/2 w-72 h-72 bg-gray-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '11s', animationDelay: '3s' }} />
            
            {/* Additional subtle gray gradient layers with minimal orange */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-200/10 via-orange-50/3 to-gray-200/10" />
            <div className="absolute inset-0 bg-gradient-to-tr from-gray-100/8 via-orange-50/2 to-gray-100/8" />
          </div>
          
          {/* Dark mode blur orbs */}
          <div className="hidden dark:block absolute inset-0">
            <div className="absolute top-0 left-0 w-96 h-96 bg-black/50 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
            <div className="absolute top-1/4 right-0 w-96 h-96 bg-gray-950/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
            <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-black/45 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }} />
            <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-gray-950/25 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '9s', animationDelay: '1s' }} />
            <div className="absolute bottom-1/4 left-1/2 w-72 h-72 bg-black/40 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '11s', animationDelay: '3s' }} />
            
            {/* Additional darker shades of black gradient layers */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-gray-950/20 to-black/60" />
            <div className="absolute inset-0 bg-gradient-to-tr from-black/50 via-gray-950/15 to-black/50" />
          </div>
        </div>
        
        {/* Content */}
        <div className="relative z-0 flex items-center justify-center min-h-screen py-20">
          <div className="bg-white dark:bg-gray-900/80 backdrop-blur-md p-6 rounded-xl max-w-md w-full mx-4 text-center border border-gray-200 dark:border-gray-800">
        <p className="mb-4 text-gray-900 dark:text-white">{`Signed in as ${(session as any)?.user?.email || "User"}`}</p>

        <button
          onClick={async () => {
            // Import logout from server actions
            const { logout } = await import("@/lib/actions/auth");
            await logout();
            // Clear local storage
            localStorage.removeItem("access");
            localStorage.removeItem("refresh");
            localStorage.removeItem("google_exchanged");
            // Sign out from NextAuth if used
            if (status === "authenticated") {
              signOut();
            }
            toast.success("Signed out successfully");
            router.push("/");
            router.refresh();
          }}
          className="bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded"
        >
          Sign Out
        </button>
          </div>
        </div>
      </div>
    );
  }

  // -----------------------
  // RENDER AUTH FORMS
  // -----------------------
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background gradients matching dashboard */}
      <div className="fixed inset-0 -z-10">
        {/* Base gradient layer */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-orange-50/8 to-gray-50 dark:from-black dark:via-gray-950 dark:to-black transition-all duration-1000" />
        
        <div className="dark:hidden absolute inset-0">
          {/* Subtle gray and orange blur orbs */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-gray-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute top-1/4 right-0 w-96 h-96 bg-orange-200/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
          <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-gray-300/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }} />
          <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-orange-200/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '9s', animationDelay: '1s' }} />
          <div className="absolute bottom-1/4 left-1/2 w-72 h-72 bg-gray-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '11s', animationDelay: '3s' }} />
          
          {/* Additional subtle gray gradient layers with minimal orange */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-200/10 via-orange-50/3 to-gray-200/10" />
          <div className="absolute inset-0 bg-gradient-to-tr from-gray-100/8 via-orange-50/2 to-gray-100/8" />
        </div>
        
        {/* Dark mode blur orbs */}
        <div className="hidden dark:block absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-black/50 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute top-1/4 right-0 w-96 h-96 bg-gray-950/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
          <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-black/45 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }} />
          <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-gray-950/25 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '9s', animationDelay: '1s' }} />
          <div className="absolute bottom-1/4 left-1/2 w-72 h-72 bg-black/40 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '11s', animationDelay: '3s' }} />
          
          {/* Additional darker shades of black gradient layers */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-gray-950/20 to-black/60" />
          <div className="absolute inset-0 bg-gradient-to-tr from-black/50 via-gray-950/15 to-black/50" />
        </div>
      </div>
      
      {/* Content */}
      <div className="relative z-0 flex items-center justify-center min-h-screen py-20">
        <div className="bg-white dark:bg-gray-900/80 backdrop-blur-md p-6 rounded-xl max-w-md w-full mx-4 border border-gray-200 dark:border-gray-800">
      <div className="flex mb-4 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setTab("signin")}
          className={`flex-1 py-2 text-gray-900 dark:text-white ${tab === "signin" ? "border-b-2 border-orange-600 font-medium" : "text-gray-600 dark:text-gray-400"}`}
        >
          Sign In
        </button>
        <button
          onClick={() => setTab("signup")}
          className={`flex-1 py-2 text-gray-900 dark:text-white ${tab === "signup" ? "border-b-2 border-orange-600 font-medium" : "text-gray-600 dark:text-gray-400"}`}
        >
          Sign Up
        </button>
      </div>

      {/* GOOGLE BUTTON */}
      <div className="space-y-3 mb-4">
        <button onClick={() => signIn("google")} className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg">
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
            className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 p-2 rounded"
          />

          <input
            type="password"
            value={signinData.password}
            onChange={(e) => setSigninData({ ...signinData, password: e.target.value })}
            placeholder="Password"
            className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 p-2 rounded"
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
            className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 p-2 rounded"
          />

          <input
            value={signupData.email}
            onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
            placeholder="Email"
            className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 p-2 rounded"
          />

          <input
            value={signupData.phone}
            onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
            placeholder="Phone"
            className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 p-2 rounded"
          />

          <input
            type="password"
            value={signupData.password}
            onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
            placeholder="Password"
            className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 p-2 rounded"
          />

          <input
            type="password"
            value={signupData.confirmPassword}
            onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
            placeholder="Confirm Password"
            className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 p-2 rounded"
          />

          <button type="submit" className="w-full bg-orange-600 text-white py-2 rounded-lg">
            Sign Up
          </button>
        </form>
      )}
        </div>
      </div>
    </div>
  );
}
