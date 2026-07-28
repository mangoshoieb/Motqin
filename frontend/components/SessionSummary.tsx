"use client";

import Link from "next/link";

interface SessionSummaryProps {
  stats: SessionStats;
  backHref: string;
}

// §1/§5 SummaryCard — shown once every question in the lesson is finished,
// or early via the "End session" escape hatch (§8) with whatever numbers
// exist so far.
export const SessionSummary = ({ stats, backHref }: SessionSummaryProps) => {
  const totalAnswers = stats.correct + stats.wrong;
  const accuracy = totalAnswers > 0 ? Math.round((stats.correct / totalAnswers) * 100) : 0;

  return (
    <div className="w-full max-w-xl flex flex-col items-center gap-6 rounded-3xl bg-white border border-zinc-200 p-8 text-center dark:bg-zinc-900 dark:border-zinc-800">
      <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">انتهت الجلسة</h2>

      <div className="grid grid-cols-2 gap-4 w-full text-right">
        <div className="rounded-xl bg-zinc-100 dark:bg-zinc-800 p-4">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{accuracy}%</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">نسبة الدقة</p>
        </div>
        <div className="rounded-xl bg-zinc-100 dark:bg-zinc-800 p-4">
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.testCards}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">أسئلة تم اختبارها</p>
        </div>
        <div className="rounded-xl bg-zinc-100 dark:bg-zinc-800 p-4">
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.fillerCards}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">أسئلة مراجعة</p>
        </div>
        <div className="rounded-xl bg-zinc-100 dark:bg-zinc-800 p-4">
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.wrong}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">إجابات خاطئة</p>
        </div>
      </div>

      <Link
        href={backHref}
        className="px-6 py-2.5 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 dark:hover:bg-blue-500 transition"
      >
        العودة إلى الدرس
      </Link>
    </div>
  );
};
