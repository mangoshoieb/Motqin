"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, UploadCloud } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { getApiErrorMessage } from "@/app/lib/api-error";
import {
  apiErrorCode,
  apiErrorDetails,
  apiErrorRawMessage,
  formatNumber,
  normalizeDigits,
} from "@/app/lib/tracking-table";
import {
  COLUMN_TYPES,
  COLUMN_TYPE_ORDER,
  CORE_FIELD_LABELS,
  CORE_FIELDS,
  TRACKING_LIMITS,
} from "@/app/constants/tracking-table.constants";
import { useImportTable, usePreviewImport } from "@/app/hooks/useTrackingTables";
import {
  ColumnType,
  CoreField,
  ImportOptions,
  ImportPreview,
  ImportPreviewColumn,
  ImportResult,
  RowWarning,
} from "@/app/types/tracking-table.types";
import { useTrackingAccess } from "@/app/hooks/useTrackingAccess";
import { FieldError, Modal, inputClass, primaryButton, secondaryButton } from "./ui";
import { TeacherPicker } from "./TeacherPicker";

const FILE_TOO_BIG = "حجم الملف أكبر من 5 ميجابايت";
const OLD_XLS = "الملف بصيغة xls القديمة، احفظه بصيغة xlsx ثم ارفعه";
const NOT_XLSX = "الملف غير مدعوم، المسموح ملفات Excel بصيغة xlsx";
const NO_FILE = "اختر ملف Excel";

// invalid_file covers several cases; its English message says which.
const fileErrorText = (error: unknown) => {
  if (apiErrorCode(error) === "invalid_file") {
    const raw = apiErrorRawMessage(error);
    if (/maximum size/i.test(raw)) return FILE_TOO_BIG;
    if (/\.xls\b|old excel/i.test(raw)) return OLD_XLS;
    if (/non-empty/i.test(raw)) return NO_FILE;
  }
  return getApiErrorMessage(error);
};

// Row warnings come back in English. Say the common ones in Arabic; anything
// else shows as sent.
const importWarningText = (message: string) => {
  const phone = message.match(/^"(.*)" isn't a valid (student|parent) mobile number/i);
  if (phone) {
    const whose = phone[2].toLowerCase() === "student" ? "الطالب" : "ولي الأمر";
    return `«${phone[1]}» ليس رقم موبايل صحيحًا لـ${whose}، فتُرك فارغًا. أدخله من صف الطالب.`;
  }
  // "امتحان 1: 25 is outside 0 - 20."
  const range = message.match(/^(.+?): (.+) is outside (.+?) - (.+?)\.?$/i);
  if (range) {
    return `${range[1]}: «${range[2]}» خارج المدى من ${range[3]} إلى ${range[4]}، فتُركت الخانة فارغة.`;
  }
  return message;
};

// One line per sheet row, its notes joined.
const warningsByRow = (warnings: RowWarning[]) => {
  const rows = new Map<number, string[]>();
  for (const w of warnings) rows.set(w.row, [...(rows.get(w.row) ?? []), importWarningText(w.message)]);
  return [...rows.entries()];
};

// The column name the import will use: an exam's header without "(من 20)".
const columnLabel = (column: ImportPreviewColumn, type: ColumnType | undefined) =>
  (type === "Exam" && column.name) || column.header || `عمود ${column.index + 1}`;

type Role = CoreField | "column";

// A refusal about one sheet column (max_score_required, too_many_choices…).
interface ColumnError {
  index: number;
  message: string;
}

export function ImportTableDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [groupName, setGroupName] = useState("");
  const [roles, setRoles] = useState<Record<number, Role>>({});
  const [types, setTypes] = useState<Record<number, ColumnType>>({});
  // Full marks typed for Exam columns the sheet gave none for.
  const [maxScores, setMaxScores] = useState<Record<number, string>>({});
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [columnError, setColumnError] = useState<ColumnError | null>(null);
  const [dragging, setDragging] = useState(false);

  const previewImport = usePreviewImport();
  const importTable = useImportTable();

  // An assistant imports into a teacher who gave them Import.
  const { isTeacher, importFor } = useTrackingAccess();
  const [forTeacherId, setForTeacherId] = useState(isTeacher ? "" : importFor[0]?.teacherId ?? "");

  const choose = async (picked: File | undefined) => {
    setError(null);
    if (!picked || picked.size === 0) {
      if (picked) setError(NO_FILE);
      return;
    }
    const lower = picked.name.toLowerCase();
    if (!lower.endsWith(".xlsx")) {
      setError(lower.endsWith(".xls") ? OLD_XLS : NOT_XLSX);
      return;
    }
    // Checked here too, so a big file isn't uploaded only to be refused.
    if (picked.size > TRACKING_LIMITS.IMPORT_FILE_BYTES) {
      setError(FILE_TOO_BIG);
      return;
    }
    try {
      const data = await previewImport.mutateAsync(picked);
      setFile(picked);
      setPreview(data);
      setGroupName(picked.name.replace(/\.xlsx$/i, "").slice(0, TRACKING_LIMITS.TABLE_NAME));
      setRoles(Object.fromEntries(data.columns.map((c) => [c.index, c.coreField ?? "column"])));
      setTypes(Object.fromEntries(data.columns.map((c) => [c.index, c.guessedType])));
      setMaxScores({});
      setColumnError(null);
      setNameError(null);
    } catch (err) {
      setError(fileErrorText(err));
    }
  };

  // Each fixed field can come from one sheet column only.
  const setRole = (index: number, role: Role) =>
    setRoles((prev) => {
      const next = { ...prev };
      if (role !== "column") {
        for (const key of Object.keys(next)) if (next[+key] === role) next[+key] = "column";
      }
      next[index] = role;
      return next;
    });

  const setType = (index: number, type: ColumnType) => {
    setTypes((prev) => ({ ...prev, [index]: type }));
    if (columnError?.index === index) setColumnError(null);
  };

  // Exam columns that need a full mark typed: the sheet's header had none.
  const needsMaxScore = (column: ImportPreviewColumn) =>
    roles[column.index] === "column" && types[column.index] === "Exam" && !column.maxScore;

  const typedScore = (index: number) => {
    const n = Number(normalizeDigits(maxScores[index] ?? ""));
    return Number.isFinite(n) && n >= 1 && n <= TRACKING_LIMITS.MAX_SCORE ? n : null;
  };

  const missingScore = !!preview?.columns.some((c) => needsMaxScore(c) && typedScore(c.index) === null);

  const submit = async () => {
    if (!file || !preview || !groupName.trim() || missingScore) return;
    setError(null);
    setNameError(null);
    setColumnError(null);
    const indexOf = (field: CoreField) => {
      const entry = Object.entries(roles).find(([, role]) => role === field);
      return entry ? Number(entry[0]) : -1;
    };
    const asColumns = preview.columns.filter((c) => roles[c.index] === "column");
    // Only the columns changed from guessedType.
    const overrides = Object.fromEntries(
      asColumns.filter((c) => types[c.index] !== c.guessedType).map((c) => [String(c.index), types[c.index]]),
    );
    const scores = Object.fromEntries(
      asColumns.filter(needsMaxScore).map((c) => [String(c.index), typedScore(c.index)!]),
    );
    // Only the fixed fields the user moved away from what the preview
    // recognised; the server keeps its own pick for the rest. -1 = none.
    const recognised = (field: CoreField) =>
      preview.columns.find((c) => c.coreField === field)?.index ?? -1;
    const options: ImportOptions = {
      ...(Object.keys(overrides).length ? { types: overrides } : {}),
      ...(Object.keys(scores).length ? { maxScores: scores } : {}),
      ...(forTeacherId ? { forTeacherId } : {}),
    };
    for (const field of CORE_FIELDS) {
      if (indexOf(field) !== recognised(field)) options[field] = indexOf(field);
    }
    try {
      setResult(await importTable.mutateAsync({ file, groupName: groupName.trim(), options }));
    } catch (err) {
      const code = apiErrorCode(err);
      const message = getApiErrorMessage(err);
      const index = apiErrorDetails<{ index?: unknown }>(err)?.index;
      if (code === "group_name_required" || code === "name_too_long") {
        setNameError(message);
      } else if (typeof index === "number" && preview.columns.some((c) => c.index === index)) {
        // too_many_choices, max_score_required, options_required…: on that column.
        setColumnError({
          index,
          message: code === "too_many_choices" ? `${message}. جرّب «${COLUMN_TYPES.Text.label}».` : message,
        });
      } else {
        setError(fileErrorText(err));
      }
    }
  };

  const nameMissing = preview && !Object.values(roles).includes("name");

  // --- Step 3: done ---
  if (result) {
    const notes = warningsByRow(result.warnings ?? []);
    return (
      <Modal
        title="تم استيراد الجدول"
        onClose={onClose}
        footer={
          <button
            type="button"
            onClick={() => router.push(`/tracking-tables/${result.groupId}`)}
            className={cn(primaryButton, "flex-1")}
          >
            فتح الجدول
          </button>
        }
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <CheckCircle2 size={44} className="text-emerald-500 dark:text-emerald-400" />
          <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            تم استيراد {formatNumber(result.rows)} طالب و{formatNumber(result.columns)} عمود
          </p>
          {!result.coreFields.name && (
            <p className="text-sm text-amber-700 dark:text-amber-400">
              لم يُحدد عمود الاسم. افتح الجدول واختر عمود الاسم من قائمة &quot;الأعمدة الأساسية&quot;.
            </p>
          )}
        </div>
        {/* Which sheet column filled each fixed field — those columns aren't
            added again as table columns. */}
        <ul className="mt-4 flex flex-col gap-1 rounded-2xl bg-zinc-50 px-4 py-3 text-sm dark:bg-zinc-800/50">
          {CORE_FIELDS.map((field) => (
            <li key={field} className="flex items-center justify-between gap-3">
              <span className="text-zinc-500">{CORE_FIELD_LABELS[field]}</span>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {result.coreFields[field] ?? "—"}
              </span>
            </li>
          ))}
        </ul>
        {notes.length > 0 && (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
            <p className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-800 dark:text-amber-300">
              <AlertTriangle size={16} /> ملاحظات على {formatNumber(notes.length)} صف
            </p>
            <ul className="max-h-48 space-y-1 overflow-y-auto text-sm text-amber-900 dark:text-amber-200">
              {notes.map(([row, messages]) => (
                <li key={row}>
                  <span className="font-semibold tabular-nums">صف {formatNumber(row)}:</span> {messages.join(" · ")}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Modal>
    );
  }

  // --- Step 2: check the columns ---
  if (preview) {
    return (
      <Modal
        title="مراجعة الاستيراد"
        description={`${preview.sheetName} · ${formatNumber(preview.rowCount)} طالب · ${formatNumber(preview.columns.length)} عمود. لم يُحفظ شيء بعد.`}
        onClose={onClose}
        className="max-w-3xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setPreview(null);
                setFile(null);
                setError(null);
              }}
              className={cn(secondaryButton, "flex-1")}
            >
              ملف آخر
            </button>
            <button
              type="button"
              onClick={() => void submit()}
              disabled={!groupName.trim() || missingScore || importTable.isPending}
              className={cn(primaryButton, "flex-1")}
            >
              {importTable.isPending ? "جارٍ الاستيراد..." : "استيراد"}
            </button>
          </>
        }
      >
        <div className="mb-4">
          <TeacherPicker value={forTeacherId} onChange={setForTeacherId} isTeacher={isTeacher} links={importFor} />
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">اسم المجموعة</span>
          <input
            dir="auto"
            value={groupName}
            maxLength={TRACKING_LIMITS.TABLE_NAME}
            onChange={(e) => {
              setGroupName(e.target.value);
              setNameError(null);
            }}
            aria-invalid={!!nameError}
            className={inputClass}
          />
          <FieldError message={nameError ?? (!groupName.trim() ? "اسم المجموعة مطلوب" : null)} />
        </label>

        <p className="mt-5 mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">أعمدة الملف</p>
        <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
          {preview.columns.map((column) => {
            const role = roles[column.index] ?? "column";
            const type = types[column.index];
            const samples = preview.sampleRows
              .map((row) => row[column.index])
              .filter(Boolean)
              .slice(0, 3);
            const asColumn = role === "column";
            const examFromSheet = asColumn && type === "Exam" && !!column.maxScore;
            const rowError = columnError?.index === column.index ? columnError.message : null;
            return (
              <div
                key={column.index}
                className={cn(
                  "border-b border-zinc-100 px-4 py-3 last:border-0 dark:border-zinc-800",
                  rowError && "bg-rose-50 dark:bg-rose-500/10",
                )}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-40 flex-1">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {columnLabel(column, asColumn ? type : undefined)}
                      {examFromSheet && (
                        <span className="ms-1.5 text-xs font-normal text-zinc-500">
                          من {formatNumber(column.maxScore!)}
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-zinc-500">{samples.join(" · ") || "بدون أمثلة"}</p>
                  </div>
                  <select
                    value={role}
                    onChange={(e) => setRole(column.index, e.target.value as Role)}
                    className={cn(inputClass, "w-auto py-2")}
                  >
                    <option value="column">عمود عادي</option>
                    {CORE_FIELDS.map((field) => (
                      <option key={field} value={field}>
                        {CORE_FIELD_LABELS[field]}
                      </option>
                    ))}
                  </select>
                  {asColumn && (
                    <select
                      value={type}
                      onChange={(e) => setType(column.index, e.target.value as ColumnType)}
                      aria-invalid={!!rowError}
                      className={cn(inputClass, "w-auto py-2")}
                    >
                      {COLUMN_TYPE_ORDER.map((option) => (
                        <option key={option} value={option}>
                          {COLUMN_TYPES[option].label}
                        </option>
                      ))}
                    </select>
                  )}
                  {asColumn && needsMaxScore(column) && (
                    <label className="flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                      الدرجة النهائية
                      <input
                        dir="ltr"
                        inputMode="decimal"
                        value={maxScores[column.index] ?? ""}
                        onChange={(e) => {
                          setMaxScores((prev) => ({ ...prev, [column.index]: e.target.value }));
                          if (columnError?.index === column.index) setColumnError(null);
                        }}
                        placeholder="20"
                        aria-invalid={typedScore(column.index) === null}
                        className={cn(inputClass, "w-20 py-2 text-center")}
                      />
                    </label>
                  )}
                </div>
                {asColumn && type === "Choice" && !rowError && (
                  <p className="mt-1.5 text-xs text-zinc-500">
                    الاختيارات تؤخذ من القيم المختلفة في هذا العمود (حتى 30 اختيارًا).
                  </p>
                )}
                {asColumn && needsMaxScore(column) && (maxScores[column.index] ?? "") !== "" && typedScore(column.index) === null && (
                  <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">
                    الدرجة النهائية من 1 إلى {formatNumber(TRACKING_LIMITS.MAX_SCORE)}
                  </p>
                )}
                {rowError && <p className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">{rowError}</p>}
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          أعمدة الاسم والأرقام تملأ الحقول الأساسية فقط، ولا تُضاف إلى الجدول كأعمدة. القيمة التي لا تناسب نوع عمودها
          تُترك فارغة وتظهر في الملاحظات بعد الاستيراد.
        </p>
        {missingScore && (
          <p className="mt-3 text-sm text-amber-700 dark:text-amber-400">حدد الدرجة النهائية لكل عمود امتحان.</p>
        )}
        {nameMissing && (
          <p className="mt-3 text-sm text-amber-700 dark:text-amber-400">اختر العمود الذي فيه اسم الطالب.</p>
        )}
        {error && <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">{error}</p>}
      </Modal>
    );
  }

  // --- Step 1: pick the file ---
  return (
    <Modal
      title="استيراد من Excel"
      description="الاسم والأرقام تملأ الحقول الأساسية، وباقي الأعمدة تصبح أعمدة في الجدول."
      onClose={onClose}
    >
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void choose(e.dataTransfer.files[0]);
        }}
        disabled={previewImport.isPending}
        className={cn(
          "flex w-full flex-col items-center gap-3 rounded-3xl border-2 border-dashed px-6 py-10 text-center transition",
          dragging
            ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10"
            : "border-zinc-300 hover:border-blue-400 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800/50",
        )}
      >
        <span className="flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/15">
          {previewImport.isPending ? <UploadCloud size={28} className="animate-pulse" /> : <FileSpreadsheet size={28} />}
        </span>
        <span className="font-bold text-zinc-900 dark:text-zinc-100">
          {previewImport.isPending ? "جارٍ قراءة الملف..." : "اسحب الملف هنا أو اضغط للاختيار"}
        </span>
        <span className="text-xs text-zinc-500">xlsx فقط · حتى 5 ميجابايت · حتى 1000 طالب و50 عمود</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        onChange={(e) => {
          void choose(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {error && <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">{error}</p>}
    </Modal>
  );
}
