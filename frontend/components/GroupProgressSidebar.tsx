"use client";

import { Check, AlertTriangle } from "lucide-react";

interface GroupProgressSidebarProps {
  progress: GroupProgress;
}

const rowStyles: Record<GroupProgressItem["status"], string> = {
  done: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-300",
  current:
    "border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-600/20 dark:bg-blue-950/40 dark:border-blue-500 dark:text-blue-300",
  "retry-pending":
    "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-300",
  pending: "border-zinc-200 bg-white text-zinc-400 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-500",
};

const badgeStyles: Record<GroupProgressItem["status"], string> = {
  done: "bg-emerald-600 text-white",
  current: "bg-blue-600 text-white",
  "retry-pending": "bg-amber-500 text-white",
  pending: "bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
};

// Right-hand progress rail: a 1-3 row window (previous/current/next) around
// wherever the student is in the current group, plus a position counter.
// Never renders the whole group — just enough to orient the student.
export const GroupProgressSidebar = ({ progress }: GroupProgressSidebarProps) => {
  return (
    <div className="w-full rounded-2xl bg-white border border-zinc-200 p-4 dark:bg-zinc-900 dark:border-zinc-800">
      <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-4">
        السؤال {progress.current} من {progress.total}
      </p>

      <div className="flex flex-col gap-2">
        {progress.window.map((entry) => (
          <div
            key={entry.index}
            className={`flex items-center gap-3 rounded-xl border p-3 transition ${rowStyles[entry.status]}`}
          >
            <span
              className={`flex items-center justify-center size-6 rounded-full text-xs font-bold shrink-0 ${badgeStyles[entry.status]}`}
            >
              {entry.status === "done" ? (
                <Check className="size-3.5" />
              ) : entry.status === "retry-pending" ? (
                <AlertTriangle className="size-3.5" />
              ) : (
                entry.index
              )}
            </span>
            <p className="text-sm font-medium truncate">{entry.item.title || entry.item.questionText}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
