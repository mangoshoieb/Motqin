"use client";

import { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface QuestionCardProps {
  question: Question;
  onHide: (id: number) => void;
}

const typeLabels: Record<string, string> = {
  MultipleChoiceQuestion: "اختيار من متعدد",
  FillInTheBlankQuestion: "أكمل الفراغ",
};

const difficultyStyles: Record<string, string> = {
  Easy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  Medium: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  Hard: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
};

export const QuestionCard = ({ question, onHide }: QuestionCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const title = question.title || question.questionText || "سؤال بدون عنوان";

  return (
    <div
      className="rounded-2xl bg-white border border-zinc-200 transition hover:shadow-md dark:bg-zinc-900 dark:border-zinc-800 dark:hover:shadow-none dark:hover:border-zinc-700 "
      onClick={() => setIsExpanded((prev) => !prev)}
    >
      {/* Collapsed row — only the title is clickable/visible here, no tags
          and no ignore button, so nothing destructive is one click away
          while just skimming titles. */}
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 p-5 text-right"
      >
        <span className="text-zinc-900 font-medium dark:text-zinc-100">
          {title}
        </span>
        {isExpanded && (
          <button
            type="button"
            onClick={() => onHide(question.questionID)}
            title="تجاهل هذا السؤال"
            className="flex items-center justify-center size-8 rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <X className="size-4" />
          </button>
        )}
      </button>

      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="flex items-start justify-between gap-4 px-5 pb-5">
            <div className="flex-1">
              {question.description && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {question.description}
                </p>
              )}
            </div>

            <div className="flex items-end gap-2 shrink-0">
              {question.questionType && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  {typeLabels[question.questionType] ?? question.questionType}
                </span>
              )}

              {question.difficultyLevel && (
                <span
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-semibold",
                    difficultyStyles[question.difficultyLevel] ??
                      "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  )}
                >
                  {question.difficultyLevel}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
