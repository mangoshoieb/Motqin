"use client";

import { useState } from "react";
import { CheckSquare, Square, Play, Pause, X, StickyNote, SkipForward } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { ExecutionSession, ExecutionTask } from "@/app/types/execution-board.types";

interface ExecutionTaskRowProps {
  task: ExecutionTask;
  sessions: ExecutionSession[]; // daily tasks only — every session logged for this task
  onToggleComplete: (id: string) => void;
  onAddSession?: (task: ExecutionTask) => void; // starts a new session for this task
  onToggleSession?: (sessionId: string) => void; // play/pause an existing session
  onDeleteSession?: (sessionId: string) => void;
  onStartRevision?: (task: ExecutionTask) => void; // navigates into the real quiz flow
  onPostpone?: (task: ExecutionTask) => void; // sends an unfinished task to tomorrow
  onNotesChange: (id: string, notes: string) => void;
}

const formatMinutes = (minutes: number) => {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
};

export const ExecutionTaskRow = ({
  task,
  sessions,
  onToggleComplete,
  onAddSession,
  onToggleSession,
  onDeleteSession,
  onStartRevision,
  onPostpone,
  onNotesChange,
}: ExecutionTaskRowProps) => {
  const [notesOpen, setNotesOpen] = useState(Boolean(task.notes));

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white border border-zinc-200 p-4 dark:bg-zinc-900 dark:border-zinc-800">
      <div className="flex items-center gap-3">
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

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setNotesOpen((prev) => !prev)}
            title="ملاحظة"
            className={cn(
              "flex items-center justify-center size-8 rounded-full transition hover:bg-zinc-100 dark:hover:bg-zinc-800",
              task.notes ? "text-blue-600 dark:text-blue-400" : "text-zinc-400 dark:text-zinc-500"
            )}
          >
            <StickyNote size={16} />
          </button>

          {!task.completed && onPostpone && (
            <button
              type="button"
              onClick={() => onPostpone(task)}
              title="إرسال إلى الغد"
              className="flex items-center justify-center size-8 rounded-full text-zinc-400 transition hover:bg-zinc-100 dark:text-zinc-500 dark:hover:bg-zinc-800"
            >
              <SkipForward size={16} />
            </button>
          )}

          {task.kind === "revision" && (
            <button
              type="button"
              onClick={() => onStartRevision?.(task)}
              className="px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
            >
              ابدأ المراجعة
            </button>
          )}
        </div>
      </div>

      {task.kind === "daily" && (
        <div className="flex flex-col gap-2 pr-9">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-1.5 dark:border-zinc-700"
            >
              {session.status === "completed" ? (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">مكتمل</span>
              ) : (
                <button type="button" onClick={() => onToggleSession?.(session.id)} className="shrink-0">
                  {session.status === "active" ? (
                    <Pause size={16} className="text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Play size={16} className="text-blue-600 dark:text-blue-400" />
                  )}
                </button>
              )}

              <span className="flex-1 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                {formatMinutes(session.actualMinutes)} / {formatMinutes(session.sessionDurationMinutes)}
              </span>

              <button
                type="button"
                onClick={() => onDeleteSession?.(session.id)}
                title="حذف الجلسة"
                className="shrink-0 text-zinc-400 transition hover:text-red-600 dark:hover:text-red-400"
              >
                <X size={14} />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => onAddSession?.(task)}
            className="self-start text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            + إضافة جلسة
          </button>
        </div>
      )}

      {notesOpen && (
        <div className="pr-9">
          <textarea
            value={task.notes ?? ""}
            onChange={(e) => onNotesChange(task.id, e.target.value)}
            placeholder="أضف ملاحظة..."
            rows={2}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-2 text-sm outline-none transition focus:border-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:focus:border-blue-500"
          />
        </div>
      )}
    </div>
  );
};
