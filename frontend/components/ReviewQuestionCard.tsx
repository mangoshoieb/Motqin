"use client";

import { ArrowLeft, ArrowRight, ChevronDown, ImageIcon, Trash2 } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { QUESTION_CATEGORIES } from "@/app/constants/question.constants";
import { hasDraftErrors, type QuestionDraftErrors } from "@/app/lib/question-draft";
import type { ReviewItem } from "@/app/lib/ai-questions-review.store";
import type { QuestionDraft } from "@/app/lib/question-draft";
import { QuestionFields, useImagePreview } from "@/components/QuestionFields";

const CATEGORY_CHIP: Record<string, string> = {
  "أساسيات": "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  "معلومات إضافية": "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  "معلومات مهمة": "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
};

const categoryLabel = (value: string) =>
  QUESTION_CATEGORIES.find((c) => c.value === value)?.label ?? value;

interface ReviewQuestionCardProps {
  item: ReviewItem;
  // 1-based position in the whole batch (not the filtered view).
  number: number;
  errors: QuestionDraftErrors;
  expanded: boolean;
  disabled?: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<QuestionDraft>) => void;
  onRemove: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

// One AI-generated question on the review page. Collapsed it's a one-line
// summary so a long batch stays skimmable; expanded it's the full question
// form, with previous / next to walk the batch without scrolling.
export const ReviewQuestionCard = ({
  item,
  number,
  errors,
  expanded,
  disabled,
  onToggle,
  onChange,
  onRemove,
  onPrev,
  onNext,
}: ReviewQuestionCardProps) => {
  const { draft } = item;
  const invalid = hasDraftErrors(errors);
  const thumbnail = useImagePreview(draft.image);
  const heading = draft.title.trim() || draft.mcqText.trim() || "سؤال بدون عنوان";
  const subheading = draft.title.trim() ? draft.mcqText.trim() : draft.description.trim();
  const firstError = Object.values(errors)[0];

  return (
    <div
      id={`ai-question-${item.key}`}
      className={cn(
        "scroll-mt-28 rounded-2xl border bg-white transition dark:bg-zinc-900",
        expanded
          ? "border-blue-400 shadow-md dark:border-blue-600"
          : item.saveError || invalid
            ? "border-red-300 dark:border-red-900"
            : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
      )}
    >
      {/* Summary row — the whole row toggles the card */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={onToggle}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onToggle();
          }
        }}
        className="flex cursor-pointer items-center gap-3 px-4 py-3"
      >
        <span className="w-6 shrink-0 text-center text-sm tabular-nums text-zinc-400">{number}</span>

        <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
          {thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element -- a local blob: preview
            <img src={thumbnail} alt="" className="size-full object-cover" />
          ) : (
            <ImageIcon className="size-4" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-zinc-900 dark:text-zinc-100" dir="auto">
            {heading}
          </p>
          <p
            className={cn(
              "truncate text-sm",
              item.saveError || (invalid && !expanded)
                ? "text-red-600 dark:text-red-400"
                : "text-zinc-500 dark:text-zinc-400"
            )}
            dir="auto"
          >
            {item.saveError ?? (invalid && !expanded ? firstError : subheading) ?? ""}
          </p>
        </div>

        <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
          {item.saveError ? (
            <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">
              فشل الحفظ
            </span>
          ) : invalid ? (
            <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">
              يحتاج تعديل
            </span>
          ) : (
            item.edited && (
              <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                معدّل
              </span>
            )
          )}
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-semibold",
              CATEGORY_CHIP[draft.category] ?? "bg-zinc-100 text-zinc-600"
            )}
          >
            {categoryLabel(draft.category)}
          </span>
          {item.pageNumber !== null && (
            <span className="text-xs tabular-nums text-zinc-400">ص {item.pageNumber}</span>
          )}
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          disabled={disabled}
          aria-label={`حذف السؤال ${number}`}
          className="shrink-0 rounded-full p-1.5 text-zinc-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40 dark:hover:bg-red-950/40"
        >
          <Trash2 className="size-4" />
        </button>
        <ChevronDown
          className={cn("size-4 shrink-0 text-zinc-400 transition-transform", expanded && "rotate-180")}
        />
      </div>

      {expanded && (
        <div className="border-t border-zinc-100 px-4 pb-4 pt-4 dark:border-zinc-800">
          <fieldset disabled={disabled} className="contents">
            <QuestionFields
              draft={draft}
              onChange={onChange}
              errors={errors}
              // The AI filled these in; point out what's missing right away.
              showErrors
              idPrefix={`ai-${item.key}`}
            />
          </fieldset>

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onPrev}
              disabled={!onPrev}
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-4 py-2 text-sm text-zinc-600 transition hover:bg-zinc-50 disabled:invisible dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <ArrowRight className="size-4" />
              السابق
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={!onNext}
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-4 py-2 text-sm text-zinc-600 transition hover:bg-zinc-50 disabled:invisible dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              التالي
              <ArrowLeft className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
