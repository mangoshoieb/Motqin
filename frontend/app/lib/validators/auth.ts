// lib/validators/auth.ts
import { z } from "zod";

// Phone numbers are checked with toInternationalPhone (app/lib/phone.ts) —
// any country, not only Egypt — and the server's details.PhoneNumber
// message is shown when it refuses one. The «بياناتك» form validates itself
// (components/auth/SignupDetailsForm.tsx).

export const verifyPhoneSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "رمز التحقق 6 أرقام"),
});
