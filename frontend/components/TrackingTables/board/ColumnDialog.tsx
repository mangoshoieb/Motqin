"use client";

import { useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/app/lib/utils";
import { getApiErrorMessage } from "@/app/lib/api-error";
import { apiErrorCode, apiErrorDetails, normalizeDigits } from "@/app/lib/tracking-table";
import {
  COLUMN_TYPES,
  COLUMN_TYPE_ORDER,
  TRACKING_LIMITS,
} from "@/app/constants/tracking-table.constants";
import { useSaveColumn } from "@/app/hooks/useTrackingTables";
import { ColumnType, TrackingColumn } from "@/app/types/tracking-table.types";
import { Modal, inputClass, primaryButton, secondaryButton } from "../ui";
import { choiceChipClass } from "./Cell";

// values_dont_fit lists the students whose current value the new type can't
// hold; the exact shape isn't documented, so read the usual names.
const describeBadRow = (item: unknown): string => {
  if (item && typeof item === "object") {
    const r = item as Record<string, unknown>;
    const who = r.fullName ?? r.student ?? r.name ?? (r.row !== undefined ? `صف ${r.row}` : r.rowId);
    const value = r.value ?? r.current;
    return [who, value !== undefined ? `"${String(value)}"` : null].filter(Boolean).join(": ");
  }
  return String(item);
};

export function ColumnDialog({
  groupId,
  column,
  onClose,
}: {
  groupId: string;
  column?: TrackingColumn; // edit when given, add otherwise
  onClose: () => void;
}) {
  const [name, setName] = useState(column?.name ?? "");
  const [type, setType] = useState<ColumnType>(column?.type ?? "Exam");
  const [maxScore, setMaxScore] = useState(column?.maxScore ? String(column.maxScore) : "20");
  const [options, setOptions] = useState<string[]>(column?.options ?? []);
  const [optionDraft, setOptionDraft] = useState("");
  const [error, setError] = useState<{ message: string; rows: string[] } | null>(null);
  const save = useSaveColumn(groupId);

  const score = Number(normalizeDigits(maxScore));
  const scoreValid = Number.isFinite(score) && score >= 1 && score <= TRACKING_LIMITS.MAX_SCORE;
  const valid =
    name.trim().length > 0 &&
    (type !== "Exam" || scoreValid) &&
    (type !== "Choice" || options.length > 0 || optionDraft.trim().length > 0);

  const addOption = () => {
    const text = optionDraft.trim();
    if (text && !options.includes(text)) setOptions((prev) => [...prev, text]);
    setOptionDraft("");
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!valid || save.isPending) return;
    setError(null);
    const finalOptions = optionDraft.trim() && !options.includes(optionDraft.trim())
      ? [...options, optionDraft.trim()]
      : options;
    save.mutate(
      {
        columnId: column?.id,
        body: {
          name: name.trim(),
          type,
          maxScore: type === "Exam" ? score : null,
          options: type === "Choice" ? finalOptions : null,
        },
      },
      {
        onSuccess: () => {
          toast.success(column ? "تم حفظ العمود" : "تمت إضافة العمود");
          onClose();
        },
        onError: (err) => {
          const details = apiErrorDetails<{ rows?: unknown[] }>(err);
          setError({
            message: getApiErrorMessage(err),
            rows: apiErrorCode(err) === "values_dont_fit" && Array.isArray(details?.rows)
              ? details.rows.slice(0, 8).map(describeBadRow)
              : [],
          });
        },
      },
    );
  };

  return (
    <Modal
      title={column ? "تعديل العمود" : "عمود جديد"}
      description={column ? "تغيير النوع يحوّل القيم الحالية إن أمكن." : undefined}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={cn(secondaryButton, "flex-1")}>
            إلغاء
          </button>
          <button type="submit" form="column-form" disabled={!valid || save.isPending} className={cn(primaryButton, "flex-1")}>
            {save.isPending ? "جارٍ الحفظ..." : column ? "حفظ" : "إضافة العمود"}
          </button>
        </>
      }
    >
      <form id="column-form" onSubmit={submit} className="flex flex-col gap-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">اسم العمود</span>
          <input
            autoFocus
            dir="auto"
            value={name}
            maxLength={TRACKING_LIMITS.COLUMN_NAME}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثال: امتحان الشهر"
            className={inputClass}
          />
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">النوع</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {COLUMN_TYPE_ORDER.map((key) => {
              const { label, hint, Icon } = COLUMN_TYPES[key];
              const on = type === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setType(key)}
                  className={cn(
                    "flex flex-col items-start gap-1.5 rounded-2xl border p-3 text-start transition",
                    on
                      ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500 dark:bg-blue-500/10"
                      : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600",
                  )}
                >
                  <Icon size={18} className={on ? "text-blue-600" : "text-zinc-400"} />
                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{label}</span>
                  <span className="text-[11px] leading-4 text-zinc-500">{hint}</span>
                </button>
              );
            })}
          </div>
        </div>

        {type === "Exam" && (
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">الدرجة النهائية</span>
            <input
              dir="ltr"
              inputMode="decimal"
              value={maxScore}
              onChange={(e) => setMaxScore(e.target.value)}
              className={cn(inputClass, "w-32 text-center")}
            />
            {!scoreValid && <span className="text-xs text-rose-600">من 1 إلى {TRACKING_LIMITS.MAX_SCORE}</span>}
          </label>
        )}

        {type === "Choice" && (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">الاختيارات</span>
            <div className="flex flex-wrap gap-1.5">
              {options.map((option) => (
                <span
                  key={option}
                  className={cn("inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold", choiceChipClass(options, option))}
                >
                  {option}
                  <button
                    type="button"
                    onClick={() => setOptions((prev) => prev.filter((o) => o !== option))}
                    aria-label={`حذف ${option}`}
                    className="opacity-60 hover:opacity-100"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <input
              dir="auto"
              value={optionDraft}
              onChange={(e) => setOptionDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addOption();
                }
              }}
              placeholder="اكتب اختيارًا واضغط Enter"
              className={inputClass}
            />
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
            <p className="font-semibold">{error.message}</p>
            {error.rows.length > 0 && (
              <ul className="mt-1.5 list-inside list-disc space-y-0.5">
                {error.rows.map((row, i) => (
                  <li key={i}>{row}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </form>
    </Modal>
  );
}
