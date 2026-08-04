"use client";

import { CalendarClock, Clock, ShieldCheck } from "lucide-react";
import { cn } from "@/app/lib/utils";
import {
  BLOCKING_MODE_META,
  WEEK_DAY_LABELS,
} from "@/app/constants/focus.constants";
import {
  useSetBlockingMode,
  useToggleBlocking,
} from "@/app/hooks/useDistractionControls";
import { BlockingMode, BlockingWindow } from "@/app/types/focus.types";

interface BlockingOptionsProps {
  mode: BlockingMode;
  windows: BlockingWindow[];
  isActive: boolean;
  blockedCount: number;
  hasDevice: boolean;
}

export const BlockingOptions = ({
  mode,
  windows,
  isActive,
  blockedCount,
  hasDevice,
}: BlockingOptionsProps) => {
  const { mutate: setMode } = useSetBlockingMode();
  const { mutate: toggleBlocking } = useToggleBlocking();

  const nothingSelected = blockedCount === 0;

  return (
    <section
      className="rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6"
      dir="rtl"
    >
      <div className="mb-5 flex items-center gap-2.5">
        <ShieldCheck className="text-blue-600 dark:text-blue-400" size={22} />
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">خيارات الحجب</h2>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <ModeCard
          mode="untilPlanDone"
          icon={Clock}
          selected={mode === "untilPlanDone"}
          onSelect={() => setMode("untilPlanDone")}
        />
        <ModeCard
          mode="scheduledWindows"
          icon={CalendarClock}
          selected={mode === "scheduledWindows"}
          onSelect={() => setMode("scheduledWindows")}
        />
      </div>

      {/* The schedule only matters for the second mode, so it stays out of the
          way until that mode is picked. */}
      {mode === "scheduledWindows" && (
        <div className="mt-4 space-y-2">
          {windows.map((window) => (
            <div
              key={window.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 px-4 py-3 dark:border-zinc-800"
            >
              <span className="font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
                {window.startTime} — {window.endTime}
              </span>

              <div className="flex flex-wrap gap-1.5">
                {WEEK_DAY_LABELS.map((label, dayIndex) => (
                  <span
                    key={label}
                    className={cn(
                      "rounded-lg px-2 py-1 text-[11px] font-semibold",
                      window.days.includes(dayIndex)
                        ? "bg-blue-600 text-white"
                        : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
                    )}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          ))}

          <button
            type="button"
            disabled
            title="تحرير الفترات سيتاح مع ربط الجهاز"
            className="w-full rounded-2xl border border-dashed border-zinc-300 px-4 py-3 text-sm font-semibold text-zinc-400 disabled:cursor-not-allowed dark:border-zinc-700"
          >
            + إضافة فترة حجب
          </button>
        </div>
      )}

      <div className="mt-6 flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => toggleBlocking()}
          disabled={nothingSelected}
          className={cn(
            "w-full max-w-xs rounded-2xl px-6 py-3 font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto",
            isActive ? "bg-zinc-700 hover:bg-zinc-800" : "bg-red-600 hover:bg-red-700"
          )}
        >
          {isActive ? "إيقاف حجب التطبيقات" : "تفعيل حجب التطبيقات"}
        </button>

        {/* Two different reasons the button might not do what it looks like it
            does — say both rather than letting the student find out later. */}
        {nothingSelected ? (
          <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
            اختر تطبيقًا واحدًا على الأقل لتفعيل الحجب
          </p>
        ) : (
          isActive &&
          !hasDevice && (
            <p className="max-w-md text-center text-xs leading-relaxed text-amber-600 dark:text-amber-400">
              السياسة محفوظة وستُطبَّق فور ربط جهازك — لا يوجد حجب فعلي على هاتفك الآن.
            </p>
          )
        )}
      </div>
    </section>
  );
};

const ModeCard = ({
  mode,
  icon: Icon,
  selected,
  onSelect,
}: {
  mode: BlockingMode;
  icon: typeof Clock;
  selected: boolean;
  onSelect: () => void;
}) => {
  const meta = BLOCKING_MODE_META[mode];

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "rounded-2xl border p-5 text-center transition",
        selected
          ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/20 dark:border-blue-500 dark:bg-blue-950/30"
          : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
      )}
    >
      <span
        className={cn(
          "mx-auto flex size-12 items-center justify-center rounded-2xl transition",
          selected
            ? "bg-blue-600 text-white"
            : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
        )}
      >
        <Icon size={22} />
      </span>

      <p
        className={cn(
          "mt-3 font-bold",
          selected ? "text-blue-700 dark:text-blue-300" : "text-zinc-800 dark:text-zinc-200"
        )}
      >
        {meta.label}
      </p>

      <p className="mt-1.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
        {meta.description}
      </p>
    </button>
  );
};
