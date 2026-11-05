import axios from "axios";
import { toast } from "sonner";
import { getApiErrorMessage, getCodedApiError, isAuthGateError } from "./api-error";
import { BLOCKER_LIMITS } from "../constants/distraction-blocker.constants";
import {
  BlockerErrorBody,
  BlockerSettings,
  BlockSchedule,
  BlockScheduleInput,
} from "../types/distraction-blocker.types";

// Some moments come back without a "Z" ("2026-10-28T17:04:10.427") but are
// UTC all the same — read bare, they'd land 2–3 hours off.
export function parseUtc(value: string | null | undefined): Date | null {
  if (!value) return null;
  const hasZone = /(Z|[+-]\d\d:?\d\d)$/i.test(value);
  const date = new Date(hasZone ? value : `${value}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

const clockFormat = new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
  hour: "numeric",
  minute: "2-digit",
});

export const formatClock = (date: Date) => clockFormat.format(date);

// "17:00:00" (what the API returns) → "17:00" (what it takes, and what a
// time input holds).
export const toHHmm = (time: string | null | undefined) => (time ? time.slice(0, 5) : "");

// "17:00" → "5:00 م". Schedule times are the phone's wall clock, not UTC.
export function formatTimeOfDay(time: string | null | undefined): string {
  const [hours, minutes] = toHHmm(time).split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return "";
  return clockFormat.format(new Date(2000, 0, 1, hours, minutes));
}

// An end before the start means the window runs past midnight.
export const crossesMidnight = (start: string | null | undefined, end: string | null | undefined) =>
  Boolean(start && end) && toHHmm(end) < toHHmm(start);

// The lock is in force unless a mentor's code opened it and that window
// hasn't passed yet.
export function isBlockerLocked(
  settings: Pick<BlockerSettings, "lockedByMentor" | "unlockedUntil"> | undefined,
  now = Date.now(),
): boolean {
  if (!settings?.lockedByMentor) return false;
  const until = parseUtc(settings.unlockedUntil);
  return !until || until.getTime() <= now;
}

// Mirrors what the server keeps: the host only, lower-case, without "www.".
// Returns null for anything that isn't a website. The server has the final
// word; this only catches typos before a save.
export function normalizeWebsite(input: string): string | null {
  const raw = input.trim().toLowerCase();
  if (!raw || /\s/.test(raw) || raw.length > BLOCKER_LIMITS.ENTRY_LENGTH) return null;

  let host: string;
  try {
    host = new URL(/^[a-z][a-z0-9+.-]*:\/\//.test(raw) ? raw : `http://${raw}`).hostname;
  } catch {
    return null;
  }

  host = host.replace(/^www\./, "").replace(/\.$/, "");
  return /^([a-z0-9-]+\.)+[a-z0-9-]{2,}$/.test(host) ? host : null;
}

// PUT /schedules/{id} takes the whole schedule, so a one-field change (the
// on/off switch) still sends everything back.
export function scheduleToInput(
  schedule: BlockSchedule,
  patch: Partial<BlockScheduleInput> = {},
): BlockScheduleInput {
  const base: BlockScheduleInput = schedule.blockUntilPlanCompleted
    ? { days: schedule.days, blockUntilPlanCompleted: true, isEnabled: schedule.isEnabled }
    : {
        days: schedule.days,
        blockUntilPlanCompleted: false,
        startTime: toHHmm(schedule.startTime),
        endTime: toHHmm(schedule.endTime),
        isEnabled: schedule.isEnabled,
      };
  return { ...base, ...patch };
}

// ---------------------------------------------------------------------------
// Errors. The mentor lock, the running block and the unlock flow come back
// as { error: { code, message, details } }; every other rule is a plain
// English sentence in `message`. Both are turned into Arabic here.
// ---------------------------------------------------------------------------

export const getBlockerError = (error: unknown) =>
  getCodedApiError<BlockerErrorBody["details"]>(error) as BlockerErrorBody | null;

const DAY_NAMES_AR: Record<string, string> = {
  Saturday: "السبت",
  Sunday: "الأحد",
  Monday: "الاثنين",
  Tuesday: "الثلاثاء",
  Wednesday: "الأربعاء",
  Thursday: "الخميس",
  Friday: "الجمعة",
};

const RULE_MESSAGES: [RegExp, string | ((match: RegExpMatchArray) => string)][] = [
  [/^Set up your planner preferences/i, "اضبط تفضيلات المخطط أولًا، ثم عُد لإعداد منع المشتتات."],
  [/^'(.+)' is not a valid website/i, (m) => `«${m[1]}» ليس موقعًا صالحًا.`],
  [/^An app id cannot be longer/i, `معرّف التطبيق لا يزيد عن ${BLOCKER_LIMITS.ENTRY_LENGTH} حرفًا.`],
  [/^A website cannot be longer/i, `الموقع لا يزيد عن ${BLOCKER_LIMITS.ENTRY_LENGTH} حرفًا.`],
  [/^You can allow at most/i, `يمكنك السماح بـ ${BLOCKER_LIMITS.APPS} تطبيق على الأكثر.`],
  [/^You can block at most/i, `يمكنك حجب ${BLOCKER_LIMITS.WEBSITES} موقع على الأكثر.`],
  [/^Choose at least one day/i, "اختر يومًا واحدًا على الأقل."],
  [/^Days must be between/i, "أحد الأيام المختارة غير صالح."],
  [/^StartTime and EndTime are required/i, "حدد وقت بداية الحجب ونهايته."],
  [/^StartTime and EndTime cannot be the same/i, "وقت البداية والنهاية لا يمكن أن يتطابقا."],
  [/has no StartTime or EndTime/i, "جدول «حتى إنهاء الخطة» لا يأخذ وقت بداية أو نهاية."],
  [
    /^These days already have a 'block until plan is completed' schedule: (.+?)\.?$/i,
    (m) =>
      `هذه الأيام لها جدول «حتى إنهاء الخطة» مفعّل بالفعل: ${m[1]
        .split(/,\s*/)
        .map((day) => DAY_NAMES_AR[day] ?? day)
        .join("، ")}.`,
  ],
  [/^Block schedule not found/i, "لم يُعثر على هذا الجدول، ربما حُذف من جهاز آخر."],
];

// Arabic agreement: 1 محاولة, 2 محاولتان, 3–10 محاولات, 11+ محاولة.
const formatAttemptsLeft = (count: number) => {
  if (count <= 0) return "لم تبقَ محاولات.";
  if (count === 1) return "بقيت محاولة واحدة.";
  if (count === 2) return "بقيت محاولتان.";
  if (count <= 10) return `بقيت ${count} محاولات.`;
  return `بقيت ${count} محاولة.`;
};

export function blockerErrorMessage(error: unknown): string {
  const coded = getBlockerError(error);
  if (coded) {
    switch (coded.code) {
      case "blocker_locked":
        return "قفل مشرفك هذه الإعدادات. اطلب منه رمزًا لتعديلها.";
      case "block_running": {
        const endsAt = parseUtc(coded.details?.endsAt);
        return endsAt
          ? `يعمل حجب الآن على هاتفك حتى ${formatClock(endsAt)}. عدّل بعد انتهائه.`
          : "يعمل حجب الآن على هاتفك. عدّل بعد انتهائه.";
      }
      case "blocker_not_locked":
        return "إعداداتك ليست مقفلة الآن.";
      case "cooldown":
        return coded.details?.retryAfterSeconds
          ? `انتظر ${coded.details.retryAfterSeconds} ثانية قبل طلب رمز جديد.`
          : "انتظر قليلًا قبل طلب رمز جديد.";
      case "unlock_code_invalid":
        return coded.details?.attemptsLeft !== undefined
          ? `رمز غير صحيح. ${formatAttemptsLeft(coded.details.attemptsLeft)}`
          : "رمز غير صحيح.";
      case "unlock_code_expired":
        return "انتهت صلاحية هذا الرمز. اطلب رمزًا جديدًا من مشرفك.";
      case "validation_error":
        return "بعض البيانات المرسلة غير صالحة.";
      default:
        // The server's Arabic catalogue; coded.message is English.
        return getApiErrorMessage(error);
    }
  }

  const message = getApiErrorMessage(error);
  for (const [pattern, arabic] of RULE_MESSAGES) {
    const match = message.match(pattern);
    if (match) return typeof arabic === "string" ? arabic : arabic(match);
  }
  return message;
}

export const isPlannerPreferencesMissing = (error: unknown) =>
  /^Set up your planner preferences/i.test(getApiErrorMessage(error));

export function toastBlockerError(label: string, error: unknown): void {
  // The signup/subscribe popup is already explaining this one.
  if (isAuthGateError(error)) return;

  console.error(label, axios.isAxiosError(error) ? error.response?.data : error);
  toast.error(label, { description: blockerErrorMessage(error) });
}
