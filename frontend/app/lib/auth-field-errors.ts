import axios from "axios";

// The auth endpoints answer a bad field with
// { error: { code: "validation_error" | "invalid_inviter_code",
//            details: { PhoneNumber: ["أدخل رقم موبايل صحيح…"] } } }.
// The messages are already Arabic, so each is shown under its field. Keys
// are PascalCase: PhoneNumber, NewPhoneNumber, Name, FullName, Country,
// Region, EducationalStage, GradeLevel, InviterCode, Code.

export type AuthFieldErrors = Record<string, string>;

const FIELD_CODES = ["validation_error", "invalid_inviter_code"];

export function authFieldErrors(error: unknown): AuthFieldErrors | null {
  if (!axios.isAxiosError(error) || error.response?.status !== 400) return null;
  const body = (error.response.data ?? {}) as {
    code?: string;
    details?: Record<string, unknown>;
    error?: { code?: string; details?: Record<string, unknown> } | string;
  };
  const coded = typeof body.error === "object" && body.error ? body.error : body;
  if (!coded.code || !FIELD_CODES.includes(coded.code) || !coded.details) return null;

  const out: AuthFieldErrors = {};
  for (const [key, value] of Object.entries(coded.details)) {
    const message = Array.isArray(value) ? value[0] : value;
    if (typeof message === "string" && message.trim()) {
      // "$.region" (a wrong JSON type) → "Region".
      const name = key.replace(/^\$\./, "");
      out[name.charAt(0).toUpperCase() + name.slice(1)] = message;
    }
  }
  return Object.keys(out).length ? out : null;
}
