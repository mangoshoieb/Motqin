"use client";

import { CheckCircle2, XCircle } from "lucide-react";

interface FeedbackBannerProps {
  correct: boolean;
  onContinue: () => void;
}

// Shown right after ANSWER, before the flow moves on — tells the student
// whether they got it right, and if not, that it'll come back around later.
export const FeedbackBanner = ({ correct, onContinue }: FeedbackBannerProps) => {
  return (
    <div
      className={`w-full max-w-xl flex items-center justify-between gap-4 rounded-2xl border p-4 ${
        correct
          ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900"
          : "bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-900"
      }`}
    >
      <div className="flex items-center gap-2">
        {correct ? (
          <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        ) : (
          <XCircle className="size-5 text-red-600 dark:text-red-400 shrink-0" />
        )}
        <p
          className={`text-sm font-medium ${
            correct ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"
          }`}
        >
          {correct ? "إجابة صحيحة!" : "إجابة خاطئة — ستظهر لك هذه السؤال مرة أخرى لاحقًا"}
        </p>
      </div>

      <button
        type="button"
        onClick={onContinue}
        className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold text-white transition ${
          correct ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
        }`}
      >
        متابعة
      </button>
    </div>
  );
};
