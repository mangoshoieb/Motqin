"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface QuizCardProps {
  question: SessionItemPayload;
  answer: string;
  onAnswerChange: (value: string) => void;
  // §1/§6.2 — a Filler card reviews an already-finished question; answering
  // it never changes score or un-finishes the question.
  isReview?: boolean;
}

const typeLabels: Record<string, string> = {
  MultipleChoiceQuestion: "اختيار من متعدد",
  FillInTheBlankQuestion: "أكمل الفراغ",
};

export const QuizCard = ({ question, answer, onAnswerChange, isReview = false }: QuizCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const options = (question.answerOptions ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  const hasInfo = Boolean(question.description || question.imageUrl || question.audioUrl);

  return (
    <div className="w-full max-w-2xl" style={{ perspective: "1200px" }}>
      <div
        className={cn(
          "grid w-full transition-transform duration-500",
          isFlipped && "[transform:rotateY(180deg)]"
        )}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front — question + answer input. Both faces share the same grid
            cell (col-start-1 row-start-1) so the container auto-sizes to
            whichever face is taller, instead of a fixed height that made
            questions with more options overflow past the card border. */}
        <div
          className="col-start-1 row-start-1 flex flex-col rounded-3xl bg-white border border-zinc-200 p-6 max-h-[75vh] overflow-y-auto dark:bg-zinc-900 dark:border-zinc-800"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex flex-wrap gap-2">
              {question.questionType && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  {typeLabels[question.questionType] ?? question.questionType}
                </span>
              )}
              {isReview && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                  مراجعة
                </span>
              )}
            </div>

            {hasInfo && (
              <button
                type="button"
                onClick={() => setIsFlipped(true)}
                title="عرض المعلومات المساعدة"
                className="flex items-center justify-center size-9 rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-blue-600 transition dark:hover:bg-zinc-800 dark:hover:text-blue-400 shrink-0"
              >
                <Eye className="size-5" />
              </button>
            )}
          </div>

          <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-6">
            {question.questionText}
          </p>

          <div className="flex-1 flex flex-col gap-3">
            {question.questionType === "MultipleChoiceQuestion" ? (
              options.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => onAnswerChange(option)}
                  className={cn(
                    "text-right px-4 py-3 rounded-xl border transition",
                    answer === option
                      ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-500"
                      : "border-zinc-200 text-zinc-700 hover:border-blue-300 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-blue-500"
                  )}
                >
                  {option}
                </button>
              ))
            ) : (
              <input
                type="text"
                value={answer}
                onChange={(e) => onAnswerChange(e.target.value)}
                placeholder="اكتب إجابتك هنا"
                className="w-full rounded-xl border border-zinc-200 bg-white p-3 text-sm text-zinc-900 outline-none transition focus:border-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-blue-500"
              />
            )}
          </div>
        </div>

        {/* Back — supporting info: text, image, audio */}
        <div
          className="col-start-1 row-start-1 flex flex-col rounded-3xl bg-white border border-zinc-200 p-6 max-h-[75vh] overflow-y-auto dark:bg-zinc-900 dark:border-zinc-800"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className="flex items-start justify-between gap-3 mb-4">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              معلومات مساعدة
            </h3>

            <button
              type="button"
              onClick={() => setIsFlipped(false)}
              title="العودة إلى السؤال"
              className="flex items-center justify-center size-9 rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-blue-600 transition dark:hover:bg-zinc-800 dark:hover:text-blue-400 shrink-0"
            >
              <EyeOff className="size-5" />
            </button>
          </div>

          <div className="flex-1 flex flex-col gap-4">
            {question.description && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{question.description}</p>
            )}

            {question.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={question.imageUrl}
                alt=""
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 object-cover"
              />
            )}

            {question.audioUrl && <audio controls src={question.audioUrl} className="w-full" />}

            {!hasInfo && (
              <p className="text-sm text-zinc-400 dark:text-zinc-500">
                لا توجد معلومات إضافية لهذا السؤال
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
