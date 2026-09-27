"use client";

import Link from "next/link";

interface SessionSummaryProps {
  summary: SummaryCard;
  backHref: string;
  // Moves on to the next block — only offered on a block's summary.
  onContinue: () => void;
}

const Stat = ({ value, label, accent }: { value: string | number; label: string; accent?: string }) => (
  <div className="rounded-xl bg-zinc-100 dark:bg-zinc-800 p-4">
    <p className={`text-2xl font-bold ${accent ?? "text-zinc-900 dark:text-zinc-100"}`}>{value}</p>
    <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
  </div>
);

// Flowchart v2 SummaryCard. Shown after every finished block with that
// block's numbers and a way on to the next block; after the last block (or
// early via the "End session" escape hatch, §8) it closes the session with
// the whole session's numbers.
export const SessionSummary = ({ summary, backHref, onContinue }: SessionSummaryProps) => {
  const { stats, blockStats } = summary;
  const totalAnswers = stats.correct + stats.wrong;
  const accuracy = totalAnswers > 0 ? Math.round((stats.correct / totalAnswers) * 100) : 0;

  return (
    <div className="w-full max-w-xl flex flex-col items-center gap-6 rounded-3xl bg-white border border-zinc-200 p-8 text-center dark:bg-zinc-900 dark:border-zinc-800">
      <div className="flex flex-col items-center gap-1">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          {summary.isLastBlock ? "انتهت الجلسة" : "انتهت المجموعة"}
        </h2>
        {summary.totalBlocks > 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            المجموعة {summary.blockNumber} من {summary.totalBlocks}
          </p>
        )}
      </div>

      {summary.isLastBlock ? (
        <div className="grid grid-cols-2 gap-4 w-full text-right">
          <Stat value={`${accuracy}%`} label="نسبة الدقة" accent="text-blue-600 dark:text-blue-400" />
          <Stat value={stats.testCards} label="أسئلة تم اختبارها" />
          <Stat value={stats.fillerCards} label="أسئلة مراجعة" />
          <Stat value={stats.wrong} label="إجابات خاطئة" />
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
