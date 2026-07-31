"use client";

import { ExecutionSession, ExecutionTask } from "@/app/types/execution-board.types";
import { ExecutionTaskRow } from "./ExecutionTaskRow";

interface ExecutionTaskListProps {
  title: string;
  tasks: ExecutionTask[];
  sessionsByTaskId: Map<string, ExecutionSession>;
  onToggleComplete: (id: string) => void;
  onStartDaily?: (task: ExecutionTask) => void;
  onStartRevision?: (task: ExecutionTask) => void;
}

export const ExecutionTaskList = ({
  title,
  tasks,
  sessionsByTaskId,
  onToggleComplete,
  onStartDaily,
  onStartRevision,
}: ExecutionTaskListProps) => {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{title}</h2>

      {tasks.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">لا توجد مهام هنا لهذا اليوم</p>
      ) : (
        <div className="flex flex-col gap-3">
          {tasks.map((task) => (
            <ExecutionTaskRow
              key={task.id}
              task={task}
              session={sessionsByTaskId.get(task.id)}
              onToggleComplete={onToggleComplete}
              onStartDaily={onStartDaily}
              onStartRevision={onStartRevision}
            />
          ))}
        </div>
      )}
    </section>
  );
};
