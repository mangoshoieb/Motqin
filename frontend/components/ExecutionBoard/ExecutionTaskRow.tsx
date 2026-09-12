"use client";

import { useState } from "react";
import { Check, CheckSquare, ChevronDown, ChevronUp, Square, Play, Pause, X, SkipForward, MoreVertical, Star, Pencil, Trash2, Save, TimerReset } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { ExecutionSession, ExecutionTask } from "@/app/types/execution-board.types";

interface ExecutionTaskRowProps {
  task: ExecutionTask;
  sessions: ExecutionSession[]; // daily tasks only — every session logged for this task
  onToggleComplete: (id: string) => void;
  onAddSession?: (task: ExecutionTask) => void; // starts a new session for this task
  onToggleSession?: (sessionId: string) => void; // play/pause an existing session
  onEndSession?: (sessionId: string) => void; // finish it before its time is up
  // overtime counter shown after the clock ran out — credit it or drop it
  onSaveOvertime?: (sessionId: string) => void;
  onDismissOvertime?: (sessionId: string) => void;
  // title / duration edits from the expanded card, saved per field on blur
  onUpdateSession?: (sessionId: string, changes: { title?: string; durationMinutes?: number; notes?: string }) => void;
  onDeleteSession?: (sessionId: string) => void;
  onStartRevision?: (task: ExecutionTask) => void; // navigates into the real quiz flow
  onPostpone?: (task: ExecutionTask) => void; // sends an unfinished task to tomorrow
  onNotesChange: (id: string, notes: string) => void;
  onEdit?: (task: ExecutionTask) => void;
  onDelete?: (task: ExecutionTask) => void;
  onDropTask?: (draggedId: string, targetId: string) => void;
}

// mm:ss — the session clock runs in real time, so seconds are what move.
const formatClock = (totalSeconds: number) => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const sessionInputClass =
  "mt-1 w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-900 outline-none focus:border-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";

export const ExecutionTaskRow = ({
  task,
  sessions,
  onToggleComplete,
  onAddSession,
  onToggleSession,
  onEndSession,
  onSaveOvertime,
  onDismissOvertime,
  onUpdateSession,
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
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [durationDraft, setDurationDraft] = useState("");
  const [notesDraft, setNotesDraft] = useState("");
  // Backend priority 1/2/3 = focus slot; 1 is the most urgent and shows the
  // most stars. Anything else is an extra task with no stars.
  const stars = task.priority && task.priority >= 1 && task.priority <= 3 ? 4 - task.priority : 0;

  // Opening a card seeds the drafts from whatever the session currently holds.
  const openSession = (session: ExecutionSession) => {
    setExpandedSessionId(session.id);
    setTitleDraft(session.title);
    setDurationDraft(String(session.sessionDurationMinutes));
    setNotesDraft(session.notes ?? "");
  };

  const toggleExpanded = (session: ExecutionSession) => {
    if (expandedSessionId === session.id) setExpandedSessionId(null);
    else openSession(session);
  };

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
      className="grid cursor-grab grid-cols-1 overflow-hidden bg-transparent p-0 active:cursor-grabbing lg:grid-cols-[1.1fr_0.9fr]"
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
          <div className="flex items-center gap-2">
            <p
              className={cn(
                "min-w-0 flex-1 text-sm font-medium truncate",
                task.completed && "line-through text-zinc-500 opacity-60"
              )}
            >
              {task.title}
            </p>
            {stars > 0 && (
              <div
                className="flex shrink-0 gap-0.5"
                title={`الأولوية ${task.priority}`}
                aria-label={`الأولوية ${stars} من 3`}
              >
                {[1, 2, 3].map((star) => (
                  <Star
                    key={star}
                    size={18}
                    fill={star <= stars ? "currentColor" : "none"}
                    className={star <= stars ? "text-amber-400" : "text-zinc-300 dark:text-zinc-700"}
                  />
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {task.subjectName ? `${task.subjectName} · ` : ""}
            {task.estimatedMinutes} دقيقة
            {task.kind === "revision" && task.repetitionNumber != null
              ? ` · التكرار #${task.repetitionNumber}`
              : ""}
          </p>
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
          {sessions.map((session) => {
            const expanded = expandedSessionId === session.id;
            const elapsedSeconds = session.elapsedSeconds ?? session.actualMinutes * 60;

            return (
              <div
                key={session.id}
                className="rounded-xl border border-zinc-200 dark:border-zinc-700"
              >
                {/* Collapsed header: clicking it (or the chevron) opens the
                    card for editing; play/pause acts right away. */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleExpanded(session)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      toggleExpanded(session);
                    }
                  }}
                  className="flex cursor-pointer items-center gap-2 px-3 py-1.5"
                >
                  {session.status === "completed" ? (
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">مكتمل</span>
                  ) : (
                    <button
                      type="button"
                      title={session.status === "active" ? "إيقاف مؤقت" : "بدء الجلسة"}
                      onClick={(event) => {
                        event.stopPropagation();
                        onToggleSession?.(session.id);
                      }}
                      className="flex size-7 shrink-0 items-center justify-center rounded-full text-blue-600 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40"
                    >
                      {session.status === "active" ? (
                        <Pause size={16} />
                      ) : (
                        <Play size={16} />
                      )}
                    </button>
                  )}

                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-zinc-700 dark:text-zinc-200">
                    {session.title}
                  </span>

                  <span
                    className={cn(
                      "shrink-0 rounded-lg px-2 py-0.5 text-xs font-medium tabular-nums",
                      session.status === "active"
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
                    )}
                  >
                    {formatClock(elapsedSeconds)} / {formatClock(session.sessionDurationMinutes * 60)}
                  </span>

                  {session.status !== "completed" && session.status !== "idle" && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onEndSession?.(session.id);
                      }}
                      title="إنهاء الجلسة"
                      className="shrink-0 text-zinc-400 transition hover:text-emerald-600 dark:hover:text-emerald-400"
                    >
                      <Check size={15} />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteSession?.(session.id);
                    }}
                    title="حذف الجلسة"
                    className="shrink-0 text-zinc-400 transition hover:text-red-600 dark:hover:text-red-400"
                  >
                    <X size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleExpanded(session);
                    }}
                    title={expanded ? "إغلاق" : "تعديل الجلسة"}
                    className="shrink-0 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                  >
                    {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

                {session.overtimeRunning && (
                  <div
                    onClick={(event) => event.stopPropagation()}
                    className="flex items-center gap-2 border-t border-amber-200 bg-amber-50 px-3 py-1.5 dark:border-amber-900/50 dark:bg-amber-950/30"
                  >
                    <TimerReset size={14} className="shrink-0 text-amber-600 dark:text-amber-400" />
                    <span className="min-w-0 flex-1 truncate text-xs text-amber-800 dark:text-amber-200">
                      انتهى وقت الجلسة — ما زلت تعمل؟ الوقت الإضافي:
                    </span>
                    <span className="shrink-0 text-xs font-bold tabular-nums text-amber-800 dark:text-amber-200">
                      +{formatClock(session.overtimeSeconds ?? 0)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onSaveOvertime?.(session.id)}
                      title="إضافة الوقت الإضافي إلى الجلسة"
                      className="flex shrink-0 items-center gap-1 rounded-md bg-amber-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-amber-700"
                    >
                      <Save size={12} />
                      حفظ
                    </button>
                    <button
                      type="button"
                      onClick={() => onDismissOvertime?.(session.id)}
                      title="تجاهل"
                      className="shrink-0 text-amber-500 hover:text-amber-800 dark:hover:text-amber-200"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {expanded && (
                  <div className="flex flex-col gap-3 border-t border-zinc-200 px-3 py-3 dark:border-zinc-700">
                    <div className="flex flex-col gap-3 sm:flex-row">
                    <label className="flex-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                      عنوان الجلسة
                      <input
                        value={titleDraft}
                        onChange={(event) => setTitleDraft(event.target.value)}
                        onBlur={() => onUpdateSession?.(session.id, { title: titleDraft })}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") event.currentTarget.blur();
                          if (event.key === "Escape") {
                            setTitleDraft(session.title);
                            event.currentTarget.blur();
                          }
                        }}
                        placeholder="مثال: مراجعة الفصل الأول"
                        className={sessionInputClass}
                      />
                    </label>

                    <label className="text-[11px] text-zinc-500 sm:w-32 dark:text-zinc-400">
                      المدة بالدقائق
                      <input
                        type="number"
                        min={1}
                        value={durationDraft}
                        onChange={(event) => setDurationDraft(event.target.value)}
                        onBlur={() =>
                          onUpdateSession?.(session.id, { durationMinutes: Number(durationDraft) })
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter") event.currentTarget.blur();
                          if (event.key === "Escape") {
                            setDurationDraft(String(session.sessionDurationMinutes));
                            event.currentTarget.blur();
                          }
                        }}
                        className={sessionInputClass}
                      />
                    </label>
                    </div>

                    <label className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      ملاحظات الجلسة
                      <textarea
                        rows={2}
                        value={notesDraft}
                        onChange={(event) => setNotesDraft(event.target.value)}
                        onBlur={() => onUpdateSession?.(session.id, { notes: notesDraft })}
                        onKeyDown={(event) => {
                          if (event.key === "Escape") {
                            setNotesDraft(session.notes ?? "");
                            event.currentTarget.blur();
                          }
                        }}
                        placeholder="أضف ملاحظة عن هذه الجلسة..."
                        className={cn(sessionInputClass, "resize-y")}
                      />
                    </label>
                  </div>
                )}
              </div>
            );
          })}

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

      <div className="flex my-3 min-h-30 flex-col rounded-2xl bg-zinc-50 p-5 dark:bg-zinc-800">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">الملاحظات </h3>
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
