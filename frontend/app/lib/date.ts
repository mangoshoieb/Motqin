// The one place the app reads and shows dates from the API. Three kinds come
// back (Tracking Tables Front Guide, "Dates in every API", 24 Nov 2026):
//
// - Moments (something happened at an instant: createdAt, updatedAt, a
//   session's startTime…): UTC with a Z, "2026-11-24T14:30:00Z". Read with
//   parseMoment and show in the viewer's own clock — Intl does the time zone,
//   so nothing here adds 2 hours. Older servers sent the same UTC value
//   without a zone; parseMoment reads a bare one as UTC too.
// - Calendar days ("2026-11-24": a plan's date, the quote of the day): text.
//   Never new Date(day) — that's UTC midnight and shows the day before west
//   of Greenwich. Use formatCalendarDay / todayLocal.
// - Local times the student picked (busy times, classes): "2026-11-28T10:00:00"
//   with no zone, shown and sent as is (10:00 is 10:00). Use
//   parseLocalDateTime / toLocalDateTime.

const ZONE = /(?:[zZ]|[+-]\d{2}:?\d{2})$/;

export const hasZone = (value: string) => ZONE.test(value.trim());

/** A moment from the API as a Date (null when missing or unreadable). */
export const parseMoment = (value?: string | null): Date | null => {
  if (!value) return null;
  const trimmed = value.trim();
  const date = new Date(hasZone(trimmed) ? trimmed : `${trimmed}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

/** The same, as epoch milliseconds. */
export const momentMs = (value?: string | null): number | null => parseMoment(value)?.getTime() ?? null;

/** A moment to send: always UTC with a Z. */
export const nowIso = () => new Date().toISOString();

// --- Showing moments -----------------------------------------------------------

const MOMENT_FORMATS = {
  date: new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "long", year: "numeric" }),
  shortDate: new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "short", year: "numeric" }),
  dateTime: new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }),
  shortDateTime: new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }),
  time: new Intl.DateTimeFormat("ar-EG", { hour: "numeric", minute: "2-digit" }),
};

export type MomentStyle = keyof typeof MOMENT_FORMATS;

/** A moment in the viewer's time ("24 نوفمبر 2026، 4:30 م" in Cairo). */
export const formatMoment = (value: string | null | undefined, style: MomentStyle = "dateTime", fallback = "—") => {
  const date = parseMoment(value);
  return date ? MOMENT_FORMATS[style].format(date) : fallback;
};

// Arabic counted nouns: 1 → the word, 2 → the dual, 3–10 → plural, 11+ → singular.
const counted = (n: number, [one, two, few, many]: [string, string, string, string]) =>
  n === 1 ? one : n === 2 ? two : n <= 10 ? `${n} ${few}` : `${n} ${many}`;

/** "منذ دقيقة", "منذ 3 ساعات" — from Date.now(), so it follows the viewer's clock. */
export const timeAgo = (value: string | null | undefined, now = Date.now()) => {
  const at = momentMs(value);
  if (at === null) return "";
  const minutes = Math.floor((now - at) / 60_000);
  if (minutes < 1) return "الآن";
  if (minutes < 60) return `منذ ${counted(minutes, ["دقيقة", "دقيقتين", "دقائق", "دقيقة"])}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${counted(hours, ["ساعة", "ساعتين", "ساعات", "ساعة"])}`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `منذ ${counted(days, ["يوم", "يومين", "أيام", "يومًا"])}`;
  return formatMoment(value, "date");
};

// --- Calendar days -------------------------------------------------------------

const pad = (n: number) => String(n).padStart(2, "0");

/** A Date's day on the device, "YYYY-MM-DD". */
export const localDay = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** Today on the device — the server's "today" is the student's day too. */
export const todayLocal = () => localDay(new Date());

/** The day a moment fell on, in the viewer's time. */
export const localDayOfMoment = (value: string | null | undefined): string | null => {
  const date = parseMoment(value);
  return date ? localDay(date) : null;
};

/** "2026-11-24" (or "2026-11-24T00:00:00" from older servers) → a local Date at midnight. */
export const calendarDayToDate = (day: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(day.trim());
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null;
};

/** A calendar day as text: "YYYY-MM-DD" only, whatever the server added. */
export const calendarDay = (day: string | null | undefined) => (day ? day.trim().slice(0, 10) : "");

/** A calendar day shown in Arabic, without any time-zone shift. */
export const formatCalendarDay = (
  day: string | null | undefined,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" },
  locale = "ar-EG",
) => {
  const date = day ? calendarDayToDate(day) : null;
  return date ? new Intl.DateTimeFormat(locale, options).format(date) : calendarDay(day);
};

// --- Local times the student picked -------------------------------------------

/** "2026-11-28T10:00:00" → a Date at 10:00 on the device, with no zone conversion. */
export const parseLocalDateTime = (value: string | null | undefined): Date | null => {
  const match = value ? /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/.exec(value.trim()) : null;
  if (!match) return null;
  const [, y, mo, d, h, mi, s] = match.map(Number);
  return new Date(y, mo - 1, d, h, mi, Number.isFinite(s) ? s : 0);
};

/** "HH:mm" from a picked time, either "10:00:00" or "2026-11-28T10:00:00" — as sent, no conversion. */
export const wallClock = (value: string | null | undefined) => {
  const match = value ? /(?:^|[T ])(\d{2}):(\d{2})/.exec(value.trim()) : null;
  return match ? `${match[1]}:${match[2]}` : "";
};

/** A Date as the student's wall clock, "YYYY-MM-DDTHH:mm:ss" with no Z. */
export const toLocalDateTime = (date: Date) =>
  `${localDay(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
