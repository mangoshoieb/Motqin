"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, CalendarClock, Clock, Plus, SkipForward, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { weekData } from "@/app/data/days";
import { currentWeekDates, formatPlannerDate } from "@/app/lib/study-plan";
import { cn } from "@/app/lib/utils";
import { BusyTime, BusyTimeMode, BusyTimePayload, busyTimesService } from "@/app/services/motqin";

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-blue-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-blue-500";

interface Draft {
  dayIndex: number; // 1..7, Sunday first — same as weekData
  title: string;
  mode: BusyTimeMode;
  startTime: string;
  endTime: string;
  durationInMinutes: string;
}

const emptyDraft: Draft = {
  dayIndex: 1,
  title: "",
  mode: "range",
  startTime: "09:00",
  endTime: "10:00",
  durationInMinutes: "60",
};

interface NextWeekBusyTimesStepProps {
  onContinue: () => void;
  onSkip: () => void;
}

/**
 * One-off busy times for next week only (a doctor's appointment, a trip…) —
 * distinct from the repeating ones in the planner preferences. Optional:
 * the user can skip straight to the goals.
 *
 * There's no endpoint to list non-repeating busy times, so what was added
 * in this session is kept locally for display and removal.
 */
export default function NextWeekBusyTimesStep({ onContinue, onSkip }: NextWeekBusyTimesStepProps) {
  const dates = currentWeekDates(1);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [added, setAdded] = useState<(BusyTime & { dayIndex: number })[]>([]);

  const dateFor = (dayIndex: number) => dates[dayIndex - 1];

  const addMutation = useMutation({
    mutationFn: async () => {
      const title = draft.title.trim();
      if (!title) throw new Error("title-required");
      if (draft.mode === "range" && draft.startTime >= draft.endTime) throw new Error("invalid-time-range");
      if (draft.mode === "duration" && Number(draft.durationInMinutes) <= 0) throw new Error("invalid-duration");

      const date = dateFor(draft.dayIndex);
      // POST /user-preferences/busytime — a one-off on a specific next-week
      // date. Per the API doc the body carries EITHER startTime/endTime OR
      // durationInMinutes (never both), and dates are ISO like the example.
      const at = (time: string) => new Date(`${date}T${time}:00`).toISOString();
      const payload: BusyTimePayload =
        draft.mode === "range"
          ? { title, isRepeated: false, startDate: date, endDate: date, startTime: at(draft.startTime), endTime: at(draft.endTime) }
          : { title, isRepeated: false, startDate: date, endDate: date, durationInMinutes: Number(draft.durationInMinutes) };
      return busyTimesService.create(payload);
    },
    onSuccess: (created) => {
      setAdded((prev) => [...prev, { ...created, dayIndex: draft.dayIndex }]);
      setDraft((prev) => ({ ...emptyDraft, dayIndex: prev.dayIndex }));
      toast.success("تمت إضافة الوقت المشغول");
    },
    onError: (error) => {
      const messages: Record<string, string> = {
        "title-required": "العنوان مطلوب.",
        "invalid-time-range": "وقت النهاية يجب أن يكون بعد وقت البداية.",
        "invalid-duration": "المدة يجب أن تكون أكبر من صفر.",
      };
      toast.error(messages[error.message] ?? "حدث خطأ أثناء حفظ الوقت المشغول.");
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => busyTimesService.remove(id),
    onSuccess: (_, id) => setAdded((prev) => prev.filter((b) => b.id !== id)),
    onError: () => toast.error("تعذر حذف الوقت المشغول."),
  });

  const localTime = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return Number.isNaN(d.getTime())
      ? iso.slice(11, 16)
      : `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };
  const describe = (busy: BusyTime) =>
    busy.durationInMinutes
      ? `${busy.durationInMinutes} دقيقة`
      : `${localTime(busy.startTime)} – ${localTime(busy.endTime)}`;

  return (
    <div
      dir="rtl"
      className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="mb-1 flex items-center gap-2">
        <CalendarClock className="text-blue-600 dark:text-blue-400" size={22} />
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          أوقاتك المشغولة في الأسبوع القادم
        </h2>
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          اختياري
        </span>
      </div>
      <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
        هل لديك مواعيد أو ارتباطات خاصة بالأسبوع القادم ({formatPlannerDate(dates[0])} -{" "}
        {formatPlannerDate(dates[6])})؟ أضفها هنا ليتجنبها الذكاء الاصطناعي عند توزيع مهامك.
        الأوقات المتكررة كل أسبوع تُدار من صفحة التفضيلات.
      </p>

      {/* Day picker */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {weekData.map((day) => (
          <button
            key={day.index}
            type="button"
            onClick={() => setDraft({ ...draft, dayIndex: day.index })}
            className={cn(
              "rounded-xl border px-3 py-1.5 text-xs font-semibold transition",
              draft.dayIndex === day.index
                ? "border-blue-600 bg-blue-600/10 text-blue-700 dark:border-blue-500 dark:text-blue-300"
                : "border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-300",
            )}
          >
            {day.dayName}
            <span className="ms-1 text-[10px] font-normal text-zinc-400">
              {formatPlannerDate(dateFor(day.index))}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto_auto_auto] lg:items-end">
        <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-300">
          العنوان
          <input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="مثال: موعد طبيب"
            className={inputClass}
          />
        </label>

        <div className="flex items-end">
          <div className="flex rounded-lg border border-zinc-200 p-0.5 text-xs dark:border-zinc-700">
            {(["range", "duration"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setDraft({ ...draft, mode })}
                className={cn(
                  "rounded-md px-2.5 py-1.5 font-semibold transition",
                  draft.mode === mode
                    ? "bg-blue-600 text-white"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200",
                )}
              >
                {mode === "range" ? "من – إلى" : "مدة فقط"}
              </button>
            ))}
          </div>
        </div>

        {draft.mode === "range" ? (
          <>
            <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-300">
              من
              <input
                type="time"
                value={draft.startTime}
                onChange={(e) => setDraft({ ...draft, startTime: e.target.value })}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-300">
              إلى
              <input
                type="time"
                value={draft.endTime}
                onChange={(e) => setDraft({ ...draft, endTime: e.target.value })}
                className={inputClass}
              />
            </label>
          </>
        ) : (
          <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-300 lg:col-span-2">
            المدة بالدقائق
            <input
              type="number"
              min={1}
              value={draft.durationInMinutes}
              onChange={(e) => setDraft({ ...draft, durationInMinutes: e.target.value })}
              className={inputClass}
            />
          </label>
        )}
      </div>

      <button
        type="button"
        onClick={() => addMutation.mutate()}
        disabled={addMutation.isPending}
        className="mt-3 flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Plus size={16} />
        {addMutation.isPending ? "جاري الحفظ..." : "إضافة وقت"}
      </button>

      {added.length > 0 && (
        <ul className="mt-5 space-y-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          {added.map((busy) => (
            <li
              key={busy.id}
              className="flex items-center gap-3 rounded-xl bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-800/60"
            >
              <span className="rounded-lg bg-blue-600/10 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
                {weekData[busy.dayIndex - 1]?.dayName}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium text-zinc-800 dark:text-zinc-200">
                {busy.title}
              </span>
              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <Clock size={12} />
                {describe(busy)}
              </span>
              <button
                type="button"
                title="حذف"
                onClick={() => removeMutation.mutate(busy.id)}
                className="text-zinc-400 transition hover:text-red-600"
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-zinc-100 pt-5 dark:border-zinc-800">
        <button
          type="button"
          onClick={onSkip}
          className="flex items-center gap-1.5 rounded-xl border border-zinc-200 px-4 py-2 text-sm text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <SkipForward size={15} />
          تخطي
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          متابعة إلى الأهداف
          <ArrowLeft size={15} />
        </button>
      </div>
    </div>
  );
}
