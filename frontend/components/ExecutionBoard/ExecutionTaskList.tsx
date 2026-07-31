"use client";

import { ExecutionSession, ExecutionTask } from "@/app/types/execution-board.types";
import { ExecutionTaskRow } from "./ExecutionTaskRow";

interface ExecutionTaskListProps {
  title: string;
  tasks: ExecutionTask[];
  sessionsByTaskId: Map<string, ExecutionSession[]>;
  onToggleComplete: (id: string) => void;
  onAddSession?: (task: ExecutionTask) => void;
  onToggleSession?: (sessionId: string) => void;
  onDeleteSession?: (sessionId: string) => void;
  onStartRevision?: (task: ExecutionTask) => void;
  onPostpone?: (task: ExecutionTask) => void;
  onNotesChange: (id: string, notes: string) => void;
}

export const ExecutionTaskList = ({
  title,
  tasks,
  sessionsByTaskId,
  onToggleComplete,
  onAddSession,
  onToggleSession,
  onDeleteSession,
  onStartRevision,
  onPostpone,
  onNotesChange,
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
              sessions={sessionsByTaskId.get(task.id) ?? []}
              onToggleComplete={onToggleComplete}
              onAddSession={onAddSession}
              onToggleSession={onToggleSession}
              onDeleteSession={onDeleteSession}
              onStartRevision={onStartRevision}
              onPostpone={onPostpone}
              onNotesChange={onNotesChange}
            />
          ))}
        </div>
      )}
    </section>
  );
};
