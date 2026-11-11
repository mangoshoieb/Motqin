"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, UploadCloud } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { getApiErrorMessage } from "@/app/lib/api-error";
import {
  COLUMN_TYPES,
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
  ImportResult,
} from "@/app/types/tracking-table.types";
import { useTrackingAccess } from "@/app/hooks/useTrackingAccess";
import { Modal, inputClass, primaryButton, secondaryButton } from "./ui";
import { TeacherPicker } from "./TeacherPicker";

// Exam columns can't be imported directly (exam_after_import): bring them in
// as numbers and change the type afterwards.
const IMPORT_TYPES: ColumnType[] = ["Text", "Number", "Date", "YesNo", "Choice"];

// Row warnings come back in English. The phone one is by far the most common
// — say it in Arabic; anything else shows as sent.
const importWarningText = (message: string) => {
  const phone = message.match(/^"(.*)" isn't a valid (student|parent) mobile number/i);
  if (!phone) return message;
  const whose = phone[2].toLowerCase() === "student" ? "الطالب" : "ولي الأمر";
  return `«${phone[1]}» ليس رقم موبايل صحيحًا لـ${whose}، فتُرك فارغًا. أدخله من صف الطالب.`;
};

type Role = CoreField | "column";

export function ImportTableDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [groupName, setGroupName] = useState("");
  const [roles, setRoles] = useState<Record<number, Role>>({});
  const [types, setTypes] = useState<Record<number, ColumnType>>({});
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const previewImport = usePreviewImport();
  const importTable = useImportTable();

  // An assistant imports into a teacher who gave them Import.
  const { isTeacher, importFor } = useTrackingAccess();
  const [forTeacherId, setForTeacherId] = useState(isTeacher ? "" : importFor[0]?.teacherId ?? "");

  const choose = async (picked: File | undefined) => {
    setError(null);
    if (!picked) return;
    if (!picked.name.toLowerCase().endsWith(".xlsx")) {
      setError("الملف يجب أن يكون Excel بصيغة xlsx. الملفات القديمة (xls) احفظها أولًا بصيغة xlsx.");
      return;
    }
    if (picked.size > TRACKING_LIMITS.IMPORT_FILE_BYTES) {
      setError("حجم الملف أكبر من 5 ميجابايت.");
      return;
    }
    try {
      const data = await previewImport.mutateAsync(picked);
      setFile(picked);
      setPreview(data);
      setGroupName(picked.name.replace(/\.xlsx$/i, "").slice(0, TRACKING_LIMITS.TABLE_NAME));
      setRoles(Object.fromEntries(data.columns.map((c) => [c.index, c.coreField ?? "column"])));
      setTypes(
        Object.fromEntries(
          data.columns.map((c) => [c.index, c.guessedType === "Exam" ? "Number" : c.guessedType]),
        ),
      );
    } catch (err) {
      setError(getApiErrorMessage(err));
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

  const submit = async () => {
    if (!file || !preview || !groupName.trim()) return;
    setError(null);
    const indexOf = (field: CoreField) => {
      const entry = Object.entries(roles).find(([, role]) => role === field);
      return entry ? Number(entry[0]) : -1;
    };
    const overrides = Object.fromEntries(
      preview.columns
        .filter((c) => roles[c.index] === "column" && types[c.index] !== c.guessedType)
        .map((c) => [String(c.index), types[c.index]]),
    );
    // Only the fixed fields the user moved away from what the preview
    // recognised; the server keeps its own pick for the rest. -1 = none.
    const recognised = (field: CoreField) =>
      preview.columns.find((c) => c.coreField === field)?.index ?? -1;
    const options: ImportOptions = {
      ...(Object.keys(overrides).length ? { types: overrides } : {}),
      ...(forTeacherId ? { forTeacherId } : {}),
    };
    for (const field of CORE_FIELDS) {
      if (indexOf(field) !== recognised(field)) options[field] = indexOf(field);
    }
    try {
      setResult(await importTable.mutateAsync({ file, groupName: groupName.trim(), options }));
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const nameMissing = preview && !Object.values(roles).includes("name");

  // --- Step 3: done ---
  if (result) {
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
            تم استيراد {result.rows} طالب و{result.columns} عمود
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
        {result.warnings.length > 0 && (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
            <p className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-800 dark:text-amber-300">
              <AlertTriangle size={16} /> ملاحظات على {result.warnings.length} صف
            </p>
            <ul className="max-h-48 space-y-1 overflow-y-auto text-sm text-amber-900 dark:text-amber-200">
              {result.warnings.map((w, i) => (
                <li key={i}>
                  <span className="font-semibold tabular-nums">صف {w.row}:</span> {importWarningText(w.message)}
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
        description={`${preview.sheetName} · ${preview.rowCount} طالب · ${preview.columns.length} عمود. لم يُحفظ شيء بعد.`}
        onClose={onClose}
        className="max-w-3xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setPreview(null);
                setFile(null);
              }}
              className={cn(secondaryButton, "flex-1")}
            >
              ملف آخر
            </button>
            <button
              type="button"
              onClick={() => void submit()}
              disabled={!groupName.trim() || importTable.isPending}
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
            onChange={(e) => setGroupName(e.target.value)}
            className={inputClass}
          />
        </label>

        <p className="mt-5 mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">أعمدة الملف</p>
        <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
          {preview.columns.map((column) => {
            const role = roles[column.index] ?? "column";
            const samples = preview.sampleRows
              .map((row) => row[column.index])
              .filter(Boolean)
              .slice(0, 3);
            return (
              <div
                key={column.index}
                className="flex flex-wrap items-center gap-3 border-b border-zinc-100 px-4 py-3 last:border-0 dark:border-zinc-800"
              >
                <div className="min-w-40 flex-1">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">{column.header || `عمود ${column.index + 1}`}</p>
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
                {role === "column" && (
                  <select
                    value={types[column.index]}
                    onChange={(e) => setTypes((prev) => ({ ...prev, [column.index]: e.target.value as ColumnType }))}
                    className={cn(inputClass, "w-auto py-2")}
                  >
                    {IMPORT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {COLUMN_TYPES[type].label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          أعمدة الاسم والأرقام تملأ الحقول الأساسية فقط، ولا تُضاف إلى الجدول كأعمدة. الأرقام تُحفظ بصيغة 01XXXXXXXXX.
          أعمدة الامتحانات استوردها كأرقام، ثم غيّر نوعها إلى &quot;امتحان&quot; من داخل الجدول.
        </p>
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
