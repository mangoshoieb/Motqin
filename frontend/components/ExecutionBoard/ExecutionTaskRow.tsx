"use client";

import { useState } from "react";
import { CheckSquare, Square, Play, Pause, X, SkipForward, MoreVertical, Star, Pencil, Trash2 } from "lucide-react";
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
  onEdit?: (task: ExecutionTask) => void;
  onDelete?: (task: ExecutionTask) => void;
  onDropTask?: (draggedId: string, targetId: string) => void;
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
  onEdit,
  onDelete,
  onDropTask,
}: ExecutionTaskRowProps) => {
  const [noteEditing, setNoteEditing] = useState(false);
  const [noteDraft, setNoteDraft] = useState(task.notes ?? "");
  const [menuOpen, setMenuOpen] = useState(false);
  const priority = Math.max(0, Math.min(3, task.priority ?? 0));

  return (
    <div
      draggable
      onDragStart={(event) => event.dataTransfer.setData("text/task-id", task.id)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const draggedId = event.dataTransfer.getData("text/task-id");
        if (draggedId && draggedId !== task.id) onDropTask?.(draggedId, task.id);
      }}
      className="grid cursor-grab grid-cols-1 overflow-hidden bg-transparent p-0 active:cursor-grabbing lg:grid-cols-[0.94fr_1.06fr]"
    >
      <div className="flex min-w-0 flex-col gap-3 rounded-lg bg-white p-5 dark:bg-zinc-900">
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
          <div className="mt-1 flex gap-0.5" aria-label={`الأولوية ${priority} من 3`}>
            {[1, 2, 3].map((star) => (
              <Star key={star} size={13} fill={star <= priority ? "currentColor" : "none"} className={star <= priority ? "text-amber-400" : "text-zinc-300 dark:text-zinc-700"} />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <div className="relative">
            <button type="button" title="خيارات المهمة" onClick={() => setMenuOpen((open) => !open)} className="flex size-8 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"><MoreVertical size={17} /></button>
            {menuOpen && (
              <div className="absolute left-0 top-9 z-20 min-w-36 rounded-xl border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
                <button type="button" onClick={() => { setMenuOpen(false); onEdit?.(task); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-right text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700"><Pencil size={14} /> تعديل المهمة</button>
                {!task.completed && onPostpone && <button type="button" onClick={() => { setMenuOpen(false); onPostpone(task); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-right text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700"><SkipForward size={14} /> إرسال إلى الغد</button>}
                <button type="button" onClick={() => { setMenuOpen(false); onDelete?.(task); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-right text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"><Trash2 size={14} /> حذف المهمة</button>
              </div>
            )}
          </div>

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
      </div>

      <div className="flex h-[90%] mt-3 min-h-50 flex-col rounded-l-2xl bg-zinc-50 p-5 dark:bg-zinc-800">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">ملاحظات المهمة</h3>
        </div>

        {noteEditing ? (
          <div className="flex flex-col gap-3">
            <textarea
              value={noteDraft}
              onChange={(event) => setNoteDraft(event.target.value)}
              placeholder="أضف ملاحظة..."
              rows={5}
              autoFocus
              className="min-h-22 w-full resize-y rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm outline-none transition focus:border-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:focus:border-blue-500"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setNoteDraft(task.notes ?? "");
                  setNoteEditing(false);
                }}
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  onNotesChange(task.id, noteDraft.trim());
                  setNoteEditing(false);
                }}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
              >
                حفظ
              </button>
            </div>
          </div>
        ) : task.notes ? (
          <button
            type="button"
            onClick={() => setNoteEditing(true)}
            className="flex flex-1 whitespace-pre-wrap rounded-lg bg-zinc-50 p-3 text-right text-sm text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
          >
            {task.notes}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setNoteDraft("");
              setNoteEditing(true);
            }}
            className="flex flex-1 items-center justify-center px-3 py-8 text-sm text-zinc-400 transition hover:text-blue-600 dark:hover:text-blue-400"
          >
            لا يوجد ملاحظات أضف ملاحظة
          </button>
        )}
      </div>
    </div>
  );
};
