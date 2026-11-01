import axios from "axios";
import { getApiErrorMessage, getCodedApiError } from "./api-error";

// The auth endpoints answer in a flat { message, code?, retryAfterSeconds?,
// blocked? } shape (validation errors aside), with English messages. One
// place turns all of them into Arabic for the phone, Google and resend flows.
type OtpErrorBody = {
  message?: string;
  code?: string;
  retryAfterSeconds?: number;
  blocked?: boolean;
};

const bodyOf = (error: unknown): OtpErrorBody | undefined =>
  axios.isAxiosError(error) ? (error.response?.data as OtpErrorBody | undefined) : undefined;

// 429: how long before another code can be asked for.
export function otpRetryAfterSeconds(error: unknown): number | null {
  if (!axios.isAxiosError(error) || error.response?.status !== 429) return null;
  return bodyOf(error)?.retryAfterSeconds ?? 60;
}

const MESSAGES: [RegExp, string][] = [
  [/^Invalid (or expired )?(verification )?code/i, "رمز التحقق غير صحيح."],
  [/expired/i, "انتهت صلاحية الرمز. اطلب رمزًا جديدًا."],
  [/^No (pending authentication|code was requested)/i, "لم يُطلب رمز لهذا الرقم بعد. اطلب رمزًا جديدًا."],
  [/already (used|in use) by another account/i, "هذا الرقم مستخدم في حساب آخر."],
];

export function otpErrorMessage(error: unknown): string {
  const body = bodyOf(error);
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;

  if (status === 429) {
    return body?.blocked
      ? "طلبت رموزًا كثيرة. حاول مرة أخرى بعد 15 دقيقة."
      : `انتظر ${body?.retryAfterSeconds ?? 60} ثانية قبل طلب رمز جديد.`;
  }

  switch (body?.code) {
    case "otp_send_failed":
      return "تعذر إرسال الرمز عبر واتساب. حاول مرة أخرى بعد قليل.";
    case "otp_too_many_attempts":
      return "أدخلت رمزًا خاطئًا 5 مرات. اطلب رمزًا جديدًا.";
    case "google_token_invalid":
      return "انتهت جلسة تسجيل الدخول بجوجل. ابدأ من جديد.";
  }

  const coded = getCodedApiError<Record<string, string[]>>(error);
  if (coded?.code === "validation_error") {
    return coded.details && "PhoneNumber" in coded.details
      ? "أدخل رقم موبايل مصري صحيح: 01 ثم 9 أرقام."
      : "أدخل رمز التحقق.";
  }

  const message = body?.message ?? "";
  for (const [pattern, arabic] of MESSAGES) {
    if (pattern.test(message)) return arabic;
  }
  return getApiErrorMessage(error);
}

export const isGoogleTokenInvalid = (error: unknown) => bodyOf(error)?.code === "google_token_invalid";
