import axios from "axios";
import {
  ABSENT,
  CORE_FIELD_LABELS,
  DATE_OP_LABELS,
  FILTER_OP_LABELS,
  TRACKING_TABLE_ROLES,
} from "../constants/tracking-table.constants";
import {
  CellValue,
  ColumnType,
  CoreField,
  FilterOp,
  RowFilter,
  TrackingColumn,
  TrackingRow,
} from "../types/tracking-table.types";

// --- Errors ------------------------------------------------------------------

// Tracking-table errors carry a machine code (and sometimes details) next
// to the Arabic message: { code, message, details }.
export const apiErrorCode = (error: unknown): string | undefined => {
  if (!axios.isAxiosError(error)) return undefined;
  const data = error.response?.data as { code?: unknown; error?: { code?: unknown } } | undefined;
  const code = data?.code ?? data?.error?.code;
  return typeof code === "string" ? code : undefined;
};

export const apiErrorDetails = <T = Record<string, unknown>>(error: unknown): T | undefined => {
  if (!axios.isAxiosError(error)) return undefined;
  const data = error.response?.data as { details?: T } | undefined;
  return data?.details;
};

// --- Access ------------------------------------------------------------------

export const canUseTrackingTables = (user?: { role?: string | null; roles?: string[] } | null) => {
  const roles = [...(user?.roles ?? []), ...(user?.role ? [user.role] : [])];
  return roles.some((role) => TRACKING_TABLE_ROLES.includes(role));
};

// --- Fields ------------------------------------------------------------------

// A grid field is either one of the three fixed ones or a teacher's column.
export type GridField =
  | { kind: "core"; id: CoreField; label: string }
  | { kind: "column"; id: string; label: string; column: TrackingColumn };

export const coreField = (id: CoreField): GridField => ({ kind: "core", id, label: CORE_FIELD_LABELS[id] });

export const columnField = (column: TrackingColumn): GridField => ({
  kind: "column",
  id: column.id,
  label: column.name,
  column,
});

export const fieldType = (field: GridField): ColumnType | "Phone" =>
  field.kind === "column" ? field.column.type : field.id === "name" ? "Text" : "Phone";

export const rowValue = (row: TrackingRow, field: GridField): CellValue => {
  if (field.kind === "column") return row.values[field.id] ?? null;
  if (field.id === "name") return row.fullName;
  return row[field.id];
};

export const isEmptyValue = (value: CellValue | undefined) =>
  value === null || value === undefined || value === "";

// --- Cell display ------------------------------------------------------------

const dateFormat = new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "short", year: "numeric" });
const numberFormat = new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 2 });

export const formatNumber = (value: number) => numberFormat.format(value);

// The date part of an ISO value, for <input type="date">.
export const toDateInput = (value: CellValue) =>
  typeof value === "string" ? value.slice(0, 10) : "";

export const formatDate = (value: CellValue) => {
  const iso = toDateInput(value);
  if (!iso) return "";
  const date = new Date(`${iso}T00:00:00`);
  return Number.isNaN(date.getTime()) ? iso : dateFormat.format(date);
};

// Teachers often type Arabic-Indic digits (١٨) or a comma for the decimal.
export const normalizeDigits = (text: string) =>
  text
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٫,]/g, ".");

export const isAbsent = (value: CellValue) =>
  typeof value === "string" && value.toLowerCase() === ABSENT;

export const asNumber = (value: CellValue): number | null => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "" && !isAbsent(value)) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

// Score coloring: an exam score's share of the max mark.
export type ScoreTone = "high" | "mid" | "low";

export const scoreTone = (score: number, maxScore: number | null): ScoreTone | null => {
  if (!maxScore || maxScore <= 0) return null;
  const ratio = score / maxScore;
  return ratio >= 0.75 ? "high" : ratio >= 0.5 ? "mid" : "low";
};

export const SCORE_TONE_CLASSES: Record<ScoreTone, string> = {
  high: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200",
  mid: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200",
  low: "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200",
};

// --- Column summary (footer row) ---------------------------------------------

export interface ColumnSummary {
  primary: string;
  secondary?: string;
}

// Worked out over the students on screen.
export const summarizeColumn = (column: TrackingColumn, rows: TrackingRow[]): ColumnSummary | null => {
  if (rows.length === 0) return null;
  const values = rows.map((row) => row.values[column.id] ?? null);
  const filled = values.filter((v) => !isEmptyValue(v));

  switch (column.type) {
    case "Exam": {
      const absent = values.filter(isAbsent).length;
      const scores = values.map(asNumber).filter((n): n is number => n !== null);
      if (scores.length === 0) return absent ? { primary: `غياب ${formatNumber(absent)}` } : null;
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      return {
        primary: `متوسط ${formatNumber(avg)}${column.maxScore ? ` / ${formatNumber(column.maxScore)}` : ""}`,
        secondary: `أعلى ${formatNumber(Math.max(...scores))}${absent ? ` · غياب ${formatNumber(absent)}` : ""}`,
      };
    }
    case "Number": {
      const numbers = values.map(asNumber).filter((n): n is number => n !== null);
      if (numbers.length === 0) return null;
      const sum = numbers.reduce((a, b) => a + b, 0);
      return {
        primary: `متوسط ${formatNumber(sum / numbers.length)}`,
        secondary: `المجموع ${formatNumber(sum)}`,
      };
    }
    case "YesNo": {
      const yes = values.filter((v) => v === true).length;
      if (filled.length === 0) return null;
      return {
        primary: `نعم ${formatNumber(Math.round((yes / rows.length) * 100))}%`,
        secondary: `${formatNumber(yes)} من ${formatNumber(rows.length)}`,
      };
    }
    case "Choice": {
      if (filled.length === 0) return null;
      const counts = new Map<string, number>();
      filled.forEach((v) => counts.set(String(v), (counts.get(String(v)) ?? 0) + 1));
      const [top, count] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
      return { primary: top, secondary: `${formatNumber(count)} طالب` };
    }
    default:
      return { primary: `مملوء ${formatNumber(filled.length)} / ${formatNumber(rows.length)}` };
  }
};

// --- Filters -----------------------------------------------------------------

export const opsForType = (type: ColumnType | "Phone"): FilterOp[] => {
  switch (type) {
    case "Number":
    case "Exam":
      return ["eq", "neq", "gt", "gte", "lt", "lte", "empty", "notEmpty"];
    case "Date":
      return ["eq", "gt", "lt", "empty", "notEmpty"];
    case "YesNo":
      return ["eq", "empty"];
    case "Choice":
      return ["in", "neq", "empty", "notEmpty"];
    default:
      return ["contains", "eq", "neq", "empty", "notEmpty"];
  }
};

export const opLabel = (op: FilterOp, type: ColumnType | "Phone") =>
  (type === "Date" && DATE_OP_LABELS[op]) || FILTER_OP_LABELS[op];

export const opNeedsValue = (op: FilterOp) => op !== "empty" && op !== "notEmpty";

const describeValue = (value: RowFilter["value"], type: ColumnType | "Phone"): string => {
  if (Array.isArray(value)) return value.map((v) => describeValue(v, type)).join("، ");
  if (value === true) return "نعم";
  if (value === false) return "لا";
  if (isAbsent(value ?? null)) return "غائب";
  if (type === "Date") return formatDate(value ?? null);
  return String(value ?? "");
};

// "امتحان 1 أقل من 10", for the chip in the filter bar.
export const describeFilter = (filter: RowFilter, field: GridField | undefined) => {
  const type = field ? fieldType(field) : "Text";
  const label = field?.label ?? filter.field;
  const op = opLabel(filter.op, type);
  return opNeedsValue(filter.op) ? `${label} ${op} ${describeValue(filter.value, type)}` : `${label} ${op}`;
};

// The letter on a table's badge. Most group names start with "ال"
// (السبت، الأحد...), which would give every table the same "ا".
export const tableInitial = (name: string) => {
  const word = name.trim().split(/\s+/)[0] ?? "";
  return (word.startsWith("ال") && word.length > 2 ? word.slice(2) : word).charAt(0) || "؟";
};

// --- Files -------------------------------------------------------------------

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// Arabic group names are fine in a filename; only path characters go.
export const safeFileName = (name: string) => name.replace(/[\\/:*?"<>|]+/g, " ").trim() || "table";
