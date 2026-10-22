"use client";

import { BookOpen, Plus, X } from "lucide-react";
import { cn } from "@/app/lib/utils";

// Longest gap accepted between two reviews.
export const MAX_INTERVAL_DAYS = 365;

// "يوم واحد" / "يومان" / "5 أيام" / "15 يومًا".
export const formatDayCount = (days: number) => {
  if (days === 1) return "يوم واحد";
  if (days === 2) return "يومان";
  if (days >= 3 && days <= 10) return `${days} أيام`;
  return `${days} يومًا`;
};

const isValidGap = (days: number) =>
  Number.isInteger(days) && days >= 1 && days <= MAX_INTERVAL_DAYS;

// Why a list can't be saved, or null when it can.
export const intervalsError = (intervals: number[], maxRepetitions: number): string | null => {
  if (intervals.length === 0) return "أضف مراجعة واحدة على الأقل";
  if (intervals.length > maxRepetitions) return `الحد الأقصى ${maxRepetitions} مراجعات`;
  if (!intervals.every(isValidGap)) return `كل فترة من 1 إلى ${MAX_INTERVAL_DAYS} يومًا`;
  return null;
};

export const sameIntervals = (a: number[], b: number[]) =>
  a.length === b.length && a.every((value, index) => value === b[index]);

interface IntervalsEditorProps {
  value: number[];
  onChange: (next: number[]) => void;
  maxRepetitions: number;
  disabled?: boolean;
}

// One card per review — its gap in days and the day it lands on — then a
// timeline of the whole schedule, counted from the day the lesson is studied.
export const IntervalsEditor = ({ value, onChange, maxRepetitions, disabled }: IntervalsEditorProps) => {
  // Day each review lands on, counting the first study as day 0.
  const reviewDays = value.reduce<number[]>(
    (days, gap) => [...days, (days.at(-1) ?? 0) + (isValidGap(gap) ? gap : 0)],
    [],
  );
  const lastDay = reviewDays.at(-1) ?? 0;

  const setGap = (index: number, raw: string) => {
    const days = raw === "" ? 0 : Math.trunc(Number(raw));
    onChange(value.map((gap, i) => (i === index ? (Number.isFinite(days) ? days : 0) : gap)));
  };

  const removeAt = (index: number) => onChange(value.filter((_, i) => i !== index));

  // A new review waits a little longer than the last one did.
  const addReview = () => {
    const last = value.at(-1) ?? 0;
    onChange([...value, Math.min(MAX_INTERVAL_DAYS, Math.max(1, last * 2 || 1))]);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {value.map((gap, index) => {
          const invalid = !isValidGap(gap);
          return (
            <div
              key={index}
              className={cn(
                "relative flex flex-col gap-2 rounded-2xl border bg-zinc-50 p-3 dark:bg-zinc-800/60",
                invalid
                  ? "border-red-300 dark:border-red-800"
                  : "border-zinc-200 dark:border-zinc-700",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-200">
                  <span className="flex size-5 items-center justify-center rounded-full bg-violet-600 text-[10px] text-white">
                    {index + 1}
                  </span>
                  المراجعة {index + 1}
                </span>
                {value.length > 1 && !disabled && (
                  <button
                    type="button"
                    onClick={() => removeAt(index)}
                    title="حذف هذه المراجعة"
                    className="text-zinc-400 transition hover:text-red-600 dark:hover:text-red-400"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <label className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="shrink-0">بعد</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={MAX_INTERVAL_DAYS}
                  value={gap || ""}
                  disabled={disabled}
                  onChange={(event) => setGap(index, event.target.value)}
                  aria-label={`عدد الأيام قبل المراجعة ${index + 1}`}
                  aria-invalid={invalid}
                  className={cn(
                    "w-16 rounded-lg border bg-white px-2 py-1.5 text-center text-sm font-bold text-zinc-900 outline-none transition focus:border-blue-400 disabled:opacity-60 dark:bg-zinc-900 dark:text-zinc-100",
                    invalid ? "border-red-400" : "border-zinc-200 dark:border-zinc-700",
                  )}
                />
                <span className="shrink-0">يوم</span>
              </label>

              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {index === 0 ? "من المذاكرة الأولى" : "من المراجعة السابقة"}
                {!invalid && (
                  <span className="font-semibold text-violet-700 dark:text-violet-300">
                    {" "}
                    · اليوم {reviewDays[index]}
                  </span>
                )}
              </p>
            </div>
          );
        })}

        {value.length < maxRepetitions && !disabled && (
          <button
            type="button"
            onClick={addReview}
            className="flex min-h-28 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-zinc-300 text-xs font-semibold text-zinc-500 transition hover:border-violet-400 hover:text-violet-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-violet-600 dark:hover:text-violet-300"
          >
            <Plus size={18} />
            إضافة مراجعة
          </button>
        )}
      </div>

      {/* The whole schedule at a glance, to scale. */}
      {lastDay > 0 && (
        <div className="px-3 pb-6 pt-2" aria-hidden>
          <div className="relative h-1.5 rounded-full bg-gradient-to-l from-violet-200 to-violet-500 dark:from-violet-900 dark:to-violet-500">
            <span className="absolute -top-2 right-0 flex size-5 translate-x-1/2 items-center justify-center rounded-full bg-blue-600 text-white ring-4 ring-white dark:ring-zinc-900">
              <BookOpen size={11} />
            </span>
            <span className="absolute right-0 top-4 translate-x-1/2 whitespace-nowrap text-[10px] text-zinc-500 dark:text-zinc-400">
              المذاكرة
            </span>
            {/* Reviews start a little way along the line so an early one
                doesn't sit on top of the study marker. */}
            {reviewDays.map((day, index) => (
              <span
                key={index}
                style={{ right: `${8 + (day / lastDay) * 92}%` }}
                className="absolute top-0"
              >
                <span className="absolute -top-1.5 flex size-4 translate-x-1/2 items-center justify-center rounded-full bg-violet-600 text-[9px] font-bold text-white ring-2 ring-white dark:ring-zinc-900">
                  {index + 1}
                </span>
                <span className="absolute top-4 translate-x-1/2 whitespace-nowrap text-[10px] font-semibold text-violet-700 dark:text-violet-300">
                  يوم {day}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
