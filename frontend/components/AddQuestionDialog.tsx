"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { useAddUserQuestion } from "@/app/hooks/useAddQuestion";
import { getApiErrorMessage } from "@/app/lib/api-error";
import type { QuestionCategoryValue } from "@/app/constants/question.constants";
import {
  emptyQuestionDraft,
  hasDraftErrors,
  questionDraftToInput,
  validateQuestionDraft,
  type QuestionDraft,
} from "@/app/lib/question-draft";
import { QuestionFields } from "@/components/QuestionFields";

interface AddQuestionDialogProps {
  lessonId: number;
  // The tab the student is on — the category field starts there.
  defaultCategory: QuestionCategoryValue;
  // Appended after the lesson's existing questions.
  displayOrder: number;
  onCreated: (category: QuestionCategoryValue) => void;
  onCancel: () => void;
}

// Popup for POST /questions/add-user-question: one information row (title,
// description, explanation, optional media) with its MCQ card, and an
// optional fill-in-the-blank card behind a toggle.
export const AddQuestionDialog = ({
  lessonId,
  defaultCategory,
  displayOrder,
  onCreated,
  onCancel,
}: AddQuestionDialogProps) => {
  const addQuestion = useAddUserQuestion(String(lessonId));
  const [draft, setDraft] = useState<QuestionDraft>(() => emptyQuestionDraft(defaultCategory));
  // Errors only show once the student has tried to submit.
  const [submitted, setSubmitted] = useState(false);

  const errors = validateQuestionDraft(draft);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (hasDraftErrors(errors) || addQuestion.isPending) return;

    addQuestion.mutate(questionDraftToInput(draft, lessonId, displayOrder), {
      onSuccess: () => {
        toast.success("تمت إضافة السؤال");
        onCreated(draft.category);
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={onCancel}
    >
      <form
        dir="rtl"
        noValidate
        onSubmit={handleSubmit}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.key === "Escape" && onCancel()}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">إضافة سؤال</h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="إغلاق"
            className="rounded-full p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5">
          <QuestionFields
            draft={draft}
            onChange={(patch) => setDraft((prev) => ({ ...prev, ...patch }))}
            errors={errors}
            showErrors={submitted}
            idPrefix="add-question"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 border-t border-zinc-100 px-6 py-4 dark:border-zinc-800">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full border border-zinc-200 px-5 py-2.5 text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={addQuestion.isPending}
            className="flex-1 rounded-full bg-blue-600 px-5 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {addQuestion.isPending ? "جاري الإضافة..." : "إضافة السؤال"}
          </button>
        </div>
      </form>
    </div>
  );
};
