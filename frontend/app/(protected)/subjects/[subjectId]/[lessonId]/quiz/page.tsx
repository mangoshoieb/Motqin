"use client";

import { Suspense, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { CalendarClock, CheckCircle2, RotateCcw, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatReviewDate } from "@/app/lib/review-dates";
import { useRestartRepetition } from "@/app/hooks/useRestartRepetition";
import { getApiErrorMessage } from "@/app/lib/api-error";

import { useLessonSession } from "@/app/hooks/useLessonSession";
import { QuizCard } from "@/components/QuizCard";
import { PresentationCard } from "@/components/PresentationCard";
import { FeedbackBanner } from "@/components/FeedbackBanner";
import { SessionSummary } from "@/components/SessionSummary";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { LessonProgressBar } from "@/components/LessonProgressBar";

// onNextRound: start over with the round's next batch of questions.
const QuizPageContent = ({ onNextRound }: { onNextRound: () => void }) => {
  const params = useParams();
  const searchParams = useSearchParams();

  const subjectIdSlug = params.subjectId as string;
  const lessonId = params.lessonId as string;
  const lessonHref = `/subjects/${subjectIdSlug}/${lessonId}`;

  // The route segment is a "{id}-{slug}" pair (see the subject page); the
  // spaced-repetition endpoints want the bare numeric id.
  const subjectId = subjectIdSlug.split("-")[0];

  // No type filter any more — the algorithm decides MCQ vs fill-in-the-blank
  // from each question's score, so letting the student pin one would break the
  // graduation rule.
  const category = searchParams.get("category") ?? undefined;

  const {
    isLoading,
    error,
    isRepetitionDone,
    currentCard,
    cardKey,
    lessonProgress,
    hasAnswered,
    timing,
    outcome,
    feedback,
    continueCard,
    submitAnswer,
    endSession,
  } = useLessonSession(lessonId, { category, subjectId });

  const [answer, setAnswer] = useState("");
  const queryClient = useQueryClient();
  // The "this review isn't due yet" note, until the student closes it.
  const [earlyNoteClosed, setEarlyNoteClosed] = useState(false);

  // The next batch: drop this one (it's cached for the whole visit), then
  // remount the session so it starts afresh.
  const startNextRound = () => {
    queryClient.removeQueries({ queryKey: ["session-questions", lessonId] });
    onNextRound();
  };
  const restart = useRestartRepetition(lessonId);
  const [confirmEnd, setConfirmEnd] = useState(false);

  // Ending before the session is over keeps only the questions mastered so
  // far — warn first, once there's something to lose.
  const requestEnd = () => {
    if (hasAnswered) setConfirmEnd(true);
    else endSession();
  };

  const endConfirmation = confirmEnd && (
    <ConfirmDialog
      title="إنهاء الجلسة الآن؟"
      message="لم تُكمل الجلسة بعد. إذا أنهيتها الآن فلن يُحفظ تقدمك في الأسئلة التي لم تُتقنها، ويُحفظ فقط ما أتقنته."
      confirmLabel="إنهاء الجلسة"
      cancelLabel="متابعة الجلسة"
      onConfirm={() => {
        setConfirmEnd(false);
        endSession();
      }}
      onCancel={() => setConfirmEnd(false)}
    />
  );

  if (error) {
    return (
      <div dir="rtl" className="p-10 text-red-600 dark:text-red-400">
        حدث خطأ أثناء تحميل الاسئلة
      </div>
    );
  }

  // The backend has no unfinished questions left in this repetition.
  if (isRepetitionDone) {
    return (
      <div dir="rtl" className="min-h-screen bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center px-6">
        <div className="w-full max-w-md flex flex-col items-center gap-3 rounded-3xl bg-white border border-zinc-200 p-8 text-center dark:bg-zinc-900 dark:border-zinc-800">
          <span className="flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle2 className="size-7" />
          </span>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">أحسنت! أنهيت كل الأسئلة</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            لا توجد أسئلة متبقية في هذه الفئة لهذه المراجعة.
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={lessonHref}
              className="px-6 py-2.5 rounded-full bg-blue-600 dark:bg-blue-700 text-white font-semibold transition hover:bg-blue-700 dark:hover:bg-blue-800"
            >
              العودة إلى الدرس
            </Link>
            {category && (
              <button
                type="button"
                disabled={restart.isPending}
                onClick={() =>
                  restart.mutate(category, {
                    onError: (error) => toast.error(getApiErrorMessage(error)),
                  })
                }
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-zinc-200 text-zinc-700 font-medium transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <RotateCcw className="size-4" />
                {restart.isPending ? "جاري إعادة الضبط..." : "البدء من جديد"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || !currentCard) {
    return (
      <div dir="rtl" className="p-10 text-zinc-500 dark:text-zinc-400">
        جاري تحميل الأسئلة...
      </div>
    );
  }

  if (currentCard.type === "summary") {
    return (
      <div dir="rtl" className="min-h-screen bg-zinc-100 dark:bg-zinc-950 flex flex-col items-center px-6 py-12">
        {/* A block summary is mid-session, so the escape hatch stays. */}
        {!currentCard.isLastBlock && (
          <div className="w-full max-w-xl flex justify-end mb-4">
            <button
              type="button"
              onClick={requestEnd}
              className="text-sm text-zinc-500 cursor-pointer hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 transition"
            >
              إنهاء الجلسة
            </button>
          </div>
        )}

        <SessionSummary
          key={cardKey}
          summary={currentCard}
          backHref={lessonHref}
          onContinue={continueCard}
          outcome={outcome}
          onNextRound={startNextRound}
        />
        {endConfirmation}
      </div>
    );
  }

  const handleSubmit = () => {
    if (!answer.trim()) return;
    submitAnswer(answer);
    setAnswer("");
  };

  return (
    <div dir="rtl" className="min-h-screen bg-zinc-100 dark:bg-zinc-950 px-10 py-12">
      <div className="mx-auto flex flex-col items-center">
        <div className="w-full flex flex-col items-center">
          {/* Taken before its due day: finishing still completes the
              sitting, but the review only counts from that day. */}
          {timing?.isEarly && !earlyNoteClosed && (
            <div className="w-full max-w-2xl mb-4 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
              <CalendarClock className="mt-0.5 size-4 shrink-0" />
              <p className="flex-1 leading-relaxed">
                {timing.dueDate
                  ? `هذه المراجعة موعدها ${formatReviewDate(timing.dueDate)}، وإنهاؤها الآن لن يُحسب حتى ذلك اليوم.`
                  : "هذه المراجعة لم يحن موعدها بعد، وإنهاؤها الآن لن يُحسب حتى ذلك اليوم."}{" "}
                يمكنك المتابعة للتدرّب.
              </p>
              <button
                type="button"
                onClick={() => setEarlyNoteClosed(true)}
                aria-label="إغلاق"
                className="rounded-full p-0.5 text-amber-700 transition hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/40"
              >
                <X className="size-4" />
              </button>
            </div>
          )}

          <div className="w-full max-w-2xl flex items-center gap-4 mb-4">
            {lessonProgress && <LessonProgressBar progress={lessonProgress} />}

            <button
              type="button"
              onClick={requestEnd}
              className="text-sm text-zinc-500 cursor-pointer hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 transition"
            >
              إنهاء الجلسة
            </button>
          </div>

          {currentCard.type === "info" && <PresentationCard item={currentCard.item} />}

          {(currentCard.type === "test" || currentCard.type === "filler") && (
            <QuizCard
              key={cardKey}
              question={currentCard.item}
              form={currentCard.form}
              answer={answer}
              onAnswerChange={setAnswer}
              onSubmit={handleSubmit}
              isReview={currentCard.type === "filler"}
            />
          )}

          <div className="w-full max-w-2xl flex items-center justify-end mt-6">
            {currentCard.type === "info" ? (
              <button
                type="button"
                onClick={continueCard}
                className="px-6 py-2.5 rounded-full bg-blue-600 dark:bg-blue-700 text-white font-semibold hover:bg-blue-700 dark:hover:bg-blue-500 transition"
              >
                متابعة
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!answer.trim()}
                className="px-6 py-2.5 rounded-full bg-blue-600 dark:bg-blue-700 text-white font-semibold hover:bg-blue-700 dark:hover:bg-blue-500 transition disabled:opacity-40"
              >
                إرسال الإجابة
              </button>
            )}
          </div>
        </div>
      </div>

      {feedback && <FeedbackBanner correct={feedback.correct} />}
      {endConfirmation}
    </div>
  );
};

const QuizPage = () => {
  // Bumped to start the round's next batch in a fresh session.
  const [round, setRound] = useState(0);

  return (
    <Suspense
      fallback={
        <div dir="rtl" className="p-10 text-zinc-500 dark:text-zinc-400">
          جاري تحميل الاختبار...
        </div>
      }
    >
      <QuizPageContent key={round} onNextRound={() => setRound((r) => r + 1)} />
    </Suspense>
  );
};

export default QuizPage;
