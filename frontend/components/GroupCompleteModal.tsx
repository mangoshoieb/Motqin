"use client";

interface GroupCompleteModalProps {
  stats: GroupStats;
  hasMoreGroups: boolean;
  onContinue: () => void;
  onStop: () => void;
}

// The "continue or not" popup — shown once every item in the current group
// has been answered correctly at least once.
export const GroupCompleteModal = ({ stats, hasMoreGroups, onContinue, onStop }: GroupCompleteModalProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
      <div
        dir="rtl"
        className="w-full max-w-sm flex flex-col items-center gap-6 rounded-3xl bg-white border border-zinc-200 p-8 text-center dark:bg-zinc-900 dark:border-zinc-800"
      >
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          أتممت مجموعة من {stats.itemCount} أسئلة
        </h2>

        <div className="grid grid-cols-2 gap-4 w-full">
          <div className="rounded-xl bg-zinc-100 dark:bg-zinc-800 p-4">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {Math.round(stats.accuracy * 100)}%
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">إجابات صحيحة من أول محاولة</p>
          </div>
          <div className="rounded-xl bg-zinc-100 dark:bg-zinc-800 p-4">
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {stats.totalWrongAttempts}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">محاولات خاطئة</p>
          </div>
        </div>

        {hasMoreGroups ? (
          <div className="flex items-center gap-3 w-full">
            <button
              type="button"
              onClick={onStop}
              className="flex-1 px-5 py-2.5 rounded-full border border-zinc-200 text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              توقف هنا
            </button>
            <button
              type="button"
              onClick={onContinue}
              className="flex-1 px-5 py-2.5 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 dark:hover:bg-blue-500 transition"
            >
              متابعة
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onStop}
            className="w-full px-5 py-2.5 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 dark:hover:bg-blue-500 transition"
          >
            إنهاء
          </button>
        )}
      </div>
    </div>
  );
};
