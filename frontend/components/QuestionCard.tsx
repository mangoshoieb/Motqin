"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface QuestionCardProps {
  information: LessonInformation;
  onHide: (id: number) => void;
}

export const QuestionCard = ({ information, onHide }: QuestionCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const { infoCard, mcqCard } = information;
  const title =
    information.title || infoCard?.title || mcqCard?.text || "سؤال بدون عنوان";

  // Expanding shows the explanation only. The MCQ/fill-in-the-blank cards and
  // their answers belong to the quiz session, not this browsing list.
  const description = infoCard?.explanation;

  return (
    <div
      className="rounded-2xl bg-white border border-zinc-200 transition hover:shadow-md dark:bg-zinc-900 dark:border-zinc-800 dark:hover:shadow-none dark:hover:border-zinc-700"
      onClick={() => setIsExpanded((prev) => !prev)}
    >
      {/* Collapsed row — only the title is visible here, so nothing
          destructive is one click away while just skimming titles. */}
      <div className="flex w-full items-center justify-between gap-4 p-5 text-right cursor-pointer">
        <span className="text-zinc-900 font-medium dark:text-zinc-100">
          {title}
        </span>

        {isExpanded && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onHide(information.informationID);
            }}
            title="تجاهل هذا السؤال"
            className="flex items-center justify-center size-8 shrink-0 rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5">
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {description || "لا يوجد شرح لهذه المعلومة"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
