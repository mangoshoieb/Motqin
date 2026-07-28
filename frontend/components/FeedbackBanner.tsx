"use client";

import { CheckCircle2, XCircle } from "lucide-react";

interface FeedbackBannerProps {
  correct: boolean;
}

// A brief, non-blocking flash after ANSWER — purely a UI overlay, not a
// card in the algorithm. The flow already advanced to whatever's next
// (including an immediate re-teach on wrong) by the time this shows; it
// auto-dismisses on its own (see useLessonSession's feedback timer) rather
// than waiting for a tap, so re-teach still feels immediate per spec.
export const FeedbackBanner = ({ correct }: FeedbackBannerProps) => {
  return (
    <div className="fixed bottom-6 inset-x-0 z-50 flex justify-center px-6 pointer-events-none">
      <div
        className={`flex items-center gap-2 rounded-full border px-4 py-2.5 shadow-lg ${
          correct
            ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-900"
            : "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-900"
        }`}
      >
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
          {correct ? "إجابة صحيحة!" : "إجابة خاطئة"}
        </p>
      </div>
    </div>
  );
};
