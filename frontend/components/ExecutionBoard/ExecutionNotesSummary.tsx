"use client";

import { ExecutionTask } from "@/app/types/execution-board.types";

interface ExecutionNotesSummaryProps {
  tasks: ExecutionTask[]; // combined daily + revision — filtered to those with a note
}

// Always rendered at the end of the execution board, regardless of how many
// (if any) tasks have a note — notes are entered per task (see
// ExecutionTaskRow's toggle), but read back here as one consolidated list.
export const ExecutionNotesSummary = ({ tasks }: ExecutionNotesSummaryProps) => {
  const notedTasks = tasks.filter((t) => t.notes && t.notes.trim().length > 0);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">الملاحظات</h2>

      {notedTasks.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">لا توجد ملاحظات بعد</p>
      ) : (
        <div className="flex flex-col gap-3">
          {notedTasks.map((task) => (
            <div
              key={task.id}
              className="rounded-2xl bg-white border border-zinc-200 p-4 dark:bg-zinc-900 dark:border-zinc-800"
            >
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">{task.title}</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">{task.notes}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
