"use client";

interface LessonProgressBarProps {
  progress: LessonProgress;
}

// Session progress as a percentage, from the questions' scores (see
// getLessonProgress) — so it moves with every correct answer, not only when
// a question graduates.
export const LessonProgressBar = ({ progress }: LessonProgressBarProps) => {
  const { percent } = progress;

  return (
    <div className="flex-1 flex items-center gap-3">
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label="التقدم في الجلسة"
        className="flex-1 h-2 rounded-full bg-zinc-200 overflow-hidden dark:bg-zinc-800"
      >
        <div
          className="h-full rounded-full bg-emerald-600 dark:bg-emerald-700 transition-[width] duration-400 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      <span className="text-sm font-semibold text-zinc-700 tabular-nums dark:text-zinc-300">
        {percent}%
      </span>
    </div>
  );
};
