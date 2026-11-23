"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";

import { studySessionsService } from "@/app/services/motqin";
import { toastApiError } from "@/app/lib/api-error";
import { ExecutionTask } from "@/app/types/execution-board.types";
import { DurationFields } from "@/components/ui/DurationFields";

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";

const pad = (value: number) => String(value).padStart(2, "0");

// "2026-09-26" in local time.
const localDate = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// "14:05" — what <input type="time"> wants.
const localTime = (date: Date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

// "الخميس 26 نوفمبر" — the fixed day, shown beside the time field.
const dayLabel = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString("ar-EG-u-nu-latn", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

interface AddCompletedSessionDialogProps {
  task: ExecutionTask;
  // The board's own day, so a session logged on another day's board is
  // dated that day rather than today.
  boardDate?: string;
  defaultMinutes: number;
  onCreated: () => void;
  onClose: () => void;
}

/**
 * Logs study the user already did — an hour of revision away from the app —
 * without making them sit through a timer. The backend stores it as
 * ManuallyCompleted: it counts toward the day, but is never started or paused.
 */
export const AddCompletedSessionDialog = ({
  task,
  boardDate,
  defaultMinutes,
  onCreated,
  onClose,
}: AddCompletedSessionDialogProps) => {
  const [title, setTitle] = useState(task.title);
  const [minutes, setMinutes] = useState(defaultMinutes);
  // The session belongs to the board's day — only the time is the
  // student's to pick.
  const [day] = useState(() =>
    boardDate && /^\d{4}-\d{2}-\d{2}$/.test(boardDate) ? boardDate : localDate(new Date()),
  );
  const [completedTime, setCompletedTime] = useState(() => localTime(new Date()));

  const mutation = useMutation({
    mutationFn: async () => {
      const description = title.trim();
      if (!description) throw new Error("title-required");
      if (!minutes || minutes <= 0) throw new Error("duration-required");

      const finished = new Date(`${day}T${completedTime}:00`);
      if (!completedTime || Number.isNaN(finished.getTime())) throw new Error("date-required");
      // Can't have finished something later than now.
      if (finished.getTime() > Date.now() + 60_000) throw new Error("future-time");

      return studySessionsService.createCompleted({
        studyPlanId: Number(task.id),
        description,
        durationInMinutes: minutes,
        completedAt: finished.toISOString(),
        goalCategoryId: task.goalCategoryId,
      });
    },
    onSuccess: () => {
      toast.success("تم تسجيل الجلسة المنتهية");
      onCreated();
      onClose();
    },
    onError: (error) => {
      const messages: Record<string, string> = {
        "title-required": "العنوان مطلوب.",
        "duration-required": "المدة يجب أن تكون أكبر من صفر.",
        "date-required": "وقت الانتهاء غير صالح.",
        "future-time": "لا يمكن أن يكون وقت الانتهاء في المستقبل.",
      };
      const known = messages[error.message];
      if (known) toast.error(known);
      else toastApiError("تعذر تسجيل الجلسة المنتهية", error);
    },
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      dir="rtl"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900">
        <div className="mb-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" size={20} />
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">إضافة جلسة منتهية</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="إغلاق"
            className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        <p className="mb-5 text-sm text-zinc-500 dark:text-zinc-400">
          ذاكرت خارج التطبيق؟ سجّل الوقت هنا ليُحتسب ضمن مهمة «{task.title}» بدون انتظار المؤقّت.
        </p>

        <label className="block text-sm text-zinc-700 dark:text-zinc-300">
          عنوان الجلسة
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="مثال: مراجعة الفصل الثاني"
            className={inputClass}
          />
        </label>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <DurationFields
            minutes={minutes}
            onChange={setMinutes}
            label="المدة التي ذاكرتها"
            labelClassName="text-sm text-zinc-700 dark:text-zinc-300"
            inputClassName={inputClass}
          />
          <label className="block text-sm text-zinc-700 dark:text-zinc-300">
            وقت الانتهاء
            {/* The day is fixed (the board's own); shown, not editable. */}
            <span className="mt-1 block text-[11px] text-zinc-400 dark:text-zinc-500">{dayLabel(day)}</span>
            <input
              type="time"
              value={completedTime}
              onChange={(event) => setCompletedTime(event.target.value)}
              className={`${inputClass} mt-1`}
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm dark:border-zinc-700"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="rounded-lg bg-emerald-600 dark:bg-emerald-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 dark:hover:bg-emerald-800 disabled:opacity-60"
          >
            {mutation.isPending ? "جاري التسجيل..." : "تسجيل الجلسة"}
          </button>
        </div>
      </div>
    </div>
  );
};
