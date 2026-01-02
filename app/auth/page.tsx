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
        <div className="relative z-0 min-h-screen py-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-center items-center">
              {/* Auth status */}
              <div className="max-w-md w-full">
                <div className="bg-transparent p-6 border-l border-r border-black/10 text-center">
                  <p className="mb-4 text-[#1a1c1e]" style={{ fontFamily: 'var(--font-inter)' }}>{`Signed in as ${(session as any)?.user?.email || "User"}`}</p>

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
                    className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 text-base font-semibold transition uppercase tracking-wide"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
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
      <div className="relative z-0 min-h-screen py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* LEFT: Content sections */}
            <div className="space-y-8 order-2 lg:order-1">
              {/* DISCOVER Section */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px w-12 bg-black/20"></div>
                  <p className="text-xs uppercase tracking-widest text-black/60 font-medium" style={{ fontFamily: 'var(--font-inter)' }}>
                    DISCOVER
                  </p>
                  <div className="h-px w-12 bg-black/20"></div>
                </div>
                <div className="border border-black/10 p-6 bg-white/50 backdrop-blur-sm">
                  <h3 
                    className="text-2xl font-bold text-[#1a1c1e] mb-2"
                    style={{ fontFamily: 'var(--font-playfair)' }}
                  >
                    Paidha
                  </h3>
                  <p 
                    className="text-sm text-gray-600"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    The Hidden Gem of West Nile
                  </p>
                </div>
              </div>

              {/* EXPERIENCE Section */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px w-12 bg-black/20"></div>
                  <p className="text-xs uppercase tracking-widest text-black/60 font-medium" style={{ fontFamily: 'var(--font-inter)' }}>
                    EXPERIENCE
                  </p>
                  <div className="h-px w-12 bg-black/20"></div>
                </div>
                <div className="border border-black/10 p-6 bg-white/50 backdrop-blur-sm">
                  <h3 
                    className="text-2xl font-bold text-[#1a1c1e] mb-2"
                    style={{ fontFamily: 'var(--font-playfair)' }}
                  >
                    Bar & Restaurant
                  </h3>
                  <p 
                    className="text-sm text-gray-600"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    Exquisite cuisine & crafted cocktails
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT: Auth form */}
            <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
              <div className="max-w-md w-full">
                <div className="bg-transparent p-6 border-l border-r border-black/10">
                <div className="flex mb-6 border-b border-black/10">
                  <button
                    onClick={() => setTab("signin")}
                    className={`flex-1 py-3 text-[#1a1c1e] ${tab === "signin" ? "border-b-2 border-amber-600 font-semibold" : "text-black/60"}`}
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setTab("signup")}
                    className={`flex-1 py-3 text-[#1a1c1e] ${tab === "signup" ? "border-b-2 border-amber-600 font-semibold" : "text-black/60"}`}
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    Sign Up
                  </button>
                </div>

                {/* GOOGLE BUTTON */}
                <div className="space-y-3 mb-6">
                  <button 
                    onClick={() => signIn("google")} 
                    className="w-full bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 px-6 py-3 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-3"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                </div>

                {/* SIGN IN FORM */}
                {tab === "signin" && (
                  <form onSubmit={handleSignIn} className="space-y-6">
                    <div>
                      <label 
                        className="block text-xs uppercase tracking-widest text-black/60 font-medium mb-2"
                        style={{ fontFamily: 'var(--font-inter)' }}
                      >
                        Email
                      </label>
                      <input
                        value={signinData.email}
                        onChange={(e) => setSigninData({ ...signinData, email: e.target.value })}
                        placeholder="your.email@example.com"
                        className="w-full bg-transparent border-b border-gray-400/50 px-0 py-3 text-[#1a1c1e] placeholder-gray-500 focus:outline-none focus:border-b-amber-600 transition-all"
                        style={{ fontFamily: 'var(--font-inter)' }}
                      />
                    </div>

                    <div>
                      <label 
                        className="block text-xs uppercase tracking-widest text-black/60 font-medium mb-2"
                        style={{ fontFamily: 'var(--font-inter)' }}
                      >
                        Password
                      </label>
                      <input
                        type="password"
                        value={signinData.password}
                        onChange={(e) => setSigninData({ ...signinData, password: e.target.value })}
                        placeholder="Enter your password"
                        className="w-full bg-transparent border-b border-gray-400/50 px-0 py-3 text-[#1a1c1e] placeholder-gray-500 focus:outline-none focus:border-b-amber-600 transition-all"
                        style={{ fontFamily: 'var(--font-inter)' }}
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="w-full bg-amber-600 text-white px-6 py-3 text-base font-semibold hover:bg-amber-700 transition uppercase tracking-wide"
                      style={{ fontFamily: 'var(--font-inter)' }}
                    >
                      Sign In
                    </button>
                  </form>
                )}

                {/* SIGN UP FORM */}
                {tab === "signup" && (
                  <form onSubmit={handleSignUp} className="space-y-6">
                    <div>
                      <label 
                        className="block text-xs uppercase tracking-widest text-black/60 font-medium mb-2"
                        style={{ fontFamily: 'var(--font-inter)' }}
                      >
                        Full Name
                      </label>
                      <input
                        value={signupData.name}
                        onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                        placeholder="Enter your full name"
                        className="w-full bg-transparent border-b border-gray-400/50 px-0 py-3 text-[#1a1c1e] placeholder-gray-500 focus:outline-none focus:border-b-amber-600 transition-all"
                        style={{ fontFamily: 'var(--font-inter)' }}
                      />
                    </div>

                    <div>
                      <label 
                        className="block text-xs uppercase tracking-widest text-black/60 font-medium mb-2"
                        style={{ fontFamily: 'var(--font-inter)' }}
                      >
                        Email
                      </label>
                      <input
                        value={signupData.email}
                        onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                        placeholder="your.email@example.com"
                        className="w-full bg-transparent border-b border-gray-400/50 px-0 py-3 text-[#1a1c1e] placeholder-gray-500 focus:outline-none focus:border-b-amber-600 transition-all"
                        style={{ fontFamily: 'var(--font-inter)' }}
                      />
                    </div>

                    <div>
                      <label 
                        className="block text-xs uppercase tracking-widest text-black/60 font-medium mb-2"
                        style={{ fontFamily: 'var(--font-inter)' }}
                      >
                        Phone
                      </label>
                      <input
                        value={signupData.phone}
                        onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                        placeholder="+256 XXX XXX XXX"
                        className="w-full bg-transparent border-b border-gray-400/50 px-0 py-3 text-[#1a1c1e] placeholder-gray-500 focus:outline-none focus:border-b-amber-600 transition-all"
                        style={{ fontFamily: 'var(--font-inter)' }}
                      />
                    </div>

                    <div>
                      <label 
                        className="block text-xs uppercase tracking-widest text-black/60 font-medium mb-2"
                        style={{ fontFamily: 'var(--font-inter)' }}
                      >
                        Password
                      </label>
                      <input
                        type="password"
                        value={signupData.password}
                        onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                        placeholder="Enter your password"
                        className="w-full bg-transparent border-b border-gray-400/50 px-0 py-3 text-[#1a1c1e] placeholder-gray-500 focus:outline-none focus:border-b-amber-600 transition-all"
                        style={{ fontFamily: 'var(--font-inter)' }}
                      />
                    </div>

                    <div>
                      <label 
                        className="block text-xs uppercase tracking-widest text-black/60 font-medium mb-2"
                        style={{ fontFamily: 'var(--font-inter)' }}
                      >
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        value={signupData.confirmPassword}
                        onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                        placeholder="Confirm your password"
                        className="w-full bg-transparent border-b border-gray-400/50 px-0 py-3 text-[#1a1c1e] placeholder-gray-500 focus:outline-none focus:border-b-amber-600 transition-all"
                        style={{ fontFamily: 'var(--font-inter)' }}
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="w-full bg-amber-600 text-white px-6 py-3 text-base font-semibold hover:bg-amber-700 transition uppercase tracking-wide"
                      style={{ fontFamily: 'var(--font-inter)' }}
                    >
                      Sign Up
                    </button>
                  </form>
                )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
