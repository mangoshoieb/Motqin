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
  phoneNumber: z
    .string()
    .min(11, "Phone number is required")
    .max(15, "Invalid phone number")
    .regex(/^01[0125][0-9]{8}$/, "Please enter a valid Egyptian phone number"),
});

export const verifyPhoneSchema = z.object({
  code: z.string().length(6, "OTP must contain exactly 6 digits"),
});

export const completeProfileSchema = z.object({
  name: z
    .string()
    .min(3, "الاسم يجب أن يحتوي على 3 أحرف على الأقل")
    .max(50),

  region: z
    .string()
    .min(1, "يرجى اختيار المحافظة"),
});