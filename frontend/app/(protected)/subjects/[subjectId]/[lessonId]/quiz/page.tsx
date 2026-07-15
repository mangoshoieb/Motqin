"use client";

import { Suspense, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";

import { useGetQuestionsByLesson } from "@/app/hooks/useGetQuestionsByLesson";
import { QuizCard } from "@/components/QuizCard";

const QuizPageContent = () => {
  const params = useParams();
  const searchParams = useSearchParams();

  const subjectIdSlug = params.subjectId as string;
  const lessonId = params.lessonId as string;

  const category = searchParams.get("category") ?? "";
  const typeFilter = searchParams.get("type") ?? "all";

  const { data: questions, isLoading, error } = useGetQuestionsByLesson(lessonId);

  const quizQuestions = useMemo(() => {
    return (questions ?? []).filter((q) => {
      if (category && (q.questionCategory ?? "").toLowerCase() !== category.toLowerCase()) {
        return false;
      }
      if (typeFilter !== "all" && q.questionType !== typeFilter) return false;
      return true;
    });
  }, [questions, category, typeFilter]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const currentQuestion = quizQuestions[currentIndex];

  const setAnswer = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const goNext = () => setCurrentIndex((i) => Math.min(i + 1, quizQuestions.length - 1));
  const goPrev = () => setCurrentIndex((i) => Math.max(i - 1, 0));

  if (isLoading) {
    return (
      <div dir="rtl" className="p-10 text-zinc-500 dark:text-zinc-400">
        جاري تحميل الاختبار...
      </div>
    );
  }

  if (error) {
    return (
      <div dir="rtl" className="p-10 text-red-600 dark:text-red-400">
        حدث خطأ أثناء تحميل الاختبار
      </div>
    );
  }

  if (quizQuestions.length === 0) {
    return (
      <div
        dir="rtl"
        className="min-h-screen flex flex-col items-center justify-center gap-4 bg-zinc-100 dark:bg-zinc-950 p-10 text-center"
      >
        <p className="text-zinc-500 dark:text-zinc-400">لا توجد أسئلة متاحة لهذا الاختبار</p>
        <Link
          href={`/subjects/${subjectIdSlug}/${lessonId}`}
          className="text-blue-600 dark:text-blue-400 font-medium"
        >
          العودة إلى الدرس
        </Link>
      </div>
    );
  }

  const isLast = currentIndex === quizQuestions.length - 1;

  return (
    <div dir="rtl" className="min-h-screen bg-zinc-100 dark:bg-zinc-950 flex flex-col items-center px-6 py-12">
      <div className="w-full max-w-xl mb-6">
        <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400 mb-2">
          <span>
            سؤال {currentIndex + 1} من {quizQuestions.length}
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all"
            style={{ width: `${((currentIndex + 1) / quizQuestions.length) * 100}%` }}
          />
        </div>
      </div>

      <QuizCard
        key={currentQuestion.questionID}
        question={currentQuestion}
        answer={answers[currentQuestion.questionID] ?? ""}
        onAnswerChange={(value) => setAnswer(currentQuestion.questionID, value)}
      />

      <div className="w-full max-w-xl flex items-center justify-between mt-6">
        <button
          type="button"
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="px-5 py-2.5 rounded-full border border-zinc-200 text-zinc-600 disabled:opacity-40 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          السابق
        </button>

        {isLast ? (
          <Link
            href={`/subjects/${subjectIdSlug}/${lessonId}`}
            className="px-6 py-2.5 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 dark:hover:bg-blue-500 transition"
          >
            إنهاء
          </Link>
        ) : (
          <button
            type="button"
            onClick={goNext}
            className="px-6 py-2.5 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 dark:hover:bg-blue-500 transition"
          >
            التالي
          </button>
        )}
      </div>
    </div>
  );
};

const QuizPage = () => {
  return (
    <Suspense
      fallback={
        <div dir="rtl" className="p-10 text-zinc-500 dark:text-zinc-400">
          جاري تحميل الاختبار...
        </div>
      }
    >
      <QuizPageContent />
    </Suspense>
  );
};

export default QuizPage;
