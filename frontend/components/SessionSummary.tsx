"use client";

import Link from "next/link";
import { AlertTriangle, CalendarClock, CheckCircle2, Loader2, PlayCircle } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { daysPhrase, formatReviewDate, questionsPhrase } from "@/app/lib/review-dates";
import type { SessionOutcome } from "@/app/hooks/useLessonSession";
import { SessionCelebration } from "@/components/SessionCelebration";

// Accuracy from which a finished session earns the badge instead of the check.
const EXCELLENT_ACCURACY = 90;

interface SessionSummaryProps {
  summary: SummaryCard;
  backHref: string;
  // Moves on to the next block — only offered on a block's summary.
  onContinue: () => void;
  // What /end answered for this sitting (final summary only). Finishing
  // every question doesn't always mean the review counted — see Outcome.
  outcome?: SessionOutcome | null;
  // Starts the next batch of this round's questions (when some are left).
  onNextRound?: () => void;
}

const Stat = ({
  value,
  label,
  accent,
  className,
  style,
}: {
  value: string | number;
  label: string;
  accent?: string;
  className?: string;
  style?: React.CSSProperties;
}) => (
  <div className={cn("rounded-xl bg-zinc-100 dark:bg-zinc-800 p-4", className)} style={style}>
    <p className={`text-2xl font-bold ${accent ?? "text-zinc-900 dark:text-zinc-100"}`}>{value}</p>
    <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
  </div>
);

// Flowchart v2 SummaryCard. Shown after every finished block with that
// block's numbers and a way on to the next block; after the last block (or
// early via the "End session" escape hatch, §8) it closes the session with
// the whole session's numbers.
export const SessionSummary = ({ summary, backHref, onContinue, outcome, onNextRound }: SessionSummaryProps) => {
  const { stats, blockStats } = summary;
  const totalAnswers = stats.correct + stats.wrong;
  const accuracy = totalAnswers > 0 ? Math.round((stats.correct / totalAnswers) * 100) : 0;

  // The server decides how the sitting ended: the round may still have
  // questions left, be finished early (doesn't count yet), or be counted.
  const result = summary.isLastBlock && outcome?.status === "done" ? outcome.result : null;
  const counted = !!result?.lessonCompleted && !result.isEarly;
  const early = !!result?.lessonCompleted && result.isEarly;
  const celebrate = counted || early;
  const excellent = counted && accuracy >= EXCELLENT_ACCURACY;

  // When celebrating, the numbers rise in one after another once the badge
  // has landed.
  const statMotion = (index: number) =>
    celebrate
      ? {
          className: "animate-rise-in motion-reduce:animate-none",
          style: { animationDelay: `${0.9 + index * 0.12}s` },
        }
      : {};

  return (
    <div className="w-full max-w-xl flex flex-col items-center gap-6 rounded-3xl bg-white border border-zinc-200 p-8 text-center dark:bg-zinc-900 dark:border-zinc-800">
      {celebrate && (
        <SessionCelebration variant={excellent ? "excellent" : "done"} confetti={counted} />
      )}

      <div
        className={cn(
          "flex flex-col items-center gap-1",
          celebrate && "animate-rise-in [animation-delay:0.6s] motion-reduce:animate-none"
        )}
      >
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          {counted
            ? excellent
              ? "أداء ممتاز! أكملت الجلسة"
              : "أحسنت! أكملت الجلسة"
            : early
              ? "أنهيت كل الأسئلة"
              : summary.isLastBlock
                ? "انتهت الجلسة"
                : "انتهت المجموعة"}
        </h2>
        {summary.totalBlocks > 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            المجموعة {summary.blockNumber} من {summary.totalBlocks}
          </p>
        )}
      </div>

      {summary.isLastBlock ? (
        <div className="grid grid-cols-2 gap-4 w-full text-right">
          <Stat value={`${accuracy}%`} label="نسبة الدقة" accent="text-blue-600 dark:text-blue-400" {...statMotion(0)} />
          <Stat value={stats.testCards} label="أسئلة تم اختبارها" {...statMotion(1)} />
          <Stat value={stats.fillerCards} label="أسئلة مراجعة" {...statMotion(2)} />
          <Stat value={stats.wrong} label="إجابات خاطئة" {...statMotion(3)} />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 w-full text-right">
          <Stat
            value={`${summary.blockDoneCount}/${summary.blockQuestionCount}`}
            label="أسئلة منجزة"
            accent="text-blue-600 dark:text-blue-400"
          />
          <Stat value={blockStats.correct} label="إجابات صحيحة" accent="text-emerald-600 dark:text-emerald-400" />
          <Stat value={blockStats.wrong} label="إجابات خاطئة" accent="text-red-600 dark:text-red-400" />
        </div>
      )}

      {summary.isLastBlock && outcome && <Outcome outcome={outcome} />}

      {summary.isLastBlock && result && !result.lessonCompleted && result.remainingQuestions > 0 && onNextRound ? (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onNextRound}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-blue-600 dark:bg-blue-700 text-white font-semibold hover:bg-blue-700 dark:hover:bg-blue-800 transition"
          >
            <PlayCircle className="size-4" />
            متابعة الأسئلة المتبقية
          </button>
          <Link
            href={backHref}
            className="px-6 py-2.5 rounded-full border border-zinc-200 text-zinc-700 font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800 transition"
          >
            العودة إلى الدرس
          </Link>
        </div>
      ) : summary.isLastBlock ? (
        <Link
          href={backHref}
          className="px-6 py-2.5 rounded-full bg-blue-600 dark:bg-blue-700 text-white font-semibold hover:bg-blue-700 dark:hover:bg-blue-500 transition"
        >
          العودة إلى الدرس
        </Link>
      ) : (
        <button
          type="button"
          onClick={onContinue}
          className="px-6 py-2.5 rounded-full bg-blue-600 dark:bg-blue-700 text-white font-semibold hover:bg-blue-700 dark:hover:bg-blue-500 transition"
        >
          متابعة إلى المجموعة التالية
        </button>
      )}
    </div>
  );
};

const NOTE_TONE = {
  info: "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-200",
  warning: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200",
} as const;

function Note({
  tone,
  icon,
  children,
}: {
  tone: keyof typeof NOTE_TONE;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex w-full items-start gap-2.5 rounded-2xl border px-4 py-3 text-right text-sm leading-relaxed", NOTE_TONE[tone])}>
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

// What /end said about the sitting, in the student's words:
//   - not finished: how many questions are left in this round;
//   - finished early: it doesn't count until the due day, and the questions
//     are open again for practice;
//   - counted: the next review's date (or that all reviews are done), and
//     whether it came in late.
function Outcome({ outcome }: { outcome: SessionOutcome }) {
  if (outcome.status === "pending") {
    return (
      <p className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
        <Loader2 className="size-4 animate-spin" />
        جاري حفظ نتيجتك...
      </p>
    );
  }

  if (outcome.status === "failed") {
    return (
      <Note tone="warning" icon={<AlertTriangle className="size-4" />}>
        <p>تعذّر حفظ نتيجة هذه الجلسة، لذلك قد لا يظهر تقدمك في المراجعة.</p>
      </Note>
    );
  }

  const { result } = outcome;

  if (!result.lessonCompleted) {
    return result.remainingQuestions > 0 ? (
      <Note tone="info" icon={<PlayCircle className="size-4" />}>
        <p className="font-semibold">باقي {questionsPhrase(result.remainingQuestions)} في هذه المراجعة</p>
        <p>أكملها لتُحسب المراجعة ويتحدد موعد المراجعة التالية.</p>
      </Note>
    ) : null;
  }

  if (result.isEarly) {
    return (
      <Note tone="warning" icon={<CalendarClock className="size-4" />}>
        <p className="font-semibold">
          {result.daysEarly > 0
            ? `أنهيتها قبل موعدها بـ${daysPhrase(result.daysEarly)}، لذلك لن تُحسب بعد`
            : "أنهيتها قبل موعدها، لذلك لن تُحسب بعد"}
        </p>
        <p>
          {result.nextReviewDate
            ? `موعد هذه المراجعة ${formatReviewDate(result.nextReviewDate)}. `
            : ""}
          الأسئلة متاحة لك من جديد للتدرّب حتى ذلك اليوم.
        </p>
      </Note>
    );
  }

  return (
    <Note tone="success" icon={<CheckCircle2 className="size-4" />}>
      <p className="font-semibold">
        {result.nextReviewDate
          ? `حُسبت هذه المراجعة. المراجعة التالية ${formatReviewDate(result.nextReviewDate)}`
          : "أنهيت كل مراجعات هذا الدرس"}
      </p>
      {result.daysLate > 0 && <p>جاءت متأخرة {daysPhrase(result.daysLate)}، لكنها حُسبت.</p>}
      {result.intervalsSource === "systemPlanLimit" && (
        <p className="text-xs opacity-80">
          باقتك لا تشمل الفترات المخصصة، فحُدد موعد المراجعة التالية بالفترات الافتراضية.
        </p>
      )}
    </Note>
  );
}
