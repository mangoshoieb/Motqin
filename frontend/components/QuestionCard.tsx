"use client";

import { CheckCircle2 , CircleArrowLeft, ImageIcon, Volume2 } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface QuestionCardProps {
  information: LessonInformation;
  // Ignores the question for this student. Left out for questions that
  // can't be ignored (the student's own), which then show no button.
  onIgnore?: (information: LessonInformation) => void;
  isIgnoring?: boolean;
  // Opens the question's info card (title, explanation, image, audio).
  onOpen: (information: LessonInformation) => void;
}

// One question on the lesson page: its title and description, always shown.
// The MCQ / fill-in-the-blank cards and their answers belong to the quiz
// session, not this list — a click opens the info card instead.
export const QuestionCard = ({ information, onIgnore, isIgnoring, onOpen }: QuestionCardProps) => {
  const { infoCard, mcqCard } = information;
  const title = information.title || infoCard?.title || mcqCard?.text || "سؤال بدون عنوان";
  const description = infoCard?.explanation;
  const finished = !!information.isFinished;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(information)}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(information);
        }
      }}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-2xl border p-5 text-right transition hover:shadow-md dark:hover:shadow-none",
        finished
          ? "border-emerald-200 bg-emerald-50/40 hover:border-emerald-300 dark:border-emerald-900/60 dark:bg-emerald-950/20"
          : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
      )}
    >
      {finished ? (
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <CircleArrowLeft className="mt-0.5 size-5 shrink-0 text-zinc-300 dark:text-zinc-600" />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-zinc-900 dark:text-zinc-100" dir="auto">
            {title}
          </span>
          {finished && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
              مكتمل
            </span>
          )}
        </div>

        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400" dir="auto">
          {description || "لا يوجد شرح لهذه المعلومة"}
        </p>

        {(infoCard?.imageUrl || infoCard?.audioUrl) && (
          <div className="mt-2 flex items-center gap-3 text-xs text-zinc-400">
            {infoCard?.imageUrl && (
              <span className="flex items-center gap-1">
                <ImageIcon className="size-3.5" />
                صورة
              </span>
            )}
            {infoCard?.audioUrl && (
              <span className="flex items-center gap-1">
                <Volume2 className="size-3.5" />
                صوت
              </span>
            )}
          </div>
        )}
      </div>

      {onIgnore && (
        <button
          type="button"
          disabled={isIgnoring}
          onClick={(e) => {
            e.stopPropagation();
            onIgnore(information);
          }}
          className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-red-800 transition hover:bg-red-200 hover:text-zinc-800 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        >
          {isIgnoring ? "جاري التجاهل..." : "تجاهل هذه المعلومة"}
        </button>
      )}
    </div>
  );
};
