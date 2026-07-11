"use client";

import { useState } from "react";
import { useAddMcqQuestion, useAddFillQuestion } from "@/app/hooks/useAddQuestion";
import { cn } from "@/app/lib/utils";

interface AddQuestionFormProps {
  lessonId: number;
  category: string;
  onDone: () => void;
}

const DIFFICULTIES = ["Easy", "Medium", "Hard"];

const TYPE_OPTIONS = [
  { value: "MultipleChoiceQuestion", label: "اختيار من متعدد" },
  { value: "FillInTheBlankQuestion", label: "أكمل الفراغ" },
] as const;

const inputClasses =
  "mt-1 w-full rounded-xl border border-zinc-200 bg-white p-2.5 text-sm text-zinc-900 outline-none transition focus:border-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-blue-500 dark:placeholder:text-zinc-500";

export const AddQuestionForm = ({ lessonId, category, onDone }: AddQuestionFormProps) => {
  const [type, setType] = useState<(typeof TYPE_OPTIONS)[number]["value"]>(
    "MultipleChoiceQuestion"
  );
  const [questionText, setQuestionText] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState("Easy");
  const [answerOptions, setAnswerOptions] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [correctText, setCorrectText] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);

  const addMcq = useAddMcqQuestion(String(lessonId));
  const addFill = useAddFillQuestion(String(lessonId));

  const isPending = addMcq.isPending || addFill.isPending;
  const errorMessage = addMcq.error || addFill.error ? "تعذّرت إضافة السؤال، حاول مرة أخرى" : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (type === "MultipleChoiceQuestion") {
      addMcq.mutate(
        {
          lessonID: lessonId,
          questionCategory: category,
          questionText,
          difficultyLevel,
          answerOptions,
          correctAnswer,
        },
        { onSuccess: onDone }
      );
    } else {
      addFill.mutate(
        {
          lessonID: lessonId,
          questionCategory: category,
          questionText,
          difficultyLevel,
          correctText,
          caseSensitive,
        },
        { onSuccess: onDone }
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl bg-white border border-zinc-200 p-6 dark:bg-zinc-900 dark:border-zinc-800"
    >
      <div className="flex gap-2">
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setType(opt.value)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium border transition",
              type === opt.value
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-zinc-600 border-zinc-200 hover:border-blue-300 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-700 dark:hover:border-blue-500"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div>
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">نص السؤال</label>
        <textarea
          required
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          className={inputClasses}
          rows={2}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          مستوى الصعوبة
        </label>
        <select
          value={difficultyLevel}
          onChange={(e) => setDifficultyLevel(e.target.value)}
          className={cn(inputClasses, "cursor-pointer")}
        >
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {type === "MultipleChoiceQuestion" ? (
        <>
          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              خيارات الإجابة (مفصولة بفاصلة)
            </label>
            <input
              required
              value={answerOptions}
              onChange={(e) => setAnswerOptions(e.target.value)}
              placeholder="مثال: أ,ب,ج,د"
              className={inputClasses}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              الإجابة الصحيحة
            </label>
            <input
              required
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
              className={inputClasses}
            />
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              الإجابة الصحيحة (النص)
            </label>
            <input
              required
              value={correctText}
              onChange={(e) => setCorrectText(e.target.value)}
              className={inputClasses}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={caseSensitive}
              onChange={(e) => setCaseSensitive(e.target.checked)}
              className="accent-blue-600"
            />
            حساس لحالة الأحرف
          </label>
        </>
      )}

      {errorMessage && <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2.5 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700 transition disabled:opacity-50 dark:hover:bg-blue-500"
        >
          {isPending ? "جاري الإضافة..." : "إضافة السؤال"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="px-5 py-2.5 rounded-full border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          إلغاء
        </button>
      </div>
    </form>
  );
};
