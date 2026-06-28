// lib/validators/auth.ts
import { z } from "zod";

export const signUpSchema = z.object({
  phoneNumber: z
    .string()
    .min(11, "Phone number is required")
    .max(15, "Invalid phone number")
    .regex(/^01[0125][0-9]{8}$/, "Please enter a valid Egyptian phone number"),

  username: z.string().min(3, "Username must be at least 3 characters").max(30),
});
export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  // username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const forgetPassSchema = z.object({
  email: z.string().email("Invalid email address"),
  // username: z.string().min(3, "Username must be at least 3 characters"),
});

export const verifyPhoneSchema = z.object({
  code: z
    .string()
    .length(6, "OTP must contain exactly 6 digits"),
});
