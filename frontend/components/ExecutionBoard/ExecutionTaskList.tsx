"use client";

import { BreakTimer, ExecutionSession, ExecutionTask } from "@/app/types/execution-board.types";
import { ExecutionTaskRow } from "./ExecutionTaskRow";

interface ExecutionTaskListProps {
  title: string;
  tasks: ExecutionTask[];
  sessionsByTaskId: Map<string, ExecutionSession[]>;
  breakMinutes?: number; // pomodoroBreakMinutes from the user's preferences
  onToggleComplete: (id: string) => void;
  onAddSession?: (task: ExecutionTask) => void;
  onToggleSession?: (sessionId: string) => void;
  onSaveOvertime?: (sessionId: string) => void;
  onDismissOvertime?: (sessionId: string) => void;
  onSpendOvertimeAsBreak?: (sessionId: string) => void;
  breakTimer?: BreakTimer | null;
  onStartBreak?: (sessionId: string) => void;
  onStopBreak?: () => void;
  onUpdateSession?: (sessionId: string, changes: { title?: string; durationMinutes?: number; notes?: string }) => void;
  onDeleteSession?: (sessionId: string) => void;
  onStartRevision?: (task: ExecutionTask) => void;
  onPostpone?: (task: ExecutionTask) => void;
  onNotesChange: (id: string, notes: string) => void;
  onEdit?: (task: ExecutionTask) => void;
  onDelete?: (task: ExecutionTask) => void;
  onDropTask?: (draggedId: string, targetId: string) => void;
}

export const ExecutionTaskList = ({
  title,
  tasks,
  sessionsByTaskId,
  breakMinutes,
  onToggleComplete,
  onAddSession,
  onToggleSession,
  onSaveOvertime,
  onDismissOvertime,
  onSpendOvertimeAsBreak,
  breakTimer,
  onStartBreak,
  onStopBreak,
  onUpdateSession,
  onDeleteSession,
  onStartRevision,
  onPostpone,
  onNotesChange,
  onEdit,
  onDelete,
  onDropTask,
}: ExecutionTaskListProps) => {
  return (
    <section className="flex flex-col gap-3">
      {title && <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{title}</h2>}

      {tasks.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">لا توجد مهام هنا لهذا اليوم</p>
      ) : (
        <div className="flex flex-col gap-3">
          {tasks.map((task) => (
            <ExecutionTaskRow
              key={task.id}
              task={task}
              sessions={sessionsByTaskId.get(task.id) ?? []}
              breakMinutes={breakMinutes}
              onToggleComplete={onToggleComplete}
              onAddSession={onAddSession}
              onToggleSession={onToggleSession}
              onSaveOvertime={onSaveOvertime}
              onDismissOvertime={onDismissOvertime}
              onSpendOvertimeAsBreak={onSpendOvertimeAsBreak}
              breakTimer={breakTimer}
              onStartBreak={onStartBreak}
              onStopBreak={onStopBreak}
              onUpdateSession={onUpdateSession}
              onDeleteSession={onDeleteSession}
              onStartRevision={onStartRevision}
              onPostpone={onPostpone}
              onNotesChange={onNotesChange}
              onEdit={onEdit}
              onDelete={onDelete}
              onDropTask={onDropTask}
            />
          ))}
        </div>
      )}
    </section>
  );
};
