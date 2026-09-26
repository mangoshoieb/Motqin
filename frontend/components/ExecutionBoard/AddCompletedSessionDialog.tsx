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

// "2026-09-26T14:05" — what <input type="datetime-local"> wants.
const localInputValue = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

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
  const [completedAt, setCompletedAt] = useState(() => {
    const now = new Date();
    if (!boardDate) return localInputValue(now);
    // Keep the time of day, move it onto the board's date.
    const [year, month, day] = boardDate.split("-").map(Number);
    if (!year || !month || !day) return localInputValue(now);
    return localInputValue(new Date(year, month - 1, day, now.getHours(), now.getMinutes()));
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const description = title.trim();
      if (!description) throw new Error("title-required");
      if (!minutes || minutes <= 0) throw new Error("duration-required");

      const finished = new Date(completedAt);
      if (Number.isNaN(finished.getTime())) throw new Error("date-required");

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
            <CheckCircle2 className="text-emerald-600" size={20} />
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
            <input
              type="datetime-local"
              value={completedAt}
              onChange={(event) => setCompletedAt(event.target.value)}
              className={`${inputClass} mt-5.5`}
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
            className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {mutation.isPending ? "جاري التسجيل..." : "تسجيل الجلسة"}
          </button>
        </div>
      </div>
    </div>
  );
};
