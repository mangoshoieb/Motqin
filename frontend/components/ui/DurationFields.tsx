"use client";

import { cn } from "@/app/lib/utils";

interface DurationFieldsProps {
  // Total minutes — what the API and the callers work in.
  minutes: number;
  onChange: (totalMinutes: number) => void;
  label?: string;
  inputClassName?: string;
  labelClassName?: string;
}

/**
 * Hours + minutes side by side, editing one total-minutes value: typing
 * "1" and "30" gives 90. Minutes wrap at 59; hours are open-ended.
 */
export function DurationFields({
  minutes,
  onChange,
  label = "المدة",
  inputClassName,
  labelClassName,
}: DurationFieldsProps) {
  const safe = Number.isFinite(minutes) && minutes > 0 ? Math.floor(minutes) : 0;
  const hours = Math.floor(safe / 60);
  const rest = safe % 60;

  const update = (nextHours: number, nextMinutes: number) => {
    const h = Number.isFinite(nextHours) ? Math.max(0, Math.floor(nextHours)) : 0;
    const m = Number.isFinite(nextMinutes) ? Math.min(59, Math.max(0, Math.floor(nextMinutes))) : 0;
    onChange(h * 60 + m);
  };

  return (
    <div className={labelClassName}>
      {label}
      <div className="mt-1 flex items-end gap-2" dir="rtl">
        <label className="flex flex-1 flex-col gap-0.5 text-[11px] font-normal text-zinc-500 dark:text-zinc-400">
          ساعات
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={hours}
            onChange={(event) => update(Number(event.target.value), rest)}
            onFocus={(event) => event.currentTarget.select()}
            aria-label="الساعات"
            className={cn(inputClassName, "!mt-0 tabular-nums")}
          />
        </label>
        <span className="pb-2.5 text-sm font-bold text-zinc-400">:</span>
        <label className="flex flex-1 flex-col gap-0.5 text-[11px] font-normal text-zinc-500 dark:text-zinc-400">
          دقائق
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={59}
            value={rest}
            onChange={(event) => update(hours, Number(event.target.value))}
            onFocus={(event) => event.currentTarget.select()}
            aria-label="الدقائق"
            className={cn(inputClassName, "!mt-0 tabular-nums")}
          />
        </label>
      </div>
    </div>
  );
}
