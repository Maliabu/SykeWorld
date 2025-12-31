import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  userType: z.enum(["guest", "staff"]).default("guest"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const googleLoginSchema = z.object({
  idToken: z.string().min(1, "ID token is required"),
});

export const resetPasswordSchema = z.object({
    email: z.string({required_error: "Please enter your email.",}).min(5, {
        message: "email too short"
    }),
})

export const passwordResetSchema = z.object({
    email: z.string(),
    password: z.string(),
    confirmPassword: z.string({required_error: "Please confirm your password.",}),
    decInit: z.string(),
    encrPass: z.string({required_error: "Please enter a password.",}).min(2, {
        message: "Password must be atleast 8 characters"
    }).max(50),
    userId: z.string(),
}).superRefine(({ confirmPassword, encrPass }, ctx) => {
    if (confirmPassword !== encrPass) {
      ctx.addIssue({
        code: "custom",
        message: "The passwords did not match",
        path: ['confirmPassword']
      });
    }
  });
  
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type GoogleLoginInput = z.infer<typeof googleLoginSchema>;




