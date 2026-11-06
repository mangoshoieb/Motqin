import { ErrorCodeItem } from "../types/lookup.types";
import { PAYMENT_ERROR_DEFAULTS } from "../constants/payment.constants";

// The server's catalogue of Arabic messages per error code (GET
// /lookups/error-codes). Kept at module level so plain functions —
// getApiErrorMessage, the axios interceptor — can read it without React, and
// in localStorage for a day so it's there from the first paint of the next
// visit. ErrorCodesLoader fills it once per session.

const STORAGE_KEY = "motqin:error-codes";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

// Codes from the API guides that the live catalogue may not list yet (the
// tracking-table assistants and performance report ship in a later
// release). The guides' "Show" column; the catalogue's own copy wins.
const GUIDE_DEFAULTS: Record<string, string> = {
  ...PAYMENT_ERROR_DEFAULTS,
  user_not_found: "المستخدم غير موجود",
  cannot_assist_self: "لا يمكنك إضافة نفسك كمساعد",
  assistant_exists: "هذا الشخص مساعد لديك بالفعل، عدّل صلاحياته بدلاً من إضافته مرة أخرى",
  invalid_permission: "إحدى الصلاحيات غير معروفة",
  no_tables_chosen: "اختر جدولاً واحداً على الأقل أو كل الجداول",
  assistant_not_found: "المساعد غير موجود",
  assistant_permission_missing: "ليس لديك صلاحية لهذا الإجراء، اطلبها من المعلم",
  teacher_account_required: "إنشاء الجداول متاح لحسابات المعلمين فقط",
  batch_not_found: "التقرير غير موجود",
  exams_required: "اختر امتحاناً واحداً على الأقل",
  not_an_exam_column: "أحد الأعمدة المختارة ليس عمود امتحان",
  unknown_rows: "بعض الطلاب المختارين ليسوا في هذا الجدول",
  duplicate_core_column: "اخترت نفس العمود لأكثر من حقل أساسي",
};

const toMap = (items: ErrorCodeItem[]) =>
  new Map<string, string>([
    ...Object.entries(GUIDE_DEFAULTS),
    ...items.map((item) => [item.code, item.message] as [string, string]),
  ]);

let messages = toMap([]);

const readStored = () => {
  if (typeof window === "undefined") return;
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as {
      savedAt: number;
      items: ErrorCodeItem[];
    } | null;
    if (stored && Date.now() - stored.savedAt < MAX_AGE_MS) messages = toMap(stored.items);
  } catch {
    // Unreadable or blocked storage: the loader fills it from the network.
  }
};

readStored();

export function setErrorCatalogue(items: ErrorCodeItem[]) {
  messages = toMap(items);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ savedAt: Date.now(), items }));
  } catch {
    // Storage full or blocked — this session still has it in memory.
  }
}

export const errorCodeMessage = (code: string | undefined | null) =>
  code ? messages.get(code) : undefined;
