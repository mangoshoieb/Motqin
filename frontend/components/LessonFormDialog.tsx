"use client";

import { useState, type FormEvent } from "react";
import { DurationFields } from "@/components/ui/DurationFields";
import type { CustomLessonPayload } from "@/app/services/lesson.service";

// Same bounds the backend puts on CreateCustomizedLessonDto /
// UpdateCustomizedLessonDto.title.
const MIN_LENGTH = 2;
const MAX_LENGTH = 200;

const inputClass =
  "mt-1 w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-zinc-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";
const labelClass = "block text-sm font-medium text-zinc-700 dark:text-zinc-300";

interface LessonFormDialogProps {
  title: string;
  submitLabel: string;
  initialLesson?: Lesson;
  isPending?: boolean;
  onSubmit: (payload: CustomLessonPayload) => void;
  onCancel: () => void;
}

// Popup to add a lesson of the student's own under a subject, or edit one:
// a title, an optional estimated duration and optional notes (one per line).
export const LessonFormDialog = ({
  title,
  submitLabel,
  initialLesson,
  isPending = false,
  onSubmit,
  onCancel,
}: LessonFormDialogProps) => {
  const [lessonTitle, setLessonTitle] = useState(initialLesson?.title ?? "");
  const [minutes, setMinutes] = useState(initialLesson?.estimatedDuration ?? 0);
  const [notes, setNotes] = useState((initialLesson?.notes ?? []).join("\n"));

  const trimmed = lessonTitle.trim();
  const tooShort = trimmed.length < MIN_LENGTH;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (tooShort || isPending) return;
    onSubmit({
      title: trimmed,
      estimatedDuration: minutes > 0 ? minutes : null,
      notes: notes
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-6"
      onClick={onCancel}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(event) => event.stopPropagation()}
        dir="rtl"
        onKeyDown={(event) => event.key === "Escape" && onCancel()}
        className="w-full max-w-md flex flex-col gap-4 rounded-3xl bg-white border border-zinc-200 p-6 dark:bg-zinc-900 dark:border-zinc-800"
      >
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{title}</h2>

        <label className={labelClass}>
          عنوان الدرس
          <input
            autoFocus
            dir="auto"
            value={lessonTitle}
            maxLength={MAX_LENGTH}
            onChange={(event) => setLessonTitle(event.target.value)}
            placeholder="مثال: الحمض والقاعدة"
            className={inputClass}
          />
          {lessonTitle.length > 0 && tooShort && (
            <span className="mt-1 block text-xs font-normal text-red-600">
              يجب أن يتكون العنوان من حرفين على الأقل.
            </span>
          )}
        </label>

        <DurationFields
          minutes={minutes}
          onChange={setMinutes}
          label="المدة المتوقعة (اختياري)"
          labelClassName={labelClass}
          inputClassName={inputClass}
        />

        <label className={labelClass}>
          ملاحظات (اختياري، ملاحظة في كل سطر)
          <textarea
            dir="auto"
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className={`${inputClass} resize-y`}
          />
        </label>

        <div className="flex items-center gap-3 mt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-5 py-2.5 rounded-full border border-zinc-200 text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={tooShort || isPending}
            className="flex-1 px-5 py-2.5 rounded-full bg-blue-600 text-white font-semibold transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "جاري الحفظ..." : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
};
