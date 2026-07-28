"use client";

import { Check } from "lucide-react";

interface BlockProgressSidebarProps {
  progress: BlockProgress;
}

const dotStyles: Record<BlockProgressItem["status"], string> = {
  done: "size-4 bg-emerald-600",
  current: "size-5 bg-blue-600 ring-4 ring-blue-600/20",
  pending: "size-3 bg-white border-2 border-zinc-300 dark:bg-zinc-900 dark:border-zinc-700",
};

const labelStyles: Record<BlockProgressItem["status"], string> = {
  done: "text-zinc-500 dark:text-zinc-400",
  current: "text-zinc-900 dark:text-zinc-100 font-semibold",
  pending: "text-zinc-400 dark:text-zinc-600",
};

// A vertical connected-dot timeline (line + dot per question), windowed to
// just previous/current/next around wherever the student is in the current
// block — never the whole block.
export const BlockProgressSidebar = ({ progress }: BlockProgressSidebarProps) => {
  return (
    <div className="w-full rounded-2xl bg-white border border-zinc-200 p-5 dark:bg-zinc-900 dark:border-zinc-800">
      <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-5">
        السؤال {progress.current} من {progress.total}
      </p>

      <div className="flex flex-col">
        {progress.window.map((entry, i) => (
          <div key={entry.index} className="flex items-stretch gap-3">
            {/* rail: connecting line above/below the dot, dot in the middle */}
            <div className="flex flex-col items-center w-5 shrink-0">
              <div
                className={`w-0.5 flex-1 min-h-[10px] ${
                  i === 0 ? "invisible" : "bg-zinc-300 dark:bg-zinc-700"
                }`}
              />
              <span
                className={`flex items-center justify-center rounded-full shrink-0 text-white ${dotStyles[entry.status]}`}
              >
                {entry.status === "done" && <Check className="size-2.5" />}
              </span>
              <div
                className={`w-0.5 flex-1 min-h-[10px] ${
                  i === progress.window.length - 1 ? "invisible" : "bg-zinc-300 dark:bg-zinc-700"
                }`}
              />
            </div>

            <div className="pb-6 min-w-0">
              <p className={`text-xs mb-0.5 ${labelStyles[entry.status]}`}>سؤال {entry.index}</p>
              <p className={`text-sm truncate ${labelStyles[entry.status]}`}>
                {entry.item.title || entry.item.questionText}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
