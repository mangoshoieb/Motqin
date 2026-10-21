"use client";

import { useState, type FormEvent } from "react";
import { FileText, Sparkles, X } from "lucide-react";

// Same bounds the backend puts on CreateCustomizedLessonDto.title.
const MIN_LENGTH = 2;
const MAX_LENGTH = 200;

interface PdfLessonDialogProps {
  isPending?: boolean;
  onSubmit: (title: string) => void;
  onCancel: () => void;
}

// Step 1 of "create a lesson from a PDF": just the lesson's title. Once the
// lesson exists the student lands on it and the PDF popup takes over.
export const PdfLessonDialog = ({ isPending = false, onSubmit, onCancel }: PdfLessonDialogProps) => {
  const [title, setTitle] = useState("");
  const trimmed = title.trim();
  const tooShort = trimmed.length < MIN_LENGTH;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (tooShort || isPending) return;
    onSubmit(trimmed);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={() => !isPending && onCancel()}
    >
      <form
        dir="rtl"
        onSubmit={handleSubmit}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.key === "Escape" && !isPending && onCancel()}
        className="w-full max-w-md overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-blue-50 shadow-xl shadow-indigo-500/10 dark:border-indigo-900/50 dark:from-indigo-950/40 dark:via-zinc-900 dark:to-blue-950/40"
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6">
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-l from-indigo-600 to-blue-400 text-white shadow-lg shadow-indigo-500/30">
              <FileText className="size-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">إنشاء درس من PDF</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                الخطوة 1 من 2: عنوان الدرس، ثم ترفع الملف ويُنشئ الذكاء الاصطناعي الأسئلة.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            aria-label="إغلاق"
            className="rounded-full p-1.5 text-zinc-400 transition hover:bg-white/70 hover:text-zinc-700 disabled:opacity-40 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            عنوان الدرس
            <input
              autoFocus
              dir="auto"
              value={title}
              maxLength={MAX_LENGTH}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="مثال: الحمض والقاعدة"
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-zinc-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
            {title.length > 0 && tooShort && (
              <span className="mt-1 block text-xs font-normal text-red-600">
                يجب أن يتكون العنوان من حرفين على الأقل.
              </span>
            )}
          </label>
        </div>

        <div className="flex items-center gap-3 px-6 pb-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="rounded-2xl border border-zinc-200 bg-white/70 px-5 py-3 text-zinc-600 transition hover:bg-white disabled:opacity-50 dark:border-zinc-700 dark:bg-transparent dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={tooShort || isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-indigo-600 to-blue-400 px-6 py-3 font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Sparkles className="size-5" />
            {isPending ? "جاري إنشاء الدرس..." : "التالي: رفع الملف"}
          </button>
        </div>
      </form>
    </div>
  );
};
