import {
  CalendarDays,
  GraduationCap,
  Hash,
  ListChecks,
  ToggleRight,
  Type,
  type LucideIcon,
} from "lucide-react";
import {
  ColumnType,
  CoreField,
  FilterOp,
  ReportMessageStatus,
} from "../types/tracking-table.types";

const BASE = "/tracking-tables";

export const TRACKING_TABLE_ROUTES = {
  TABLES: BASE,
  TABLE: (groupId: string) => `${BASE}/${groupId}`,
  RESTORE_TABLE: (groupId: string) => `${BASE}/${groupId}/restore`,
  COLUMNS: (groupId: string) => `${BASE}/${groupId}/columns`,
  COLUMN: (groupId: string, columnId: string) => `${BASE}/${groupId}/columns/${columnId}`,
  RESTORE_COLUMN: (groupId: string, columnId: string) =>
    `${BASE}/${groupId}/columns/${columnId}/restore`,
  COLUMN_ORDER: (groupId: string) => `${BASE}/${groupId}/columns/order`,
  ROWS: (groupId: string) => `${BASE}/${groupId}/rows`,
  ROW: (groupId: string, rowId: number) => `${BASE}/${groupId}/rows/${rowId}`,
  RESTORE_ROW: (groupId: string, rowId: number) => `${BASE}/${groupId}/rows/${rowId}/restore`,
  QUERY_ROWS: (groupId: string) => `${BASE}/${groupId}/rows/query`,
  CORE_FIELDS: (groupId: string) => `${BASE}/${groupId}/core-fields`,
  IMPORT_PREVIEW: `${BASE}/import/preview`,
  IMPORT: `${BASE}/import`,
  EXPORT: (groupId: string) => `${BASE}/${groupId}/export`,
  REPORT_TEMPLATES: `${BASE}/report-templates`,
  PREPARE_REPORT: (groupId: string) => `${BASE}/${groupId}/prepare-report`,
  PREPARED_REPORTS: `${BASE}/reports/prepared`,
  REPORTS: `${BASE}/reports`,
  REPORT: (batchId: string) => `${BASE}/reports/${batchId}`,
  ALLOW_REPORT: (batchId: string) => `${BASE}/reports/${batchId}/allow`,
  STOP_REPORT: (batchId: string) => `${BASE}/reports/${batchId}/stop`,
};

// Backend limits, so the UI can stop before the server refuses.
export const TRACKING_LIMITS = {
  TABLE_NAME: 100,
  COLUMN_NAME: 50,
  STUDENT_NAME: 150,
  TEXT_VALUE: 500,
  MAX_SCORE: 1000,
  IMPORT_FILE_BYTES: 5 * 1024 * 1024,
};

export const ROWS_PAGE_SIZE = 100;

// Who sees the page. The admin roles are the ones the backend lets into its
// tracking-table admin screen.
export const TRACKING_TABLE_ROLES = ["Teacher", "Admin", "Manager", "Support"];

export const COLUMN_TYPES: Record<
  ColumnType,
  { label: string; hint: string; Icon: LucideIcon }
> = {
  Text: { label: "نص", hint: "ملاحظة قصيرة حتى 500 حرف", Icon: Type },
  Number: { label: "رقم", hint: "حضور، واجبات، أي عدد", Icon: Hash },
  Date: { label: "تاريخ", hint: "موعد تسليم أو حصة", Icon: CalendarDays },
  YesNo: { label: "نعم / لا", hint: "سلّم الواجب؟ حضر؟", Icon: ToggleRight },
  Choice: { label: "اختيار", hint: "قائمة تحددها: ممتاز، جيد...", Icon: ListChecks },
  Exam: { label: "امتحان", hint: "درجة من الدرجة النهائية أو غائب", Icon: GraduationCap },
};

export const COLUMN_TYPE_ORDER: ColumnType[] = ["Exam", "Number", "YesNo", "Choice", "Date", "Text"];

export const CORE_FIELD_LABELS: Record<CoreField, string> = {
  name: "اسم الطالب",
  studentPhone: "رقم الطالب",
  parentPhone: "رقم ولي الأمر",
};

export const CORE_FIELDS: CoreField[] = ["name", "studentPhone", "parentPhone"];

export const ABSENT = "absent";

export const FILTER_OP_LABELS: Record<FilterOp, string> = {
  eq: "يساوي",
  neq: "لا يساوي",
  contains: "يحتوي على",
  gt: "أكبر من",
  gte: "أكبر من أو يساوي",
  lt: "أقل من",
  lte: "أقل من أو يساوي",
  empty: "فارغ",
  notEmpty: "غير فارغ",
  in: "أحد",
};

// Same ops, worded for dates.
export const DATE_OP_LABELS: Partial<Record<FilterOp, string>> = {
  eq: "في يوم",
  gt: "بعد",
  lt: "قبل",
};

// The whole-table look: one accent color and one row size, kept per table in
// the browser (the API has nowhere to store them).
export type TableColor =
  | "blue"
  | "violet"
  | "emerald"
  | "amber"
  | "rose"
  | "cyan"
  | "orange"
  | "slate";

export const TABLE_COLORS: Record<
  TableColor,
  { label: string; swatch: string; gradient: string; soft: string; text: string; ring: string }
> = {
  blue: {
    label: "أزرق",
    swatch: "bg-blue-500",
    gradient: "from-blue-500 to-indigo-600",
    soft: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-300",
    ring: "ring-blue-500",
  },
  violet: {
    label: "بنفسجي",
    swatch: "bg-violet-500",
    gradient: "from-violet-500 to-purple-600",
    soft: "bg-violet-50 dark:bg-violet-950/40",
    text: "text-violet-700 dark:text-violet-300",
    ring: "ring-violet-500",
  },
  emerald: {
    label: "أخضر",
    swatch: "bg-emerald-500",
    gradient: "from-emerald-500 to-teal-600",
    soft: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    ring: "ring-emerald-500",
  },
  amber: {
    label: "ذهبي",
    swatch: "bg-amber-500",
    gradient: "from-amber-400 to-orange-500",
    soft: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    ring: "ring-amber-500",
  },
  rose: {
    label: "وردي",
    swatch: "bg-rose-500",
    gradient: "from-rose-500 to-pink-600",
    soft: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-300",
    ring: "ring-rose-500",
  },
  cyan: {
    label: "سماوي",
    swatch: "bg-cyan-500",
    gradient: "from-cyan-500 to-sky-600",
    soft: "bg-cyan-50 dark:bg-cyan-950/40",
    text: "text-cyan-700 dark:text-cyan-300",
    ring: "ring-cyan-500",
  },
  orange: {
    label: "برتقالي",
    swatch: "bg-orange-500",
    gradient: "from-orange-500 to-red-500",
    soft: "bg-orange-50 dark:bg-orange-950/40",
    text: "text-orange-700 dark:text-orange-300",
    ring: "ring-orange-500",
  },
  slate: {
    label: "رمادي",
    swatch: "bg-slate-500",
    gradient: "from-slate-500 to-zinc-700",
    soft: "bg-slate-100 dark:bg-slate-800/60",
    text: "text-slate-700 dark:text-slate-300",
    ring: "ring-slate-500",
  },
};

export const TABLE_COLOR_ORDER = Object.keys(TABLE_COLORS) as TableColor[];

export type TableDensity = "compact" | "normal" | "roomy";

export const TABLE_DENSITIES: Record<
  TableDensity,
  { label: string; row: string; cell: string; text: string }
> = {
  compact: { label: "صغير", row: "h-9", cell: "px-2.5", text: "text-xs" },
  normal: { label: "متوسط", row: "h-12", cell: "px-3.5", text: "text-sm" },
  roomy: { label: "كبير", row: "h-16", cell: "px-4", text: "text-[15px]" },
};

export const TABLE_DENSITY_ORDER: TableDensity[] = ["compact", "normal", "roomy"];

// Choice values get a stable chip color by their position in the options.
export const CHOICE_CHIP_COLORS = [
  "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200",
  "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200",
  "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200",
  "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200",
  "bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-200",
  "bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-200",
  "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-200",
  "bg-zinc-200 text-zinc-800 dark:bg-zinc-500/20 dark:text-zinc-200",
];

// --- Reports ---------------------------------------------------------------

// Where a template blank can take its text from (besides a column id or
// "text:..." fixed text).
export const REPORT_BLANK_SOURCES = [
  { value: "studentName", label: "اسم الطالب" },
  { value: "groupName", label: "اسم المجموعة" },
  { value: "teacherName", label: "اسم المعلم" },
];

export const REPORT_TEXT_PREFIX = "text:";

export const SKIP_REASON_LABELS: Record<string, string> = {
  no_parent_phone: "لا يوجد رقم ولي أمر",
  no_messages: "ولي الأمر لا يستقبل رسائل",
  empty_value: "خانة فارغة",
};

export const REPORT_STATUS_META: Record<
  ReportMessageStatus,
  { label: string; className: string }
> = {
  Draft: { label: "مسودة", className: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
  Queued: { label: "في الانتظار", className: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300" },
  Sending: { label: "جارٍ الإرسال", className: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300" },
  Sent: { label: "تم الإرسال", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" },
  Failed: { label: "فشل", className: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300" },
  Skipped: { label: "تم التخطي", className: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" },
  Cancelled: { label: "أُلغي", className: "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300" },
};

// Quota codes on prepare-report / allow that mean "buy or upgrade a bundle".
export const REPORT_PLAN_CODES = ["not_in_plan", "quota_exhausted"];

// How often an open report's progress is re-read while it is sending.
export const REPORT_POLL_MS = 3000;
