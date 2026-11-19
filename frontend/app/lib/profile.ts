import axios from "axios";

// Profile display rules from the profile guide.

// Phone and guest accounts get a placeholder address the user never typed.
export const isPlaceholderEmail = (email?: string | null) =>
  !email || email.toLowerCase().endsWith("@motqin.internal");

// Country comes back as 1 or "Egypt"; the governorate only applies there.
export const isEgypt = (country?: string | number | null) =>
  country === 1 || country === "1" || (typeof country === "string" && country.toLowerCase() === "egypt");

export const DESCRIPTION_MAX = 500;
export const NAME_MAX = 100;

export type ProfileField = "fullName" | "region" | "description" | "educationalStage" | "gradeLevel";
export type ProfileErrors = Partial<Record<ProfileField | "general", string>>;

const INVALID = "بعض البيانات المدخلة غير صحيحة";

const FIELD_KEYS: Record<string, ProfileField> = {
  fullname: "fullName",
  region: "region",
  description: "description",
  educationalstage: "educationalStage",
  gradelevel: "gradeLevel",
};

const messageFor = (field: ProfileField, raw: string) => {
  if (field === "fullName") return /exceed/i.test(raw) ? `الاسم أطول من ${NAME_MAX} حرف` : "الاسم مطلوب";
  if (field === "description") return `الوصف أطول من ${DESCRIPTION_MAX} حرف`;
  return INVALID;
};

// 400 validation_error from PUT /users/me: one `details` key per field
// ("FullName": ["Name cannot be empty."]). A wrong JSON type comes back
// under "dto" / "$.region" instead. Accepts the coded envelope
// ({ error: { details } }), a bare { details } and ASP.NET's { errors }.
export function profileErrors(error: unknown): ProfileErrors {
  if (!axios.isAxiosError(error) || error.response?.status !== 400) {
    return { general: "تعذر حفظ التغييرات، حاول مرة أخرى." };
  }
  const body = (error.response.data ?? {}) as {
    error?: { details?: Record<string, unknown> };
    details?: Record<string, unknown>;
    errors?: Record<string, unknown>;
  };
  const details = body.error?.details ?? body.details ?? body.errors ?? {};
  const out: ProfileErrors = {};
  for (const [key, value] of Object.entries(details)) {
    const field = FIELD_KEYS[key.replace(/^\$\./, "").toLowerCase()];
    const raw = Array.isArray(value) ? String(value[0] ?? "") : String(value ?? "");
    if (field) out[field] ??= messageFor(field, raw);
    else out.general = INVALID;
  }
  if (!Object.keys(out).length) out.general = INVALID;
  return out;
}
