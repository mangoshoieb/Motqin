"use client";

import { Suspense, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

import { useLessonSession } from "@/app/hooks/useLessonSession";
import { QuizCard } from "@/components/QuizCard";
import { PresentationCard } from "@/components/PresentationCard";
import { FeedbackBanner } from "@/components/FeedbackBanner";
import { GroupCompleteModal } from "@/components/GroupCompleteModal";
import { GroupProgressSidebar } from "@/components/GroupProgressSidebar";

const QuizPageContent = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const subjectIdSlug = params.subjectId as string;
  const lessonId = params.lessonId as string;
  const lessonHref = `/subjects/${subjectIdSlug}/${lessonId}`;

  const category = searchParams.get("category") ?? undefined;
  const questionType = searchParams.get("type") ?? undefined;

  const { isLoading, error, currentCard, groupProgress, continueCard, submitAnswer, continueToNextGroup } =
    useLessonSession(lessonId, { category, questionType });

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

  return (
    <div dir="rtl" className="min-h-screen bg-zinc-100 dark:bg-zinc-950 px-6 py-12">
      <div className="max-w-5xl mx-auto flex flex-col-reverse lg:flex-row gap-8 items-start">
        {groupProgress && (
          <aside className="w-full lg:w-64 shrink-0">
            <GroupProgressSidebar progress={groupProgress} />
          </aside>
        )}

        <div className="flex-1 w-full flex flex-col items-center">
          <div className="w-full max-w-xl flex justify-end mb-4">
            <Link
              href={lessonHref}
              className="text-sm text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 transition"
            >
              إنهاء الجلسة
            </Link>
          </div>

          {currentCard.type === "presentation" && <PresentationCard item={currentCard.item} />}

          {currentCard.type === "test" && (
            <QuizCard question={currentCard.item} answer={answer} onAnswerChange={setAnswer} />
          )}

          {currentCard.type === "feedback" && (
            <QuizCard question={currentCard.item} answer={answer} onAnswerChange={() => {}} />
          )}

          {(currentCard.type === "presentation" || currentCard.type === "test") && (
            <div className="w-full max-w-xl flex items-center justify-end mt-6">
              {currentCard.type === "presentation" ? (
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
                  onClick={() => submitAnswer(answer)}
                  disabled={!answer}
                  className="px-6 py-2.5 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 dark:hover:bg-blue-500 transition disabled:opacity-40"
                >
                  إرسال الإجابة
                </button>
              )}
            </div>
          )}

          {currentCard.type === "feedback" && (
            <div className="mt-6">
              <FeedbackBanner
                correct={currentCard.correct}
                onContinue={() => {
                  setAnswer("");
                  continueCard();
                }}
              />
            </div>
          )}

          {currentCard.type === "group-complete" && (
            <GroupCompleteModal
              stats={currentCard.stats}
              hasMoreGroups={currentCard.hasMoreGroups}
              onContinue={() => {
                setAnswer("");
                continueToNextGroup();
              }}
              onStop={() => router.push(lessonHref)}
            />
          )}
        </div>
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
