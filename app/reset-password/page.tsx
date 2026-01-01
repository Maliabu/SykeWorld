"use client";

import React, { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams, useRouter } from "next/navigation";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";

// Password reset schema
const resetSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetFormValues = z.infer<typeof resetSchema>;

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const form = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: ResetFormValues) => {
    if (!token) {
      setErrorMessage("Invalid or missing reset token.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    const res = await fetch("/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password: values.password }),
    });

    const result = await res.json();
    setLoading(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => router.push("/admin"), 3000); // redirect after 3s
    } else {
      setErrorMessage(result.error || "Failed to reset password.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-[400px] bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-center mb-4">Reset Password</h2>
        <p className="text-xs text-center mb-6 text-gray-500">
          Enter your new password below.
        </p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <div className="flex items-center">
                    <FormControl>
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="New password"
                        {...field}
                      />
                    </FormControl>
                    <button
                      type="button"
                      className="ml-2 p-2 border rounded-md"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button className="w-full mt-4" type="submit" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </Button>

            {errorMessage && (
              <div className="mt-3 flex gap-2 items-center text-red-600 bg-red-100 p-2 rounded">
                <XCircle size={16} /> {errorMessage}
              </div>
            )}

            {success && (
              <div className="mt-3 flex gap-2 items-center text-green-600 bg-green-100 p-2 rounded">
                <CheckCircle size={16} className="animate-pulse" /> Password reset successful! Redirecting to login...
              </div>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
