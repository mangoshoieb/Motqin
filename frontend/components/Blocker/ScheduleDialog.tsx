"use client";

import { useEffect, useState } from "react";
import { Clock, ListChecks, Moon, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/app/lib/utils";
import { useCreateSchedule, useUpdateSchedule } from "@/app/hooks/useDistractionBlocker";
import { useWeekDays } from "@/app/hooks/useLookups";
import { WEEK_DAYS_FALLBACK } from "@/app/constants/distraction-blocker.constants";
import { formatUsage } from "@/app/constants/focus.constants";
import {
  blockerErrorMessage,
  crossesMidnight,
  formatTimeOfDay,
  toHHmm,
} from "@/app/lib/distraction-blocker";
import { BlockSchedule, BlockScheduleInput } from "@/app/types/distraction-blocker.types";

type ScheduleKind = "window" | "plan";

const KINDS: { value: ScheduleKind; label: string; description: string; icon: typeof Clock }[] = [
  {
    value: "window",
    label: "فترة زمنية",
    description: "يحجب بين وقتين في الأيام التي تختارها.",
    icon: Clock,
  },
  {
    value: "plan",
    label: "حتى إنهاء خطة اليوم",
    description: "يحجب طوال اليوم، ويُرفع بعد إنهاء مهام اليوم ومراجعاته.",
    icon: ListChecks,
  },
];

const timeInputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-blue-500";

// Minutes from start to end, wrapping past midnight.
export const windowMinutes = (start: string, end: string) => {
  const toMinutes = (time: string) => {
    const [h, m] = toHHmm(time).split(":").map(Number);
    return h * 60 + m;
  };
  return (toMinutes(end) - toMinutes(start) + 1440) % 1440;
};

interface ScheduleDialogProps {
  // null when adding a new one.
  schedule: BlockSchedule | null;
  // All of the student's schedules — each day can have only one enabled
  // "until the plan is done" schedule.
  schedules: BlockSchedule[];
  onClose: () => void;
}

export const ScheduleDialog = ({ schedule, schedules, onClose }: ScheduleDialogProps) => {
  const createSchedule = useCreateSchedule();
  const updateSchedule = useUpdateSchedule();
  const { data: weekDaysData } = useWeekDays();
  const weekDays = weekDaysData?.length ? weekDaysData : WEEK_DAYS_FALLBACK;

  const [kind, setKind] = useState<ScheduleKind>(
    schedule?.blockUntilPlanCompleted ? "plan" : "window",
  );
  const [days, setDays] = useState<number[]>(schedule?.days ?? []);
  const [startTime, setStartTime] = useState(toHHmm(schedule?.startTime) || "17:00");
  const [endTime, setEndTime] = useState(toHHmm(schedule?.endTime) || "22:00");
  const [tried, setTried] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const isEnabled = schedule?.isEnabled ?? true;
  const saving = createSchedule.isPending || updateSchedule.isPending;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, saving]);

  // Days another enabled plan schedule already covers.
  const takenPlanDays = new Set(
    kind === "plan" && isEnabled
      ? schedules
          .filter((s) => s.id !== schedule?.id && s.isEnabled && s.blockUntilPlanCompleted)
          .flatMap((s) => s.days)
      : [],
  );
  const conflicts = days.filter((day) => takenPlanDays.has(day));
  const dayName = (value: number) => weekDays.find((d) => d.value === value)?.nameAr ?? value;

  const validationError =
    days.length === 0
      ? tried
        ? "اختر يومًا واحدًا على الأقل."
        : null
      : conflicts.length > 0
        ? `هذه الأيام لها جدول «حتى إنهاء الخطة» مفعّل بالفعل: ${conflicts.map(dayName).join("، ")}.`
        : kind === "window" && (!startTime || !endTime)
          ? "حدد وقت بداية الحجب ونهايته."
          : kind === "window" && startTime === endTime
            ? "وقت البداية والنهاية لا يمكن أن يتطابقا."
            : null;

  const selectable = weekDays.filter((d) => !takenPlanDays.has(d.value)).map((d) => d.value);
  const allSelected = selectable.length > 0 && selectable.every((day) => days.includes(day));

  const toggleDay = (day: number) => {
    setServerError(null);
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const handleSubmit = async () => {
    setTried(true);
    if (days.length === 0 || validationError) return;

    const sortedDays = [...days].sort((a, b) => a - b);
    const input: BlockScheduleInput =
      kind === "plan"
        ? { days: sortedDays, blockUntilPlanCompleted: true, isEnabled }
        : { days: sortedDays, blockUntilPlanCompleted: false, startTime, endTime, isEnabled };

    setServerError(null);
    try {
      if (schedule) {
        await updateSchedule.mutateAsync({ id: schedule.id, input });
        toast.success("تم حفظ الجدول");
      } else {
        await createSchedule.mutateAsync(input);
        toast.success("تمت إضافة الجدول، وسيصل إلى هاتفك تلقائيًا");
      }
      onClose();
    } catch (error) {
      setServerError(blockerErrorMessage(error));
    }
  };

  const minutes = kind === "window" && startTime && endTime ? windowMinutes(startTime, endTime) : 0;

  return (
    <div
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="schedule-dialog-title"
      onClick={() => !saving && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-zinc-900"
      >
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
          <h2 id="schedule-dialog-title" className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {schedule ? "تعديل جدول الحجب" : "جدول حجب جديد"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="إغلاق"
            className="flex size-8 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex flex-col gap-6 overflow-y-auto px-6 py-5">
            {/* Kind */}
            <div className="grid gap-2 sm:grid-cols-2">
              {KINDS.map(({ value, label, description, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setKind(value);
                    setServerError(null);
                  }}
                  aria-pressed={kind === value}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-xl border p-3 text-start transition",
                    kind === value
                      ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/20 dark:border-blue-500 dark:bg-blue-950/30"
                      : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600",
                  )}
                >
                  <span
                    className={cn(
                      "flex items-center gap-2 text-sm font-bold",
                      kind === value ? "text-blue-700 dark:text-blue-300" : "text-zinc-800 dark:text-zinc-200",
                    )}
                  >
                    <Icon size={16} />
                    {label}
                  </span>
                  <span className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{description}</span>
                </button>
              ))}
            </div>

            {/* Days */}
            <fieldset className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <legend className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">الأيام</legend>
                <button
                  type="button"
                  onClick={() => {
                    setServerError(null);
                    setDays(allSelected ? [] : selectable);
                  }}
                  className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                >
                  {allSelected ? "إلغاء الكل" : "كل الأيام"}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {weekDays.map((day) => {
                  const taken = takenPlanDays.has(day.value);
                  const selected = days.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      disabled={taken && !selected}
                      aria-pressed={selected}
                      title={taken ? "لهذا اليوم جدول آخر «حتى إنهاء الخطة»" : undefined}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-sm font-semibold transition",
                        selected
                          ? taken
                            ? "border-red-400 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300"
                            : "border-blue-600 bg-blue-600 dark:bg-blue-700 text-white"
                          : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800",
                        taken && !selected && "cursor-not-allowed line-through opacity-40",
                      )}
                    >
                      {day.nameAr}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* Times */}
            {kind === "window" && (
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">من</span>
                    <input
                      type="time"
                      required
                      value={startTime}
                      onChange={(event) => {
                        setStartTime(event.target.value);
                        setServerError(null);
                      }}
                      className={timeInputClass}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">إلى</span>
                    <input
                      type="time"
                      required
                      value={endTime}
                      onChange={(event) => {
                        setEndTime(event.target.value);
                        setServerError(null);
                      }}
                      className={timeInputClass}
                    />
                  </label>
                </div>
                {minutes > 0 && (
                  <p className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                    {crossesMidnight(startTime, endTime) && <Moon size={13} className="shrink-0" />}
                    {crossesMidnight(startTime, endTime)
                      ? `يمتد عبر منتصف الليل حتى ${formatTimeOfDay(endTime)} في اليوم التالي — ${formatUsage(minutes)} حجب.`
                      : `${formatUsage(minutes)} حجب كل يوم مختار.`}
                  </p>
                )}
                <p className="text-xs text-zinc-500 dark:text-zinc-400">الأوقات حسب ساعة هاتفك.</p>
              </div>
            )}

            {(validationError || serverError) && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:bg-red-950/30 dark:text-red-300">
                {validationError ?? serverError}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-zinc-100 px-6 py-4 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving || Boolean(validationError)}
              className="rounded-lg bg-blue-600 dark:bg-blue-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 dark:hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "جاري الحفظ..." : schedule ? "حفظ التعديلات" : "إضافة الجدول"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
