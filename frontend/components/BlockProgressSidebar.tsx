"use client";

import { Check, BookOpen, Circle } from "lucide-react";

interface BlockProgressSidebarProps {
  progress: BlockProgress;
}

const iconStyles: Record<BlockProgressItem["status"], string> = {
  done: "bg-emerald-600 text-white",
  studying: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  waiting: "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500",
};

const labelStyles: Record<BlockProgressItem["status"], string> = {
  done: "text-zinc-500 dark:text-zinc-400",
  studying: "text-zinc-900 dark:text-zinc-100",
  waiting: "text-zinc-400 dark:text-zinc-600",
};

const icons: Record<BlockProgressItem["status"], typeof Check> = {
  done: Check,
  studying: BookOpen,
  waiting: Circle,
};

// Full current-block progress list — every question in the block (not a
// window), each with a status icon: done (check), studying/seen-but-not-
// finished (book), or waiting/not-seen (empty circle). Reflects the next
// block automatically once the current one finishes.
export const BlockProgressSidebar = ({ progress }: BlockProgressSidebarProps) => {
  return (
    <div className="w-full rounded-2xl bg-white border border-zinc-200 p-5 dark:bg-zinc-900 dark:border-zinc-800">
      <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-5">
        المجموعة {progress.blockNumber} من {progress.totalBlocks}
      </p>

      <div className="flex flex-col gap-2">
        {progress.items.map((entry) => {
          const Icon = icons[entry.status];
          return (
            <div
              key={entry.index}
              className={`flex items-center gap-3 rounded-xl p-2 transition ${
                entry.isCurrent ? "bg-blue-50 ring-1 ring-blue-600/30 dark:bg-blue-950/30" : ""
              }`}
            >
              <span
                className={`flex items-center justify-center size-7 rounded-full shrink-0 ${iconStyles[entry.status]}`}
              >
                <Icon className="size-3.5" />
              </span>

              <p className={`text-sm truncate ${labelStyles[entry.status]}`}>
                {entry.index}.{" "}
                {entry.item.title ||
                  entry.item.mcq?.questionText ||
                  entry.item.fib?.questionText}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
