"use client";

import Link from "next/link";
import { cn } from "@/app/lib/utils";
import { SessionCelebration } from "@/components/SessionCelebration";

// Accuracy from which a finished session earns the badge instead of the check.
const EXCELLENT_ACCURACY = 90;

interface SessionSummaryProps {
  summary: SummaryCard;
  backHref: string;
  // Moves on to the next block — only offered on a block's summary.
  onContinue: () => void;
  // The session was finished (every question graduated), not ended early —
  // only then is there a celebration.
  completed?: boolean;
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
export const SessionSummary = ({ summary, backHref, onContinue, completed = false }: SessionSummaryProps) => {
  const { stats, blockStats } = summary;
  const totalAnswers = stats.correct + stats.wrong;
  const accuracy = totalAnswers > 0 ? Math.round((stats.correct / totalAnswers) * 100) : 0;
  const celebrate = summary.isLastBlock && completed;

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
        <SessionCelebration variant={accuracy >= EXCELLENT_ACCURACY ? "excellent" : "done"} />
      )}

      <div
        className={cn(
          "flex flex-col items-center gap-1",
          celebrate && "animate-rise-in [animation-delay:0.6s] motion-reduce:animate-none"
        )}
      >
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          {celebrate
            ? accuracy >= EXCELLENT_ACCURACY
              ? "أداء ممتاز! أكملت الجلسة"
              : "أحسنت! أكملت الجلسة"
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

      {summary.isLastBlock ? (
        <Link
          href={backHref}
          className="px-6 py-2.5 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 dark:hover:bg-blue-500 transition"
        >
          العودة إلى الدرس
        </Link>
      ) : (
        <button
          type="button"
          onClick={onContinue}
          className="px-6 py-2.5 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 dark:hover:bg-blue-500 transition"
        >
          متابعة إلى المجموعة التالية
        </button>
      )}
    </div>
  );
};
