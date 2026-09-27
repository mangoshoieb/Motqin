"use client";

interface LessonProgressBarProps {
  progress: LessonProgress;
}

// Whole-lesson progress — finished questions out of every question in the
// lesson, as the mobile session screen shows above its cards. The sidebar
// covers the current block; this covers the lesson.
export const LessonProgressBar = ({ progress }: LessonProgressBarProps) => {
  const percent = progress.total === 0 ? 0 : Math.round((progress.done / progress.total) * 100);

  return (
    <div className="flex-1 flex items-center gap-3">
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={progress.total}
        aria-valuenow={progress.done}
        aria-label="الأسئلة المنجزة"
        className="flex-1 h-2 rounded-full bg-zinc-200 overflow-hidden dark:bg-zinc-800"
      >
        <div
          className="h-full rounded-full bg-emerald-600 transition-[width] duration-400 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      <span className="text-sm font-semibold text-zinc-700 tabular-nums dark:text-zinc-300">
        {progress.done}/{progress.total}
      </span>
    </div>
  );
};
