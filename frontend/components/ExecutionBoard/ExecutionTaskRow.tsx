"use client";

import { CheckSquare, Square, Play, Pause } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { ExecutionSession, ExecutionTask } from "@/app/types/execution-board.types";

interface ExecutionTaskRowProps {
  task: ExecutionTask;
  session?: ExecutionSession; // daily tasks only, once a timer's been started
  onToggleComplete: (id: string) => void;
  onStartDaily?: (task: ExecutionTask) => void; // starts/resumes a local timer
  onStartRevision?: (task: ExecutionTask) => void; // navigates into the real quiz flow
}

const formatMinutes = (minutes: number) => {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
};

export const ExecutionTaskRow = ({
  task,
  session,
  onToggleComplete,
  onStartDaily,
  onStartRevision,
}: ExecutionTaskRowProps) => {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white border border-zinc-200 p-4 dark:bg-zinc-900 dark:border-zinc-800">
      <button type="button" onClick={() => onToggleComplete(task.id)} className="shrink-0">
        {task.completed ? (
          <CheckSquare size={22} className="text-emerald-500" />
        ) : (
          <Square size={22} className="text-zinc-400" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium truncate",
            task.completed && "line-through text-zinc-500 opacity-60"
          )}
        >
          {task.title}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          {task.subjectName ? `${task.subjectName} · ` : ""}
          {task.estimatedMinutes} دقيقة
          {task.kind === "revision" && task.repetitionNumber != null
            ? ` · التكرار #${task.repetitionNumber}`
            : ""}
        </p>
      </div>

      {task.kind === "revision" ? (
        <button
          type="button"
          onClick={() => onStartRevision?.(task)}
          className="shrink-0 px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
        >
          ابدأ المراجعة
        </button>
      ) : session ? (
        session.status === "completed" ? (
          <span className="shrink-0 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold dark:bg-emerald-950 dark:text-emerald-300">
            مكتمل
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onStartDaily?.(task)}
            className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-200 text-sm font-medium transition hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {session.status === "active" ? <Pause size={16} /> : <Play size={16} />}
            {formatMinutes(session.actualMinutes)} / {formatMinutes(session.sessionDurationMinutes)}
          </button>
        )
      ) : (
        <button
          type="button"
          onClick={() => onStartDaily?.(task)}
          className="shrink-0 px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
        >
          ابدأ الجلسة
        </button>
      )}
    </div>
  );
};
