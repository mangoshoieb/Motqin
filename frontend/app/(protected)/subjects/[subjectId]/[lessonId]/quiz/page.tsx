"use client";

import { Suspense, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

import { useLessonSession } from "@/app/hooks/useLessonSession";
import { QuizCard } from "@/components/QuizCard";
import { PresentationCard } from "@/components/PresentationCard";
import { FeedbackBanner } from "@/components/FeedbackBanner";
import { SessionSummary } from "@/components/SessionSummary";
import { BlockProgressSidebar } from "@/components/BlockProgressSidebar";

const QuizPageContent = () => {
  const params = useParams();
  const searchParams = useSearchParams();

  const subjectIdSlug = params.subjectId as string;
  const lessonId = params.lessonId as string;
  const lessonHref = `/subjects/${subjectIdSlug}/${lessonId}`;

  // No type filter any more — the algorithm decides MCQ vs fill-in-the-blank
  // from each question's score, so letting the student pin one would break the
  // graduation rule.
  const category = searchParams.get("category") ?? undefined;

  const { isLoading, error, currentCard, blockProgress, feedback, continueCard, submitAnswer, endSession } =
    useLessonSession(lessonId, { category });

  const [answer, setAnswer] = useState("");

  if (isLoading || !currentCard) {
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

  if (currentCard.type === "summary") {
    return (
      <div dir="rtl" className="min-h-screen bg-zinc-100 dark:bg-zinc-950 flex flex-col items-center px-6 py-12">
        <SessionSummary stats={currentCard.stats} backHref={lessonHref} />
      </div>
    );
  }

  const handleSubmit = () => {
    submitAnswer(answer);
    setAnswer("");
  };

  return (
    <div dir="rtl" className="min-h-screen bg-zinc-100 dark:bg-zinc-950 px-10 py-12">
      <div className=" mx-auto flex flex-col-reverse lg:flex-row gap-10 items-start">
        {blockProgress && (
          <aside className="w-full lg:w-64 shrink-0 mt-9">
            <BlockProgressSidebar progress={blockProgress} />
          </aside>
        )}

        <div className="flex-1 w-full flex flex-col items-center">
          <div className="w-full max-w-2xl flex justify-end mb-4">
            <button
              type="button"
              onClick={endSession}
              className="text-sm text-zinc-500 cursor-pointer hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 transition"
            >
              إنهاء الجلسة
            </button>
          </div>

          {currentCard.type === "info" && <PresentationCard item={currentCard.item} />}

          {(currentCard.type === "test" || currentCard.type === "filler") && (
            <QuizCard
              question={currentCard.item}
              form={currentCard.form}
              answer={answer}
              onAnswerChange={setAnswer}
              isReview={currentCard.type === "filler"}
            />
          )}

          <div className="w-full max-w-2xl flex items-center justify-end mt-6">
            {currentCard.type === "info" ? (
              <button
                type="button"
                onClick={continueCard}
                className="px-6 py-2.5 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 dark:hover:bg-blue-500 transition"
              >
                متابعة
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!answer}
                className="px-6 py-2.5 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 dark:hover:bg-blue-500 transition disabled:opacity-40"
              >
                إرسال الإجابة
              </button>
            )}
          </div>
        </div>
      </div>

      {feedback && <FeedbackBanner correct={feedback.correct} />}
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
