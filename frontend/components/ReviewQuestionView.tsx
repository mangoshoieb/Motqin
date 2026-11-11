"use client";

import { AlertCircle, ChevronDown, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { QUESTION_CATEGORIES } from "@/app/constants/question.constants";
import {
  hasDraftErrors,
  type QuestionDraft,
  type QuestionDraftErrors,
} from "@/app/lib/question-draft";
import type { ReviewItem } from "@/app/lib/ai-questions-review.store";
import { PresentationCard } from "@/components/PresentationCard";
import { QuestionFields, useImagePreview } from "@/components/QuestionFields";

const CATEGORY_CHIP: Record<string, string> = {
  "أساسيات": "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  "معلومات إضافية": "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  "معلومات مهمة": "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
};

const categoryLabel = (value: string) =>
  QUESTION_CATEGORIES.find((c) => c.value === value)?.label ?? value;

// What each validation error is about, for the "missing" note under the card.
const FIELD_LABELS: Record<keyof QuestionDraftErrors, string> = {
  description: "الوصف",
  explanation: "الشرح",
  mcqText: "نص السؤال",
  options: "الخيارات والإجابة الصحيحة",
  fibText: "سؤال أكمل الفراغ",
  correctTexts: "الإجابات المقبولة",
};

const sideArrowClass =
  "hidden size-11 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-900 disabled:invisible sm:flex dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100";

interface ReviewQuestionViewProps {
  item: ReviewItem;
  // 1-based position in the whole batch, and the batch size.
  number: number;
  total: number;
  errors: QuestionDraftErrors;
  editorOpen: boolean;
  disabled?: boolean;
  onToggleEditor: () => void;
  onChange: (patch: Partial<QuestionDraft>) => void;
  onRemove: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

// One AI-generated question on the review page, shown as the info card the
// student will meet in the quiz (title, explanation, full image, audio) and
// updating live as it's edited. The tab under the card opens every field —
// the MCQ and fill-in-the-blank questions included — to change it.
export const ReviewQuestionView = ({
  item,
  number,
  total,
  errors,
  editorOpen,
  disabled,
  onToggleEditor,
  onChange,
  onRemove,
  onPrev,
  onNext,
}: ReviewQuestionViewProps) => {
  const { draft } = item;
  const invalid = hasDraftErrors(errors);
  const imageUrl = useImagePreview(draft.image);
  const audioUrl = useImagePreview(draft.audio);
  const missing = (Object.keys(errors) as (keyof QuestionDraftErrors)[]).map((key) => FIELD_LABELS[key]);

  return (
    <section id="ai-question-view" className="scroll-mt-44 flex flex-col gap-4">
      {/* Where we are, and what this question is */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          السؤال <span className="tabular-nums">{number}</span> من{" "}
          <span className="tabular-nums">{total}</span>
        </span>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-semibold",
            CATEGORY_CHIP[draft.category] ?? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
          )}
        >
          {categoryLabel(draft.category)}
        </span>
        {item.pageNumber !== null && (
          <span className="text-xs tabular-nums text-zinc-400">صفحة {item.pageNumber}</span>
        )}
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

        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className="ms-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-zinc-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-red-950/40 dark:hover:text-red-300"
        >
          <Trash2 className="size-3.5" />
          حذف السؤال
        </button>
      </div>

      {/* The info card, between previous / next */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={onPrev} disabled={!onPrev} aria-label="السؤال السابق" className={sideArrowClass}>
          <ChevronRight className="size-5" />
        </button>

        <div className="flex min-w-0 flex-1 flex-col items-center">
          <PresentationCard
            item={{
              title: draft.title.trim() || null,
              description: draft.explanation.trim(),
              imageUrl,
              audioUrl,
            }}
            // The whole card, image included — no height limit here.
            className="max-h-none max-w-none overflow-visible"
          />

          {/* The arrow: opens the questions behind this card for editing */}
          <button
            type="button"
            onClick={onToggleEditor}
            aria-expanded={editorOpen}
            className={cn(
              "-mt-4 inline-flex items-center gap-2 rounded-full border bg-white px-5 py-2 text-sm font-semibold shadow-md transition dark:bg-zinc-900",
              invalid && !editorOpen
                ? "border-red-300 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
                : "border-zinc-200 text-blue-700 hover:bg-blue-50 dark:border-zinc-700 dark:text-blue-300 dark:hover:bg-blue-950/40"
            )}
          >
            {editorOpen ? "إخفاء الأسئلة" : "عرض الأسئلة وتعديلها"}
            <ChevronDown className={cn("size-4 transition-transform", editorOpen && "rotate-180")} />
          </button>
        </div>

        <button type="button" onClick={onNext} disabled={!onNext} aria-label="السؤال التالي" className={sideArrowClass}>
          <ChevronLeft className="size-5" />
        </button>
      </div>

      {(item.saveError || (invalid && !editorOpen)) && (
        <div className="mx-auto flex w-full max-w-2xl items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p>
            {item.saveError
              ? `تعذّر حفظ هذا السؤال: ${item.saveError}`
              : `ينقص هذا السؤال: ${missing.join("، ")}. افتح الأسئلة لإكماله.`}
          </p>
        </div>
      )}

      {editorOpen && (
        <div className="mx-auto w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white p-5 animate-in fade-in slide-in-from-top-2 duration-200 dark:border-zinc-800 dark:bg-zinc-900">
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
        </div>
      )}

      {/* Previous / next under the card on phones, where the side arrows hide */}
      <div className="flex items-center justify-between gap-3 sm:hidden">
        <button
          type="button"
          onClick={onPrev}
          disabled={!onPrev}
          className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-600 disabled:invisible dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
        >
          <ChevronRight className="size-4" />
          السابق
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!onNext}
          className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-600 disabled:invisible dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
        >
          التالي
          <ChevronLeft className="size-4" />
        </button>
      </div>
    </section>
  );
};
