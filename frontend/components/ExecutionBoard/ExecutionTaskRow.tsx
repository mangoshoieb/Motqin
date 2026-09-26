"use client";

import { useEffect, useRef, useState } from "react";
import { Check, CheckCircle2, CheckSquare, GripVertical, ChevronDown, ChevronUp, Square, Play, Pause, X, SkipForward, MoreVertical, Star, Pencil, Trash2, Save, TimerReset, Coffee } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { formatMinutes } from "@/app/lib/duration";
import { RichTextContent, RichTextEditor, isRichTextEmpty } from "@/components/ui/RichTextEditor";
import { BreakTimer, ExecutionSession, ExecutionTask } from "@/app/types/execution-board.types";

interface ExecutionTaskRowProps {
  task: ExecutionTask;
  sessions: ExecutionSession[]; // daily tasks only — every session logged for this task
  breakMinutes?: number; // break shown between sessions, from user preferences
  onToggleComplete: (id: string) => void;
  onAddSession?: (task: ExecutionTask) => void; // starts a new session for this task
  // Logs study done outside the app (status ManuallyCompleted).
  onAddCompletedSession?: (task: ExecutionTask) => void;
  onToggleSession?: (sessionId: string) => void; // play/pause an existing session
  // overtime counter shown after the clock ran out — credit it or drop it
  onSaveOvertime?: (sessionId: string) => void;
  onDismissOvertime?: (sessionId: string) => void;
  onSpendOvertimeAsBreak?: (sessionId: string) => void; // bonus → rest instead of saving it
  // The board-wide break clock and its controls.
  breakTimer?: BreakTimer | null;
  onStartBreak?: (sessionId: string) => void;
  onStopBreak?: () => void;
  // title / duration edits from the expanded card, saved per field on blur
  onUpdateSession?: (sessionId: string, changes: { title?: string; durationMinutes?: number; notes?: string }) => void;
  onDeleteSession?: (sessionId: string) => void;
  onStartRevision?: (task: ExecutionTask) => void; // navigates into the real quiz flow
  onPostpone?: (task: ExecutionTask) => void; // sends an unfinished task to tomorrow
  onNotesChange: (id: string, notes: string) => void;
  onEdit?: (task: ExecutionTask) => void;
  onDelete?: (task: ExecutionTask) => void;
  // Pointer handlers the list puts on the grip to run its own drag (no
  // native HTML5 drag — see ExecutionTaskList), and whether this row is
  // the one being dragged right now.
  dragHandleProps?: React.HTMLAttributes<HTMLSpanElement>;
  isDragging?: boolean;
}

// mm:ss — the session clock runs in real time, so seconds are what move.
const formatClock = (totalSeconds: number) => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

// Break clock: counts toward the preference's break length, then the
// overrun is shown negative so the wasted minutes are obvious.
function BreakBar({
  elapsedSeconds,
  breakMinutes,
  onStop,
}: {
  elapsedSeconds: number;
  breakMinutes: number;
  onStop?: () => void;
}) {
  const total = breakMinutes * 60;
  const over = Math.max(0, elapsedSeconds - total);
  const overrun = over > 0;

  return (
    <div
      onClick={(event) => event.stopPropagation()}
      className={cn(
        "flex items-center gap-2 rounded-xl border px-3 py-1.5",
        overrun
          ? "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30"
          : "border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30",
      )}
    >
      <Coffee
        size={14}
        className={cn("shrink-0", overrun ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400")}
      />
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-xs",
          overrun ? "text-red-800 dark:text-red-200" : "text-emerald-800 dark:text-emerald-200",
        )}
      >
        {overrun ? "انتهت الاستراحة — وقت ضائع:" : "استراحة"}
      </span>
      <span
        className={cn(
          "shrink-0 rounded-lg px-2 py-0.5 text-xs font-bold tabular-nums",
          overrun
            ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300"
            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
        )}
      >
        {overrun ? `-${formatClock(over)}` : `${formatClock(elapsedSeconds)} / ${formatClock(total)}`}
      </span>
      <button
        type="button"
        onClick={onStop}
        className={cn(
          "flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-white",
          overrun ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700",
        )}
      >
        <Check size={12} />
        إنهاء الاستراحة
      </button>
    </div>
  );
}

const sessionInputClass =
  "mt-1 w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-900 outline-none focus:border-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";

export const ExecutionTaskRow = ({
  task,
  sessions,
  breakMinutes,
  onToggleComplete,
  onAddSession,
  onAddCompletedSession,
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
  dragHandleProps,
  isDragging = false,
}: ExecutionTaskRowProps) => {
  const [noteEditing, setNoteEditing] = useState(false);
  const [noteDraft, setNoteDraft] = useState(task.notes ?? "");
  const [menuOpen, setMenuOpen] = useState(false);
  // The options menu folds away 1.5s after the cursor leaves it (coming
  // back in time cancels that), and right after any of its actions.
  const menuCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelMenuClose = () => {
    if (menuCloseTimer.current) clearTimeout(menuCloseTimer.current);
    menuCloseTimer.current = null;
  };
  const scheduleMenuClose = () => {
    cancelMenuClose();
    menuCloseTimer.current = setTimeout(() => setMenuOpen(false), 1500);
  };
  useEffect(() => cancelMenuClose, []);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [durationDraft, setDurationDraft] = useState("");
  const [notesDraft, setNotesDraft] = useState("");
  // Backend priority 1/2/3 = focus slot; 1 is the most urgent and shows the
  // most stars. Anything else is an extra task with no stars.
  const stars = task.priority && task.priority >= 1 && task.priority <= 3 ? 4 - task.priority : 0;
  // What the task will take: the sum of its sessions once it has any (they
  // are what actually gets scheduled), otherwise the estimate it was
  // created with.
  const totalMinutes =
    sessions.length > 0
      ? sessions.reduce((sum, session) => sum + session.sessionDurationMinutes, 0)
      : task.estimatedMinutes;

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

  // Title + duration are committed explicitly (the save button), unlike
  // the notes, which save themselves when the editor loses focus.
  const detailsChanged = (session: ExecutionSession) =>
    titleDraft.trim() !== session.title || Number(durationDraft) !== session.sessionDurationMinutes;

  const revertDetails = (session: ExecutionSession) => {
    setTitleDraft(session.title);
    setDurationDraft(String(session.sessionDurationMinutes));
  };

  const saveDetails = (session: ExecutionSession) => {
    if (!detailsChanged(session)) return;
    const title = titleDraft.trim();
    const durationMinutes = Number(durationDraft);
    if (!title || !Number.isFinite(durationMinutes) || durationMinutes < 1) {
      revertDetails(session);
      return;
    }
    onUpdateSession?.(session.id, {
      ...(title !== session.title ? { title } : {}),
      ...(durationMinutes !== session.sessionDurationMinutes ? { durationMinutes } : {}),
    });
  };

  // The break is offered once, after the most recently completed session
  // (the one the student just finished) — not after every finished one.
  const lastCompletedId = [...sessions].reverse().find((s) => s.status === "completed")?.id;
  const offersBreak = (session: ExecutionSession) =>
    breakMinutes != null &&
    breakMinutes > 0 &&
    (session.id === lastCompletedId || breakTimer?.afterSessionId === session.id);

  return (
    <div
      className={cn(
        "grid grid-cols-1 overflow-hidden bg-transparent p-0 lg:grid-cols-[1.1fr_0.9fr]",
        isDragging && "cursor-grabbing",
      )}
    >
      <div className="flex min-w-0 flex-col gap-3 rounded-lg bg-white p-5 dark:bg-zinc-900">
      <div className="flex items-center gap-3">
        {/* The only place a drag starts — a fixed-size grip at the card's
            edge, Jira-style — so text fields and buttons elsewhere on the
            card never fight the drag. */}
        {dragHandleProps && (
          <span
            {...dragHandleProps}
            title="اسحب لإعادة الترتيب"
            aria-label="اسحب لإعادة ترتيب المهمة"
            style={{ touchAction: "none" }}
            className={cn(
              "flex size-8 shrink-0 select-none items-center justify-center rounded-md text-zinc-300 transition hover:bg-zinc-100 hover:text-zinc-500 dark:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300",
              isDragging ? "cursor-grabbing" : "cursor-grab",
            )}
          >
            <GripVertical size={18} className="pointer-events-none" />
          </span>
        )}
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
            {formatMinutes(totalMinutes)}
            {task.kind === "revision" && task.repetitionNumber != null
              ? ` · التكرار #${task.repetitionNumber}`
              : ""}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <div className="relative" onMouseEnter={cancelMenuClose} onMouseLeave={() => menuOpen && scheduleMenuClose()}>
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
          {/* {sessions.length > 0 && breakMinutes != null && breakMinutes > 0 && (
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
              <Coffee size={13} className="shrink-0 text-amber-500" />
              استراحة بين الجلسات: {breakMinutes} دقيقة
            </div>
          )} */}
          {sessions.map((session, index) => {
            const expanded = expandedSessionId === session.id;
            const elapsedSeconds = session.elapsedSeconds ?? session.actualMinutes * 60;

            return (
              <div key={session.id} className="flex flex-col gap-2">
              {/* Break marker between one session and the next, from
                  pomodoroBreakMinutes in the user's preferences. Only after
                  the last completed session (or one whose break is already
                  running) — there's nothing to rest from before that. */}
              {index > 0 && offersBreak(sessions[index - 1]) && (
                <div className="flex items-center gap-2 px-1 text-[11px] text-amber-700 dark:text-amber-300">
                  <span className="h-px flex-1 bg-amber-200 dark:bg-amber-900/60" />
                  <Coffee size={12} className="shrink-0" />
                  <span className="shrink-0">استراحة {breakMinutes} دقيقة</span>
                  {breakTimer?.afterSessionId !== sessions[index - 1].id && (
                    <button
                      type="button"
                      onClick={() => onStartBreak?.(sessions[index - 1].id)}
                      className="shrink-0 rounded-md border border-amber-300 px-1.5 py-0.5 text-[10px] font-semibold hover:bg-amber-100 dark:border-amber-800 dark:hover:bg-amber-950/40"
                    >
                      ابدأ الاستراحة
                    </button>
                  )}
                  <span className="h-px flex-1 bg-amber-200 dark:bg-amber-900/60" />
                </div>
              )}
              <div
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
                    <span className="flex shrink-0 items-center gap-1.5">
                      <span
                        title={session.manuallyCompleted ? "جلسة سُجّلت يدويًا بعد إتمامها" : undefined}
                        className={cn(
                          "text-xs font-semibold",
                          session.manuallyCompleted
                            ? "rounded-md bg-emerald-50 px-1.5 py-0.5 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : "text-emerald-600 dark:text-emerald-400",
                        )}
                      >
                        {session.manuallyCompleted ? "مكتمل (يدويًا)" : "مكتمل"}
                      </span>
                      {/* The break after this session is on the record. */}
                      {session.breakCompleted && (
                        <span
                          title="تم تسجيل الاستراحة بعد هذه الجلسة"
                          className="flex size-5 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                        >
                          <Coffee size={11} />
                        </span>
                      )}
                      {/* Manual break after this session (covers the last one,
                          which has no divider below it). */}
                      {offersBreak(session) && !session.overtimeRunning &&
                        breakTimer?.afterSessionId !== session.id && (
                          <button
                            type="button"
                            title="بدء استراحة بعد هذه الجلسة"
                            onClick={(event) => {
                              event.stopPropagation();
                              onStartBreak?.(session.id);
                            }}
                            className="flex size-6 items-center justify-center rounded-full text-amber-500 transition hover:bg-amber-50 dark:hover:bg-amber-950/40"
                          >
                            <Coffee size={13} />
                          </button>
                        )}
                    </span>
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

                  {/* Which session of the task this is — they're listed in
                      orderInPlan order, so the position is the number. */}
                  <span
                    aria-hidden
                    className="flex size-5 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-[10px] font-bold tabular-nums text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                  >
                    {index + 1}
                  </span>

                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-zinc-700 dark:text-zinc-200">
                    <span className="sr-only">{`الجلسة ${index + 1}: `}</span>
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
                      انتهى وقت الجلسة — ما زلت تعمل؟ :
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
                        {/* إضافةإلى وقت الجلسة */}
                    </button>
                    {breakMinutes != null && breakMinutes > 0 && (
                      <button
                        type="button"
                        onClick={() => onSpendOvertimeAsBreak?.(session.id)}
                        title="احتساب الوقت الإضافي كاستراحة"
                        className="flex shrink-0 items-center gap-1 rounded-md border border-amber-400 px-2 py-1 text-[11px] font-semibold text-amber-800 hover:bg-amber-100 dark:text-amber-200 dark:hover:bg-amber-950/40"
                      >
                        <Coffee size={12} />
                        استراحة
                        {/* إضافةإلى وقت الاستراحة */}
                      </button>
                    )}
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
                    {/* Title and duration are saved together with the
                        button that appears once either changed (Enter also
                        saves, Escape reverts). Notes save on their own. */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <label className="flex-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                      عنوان الجلسة
                      <input
                        value={titleDraft}
                        onChange={(event) => setTitleDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") saveDetails(session);
                          if (event.key === "Escape") revertDetails(session);
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
                        onKeyDown={(event) => {
                          if (event.key === "Enter") saveDetails(session);
                          if (event.key === "Escape") revertDetails(session);
                        }}
                        className={sessionInputClass}
                      />
                    </label>

                    {detailsChanged(session) && (
                      <div className="flex gap-1.5 sm:pb-0.5">
                        <button
                          type="button"
                          onClick={() => revertDetails(session)}
                          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                          إلغاء
                        </button>
                        <button
                          type="button"
                          onClick={() => saveDetails(session)}
                          className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                        >
                          <Save size={13} />
                          حفظ
                        </button>
                      </div>
                    )}
                    </div>

                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      ملاحظات الجلسة
                      <RichTextEditor
                        value={notesDraft}
                        onChange={setNotesDraft}
                        onBlur={() => onUpdateSession?.(session.id, { notes: notesDraft })}
                        onEscape={() => setNotesDraft(session.notes ?? "")}
                        placeholder="أضف ملاحظة عن هذه الجلسة..."
                        className="mt-1"
                        minHeightClass="min-h-14"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* The break that follows this session, once started. */}
              {breakTimer?.afterSessionId === session.id && breakMinutes != null && breakMinutes > 0 && (
                <BreakBar
                  elapsedSeconds={breakTimer.elapsedSeconds}
                  breakMinutes={breakMinutes}
                  onStop={onStopBreak}
                />
              )}
              </div>
            );
          })}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onAddSession?.(task)}
              className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              + إضافة جلسة
            </button>
            {/* For work already done — no timer to sit through. */}
            <button
              type="button"
              title="سجّل وقتًا ذاكرته خارج التطبيق"
              onClick={() => onAddCompletedSession?.(task)}
              className="flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400"
            >
              <CheckCircle2 size={13} />
              إضافة جلسة منتهية
            </button>
          </div>
        </div>
      )}
      </div>

      <div className="flex my-3 min-h-30 flex-col rounded-2xl bg-zinc-50 p-5 dark:bg-zinc-800">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">الملاحظات </h3>
        </div>

        {noteEditing ? (
          <div className="flex flex-col gap-3">
            <RichTextEditor
              value={noteDraft}
              onChange={setNoteDraft}
              placeholder="أضف ملاحظة..."
              autoFocus
              minHeightClass="min-h-22"
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
                  onNotesChange(task.id, isRichTextEmpty(noteDraft) ? "" : noteDraft);
                  setNoteEditing(false);
                }}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
              >

                حفظ
              </button>
            </div>
          </div>
        ) : !isRichTextEmpty(task.notes) ? (
          <div
            role="button"
            tabIndex={0}
            onClick={() => setNoteEditing(true)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setNoteEditing(true);
              }
            }}
            className="flex flex-1 cursor-text flex-col rounded-lg bg-zinc-50 p-3 text-right text-sm text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
          >
            <RichTextContent value={task.notes ?? ""} />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setNoteDraft("");
              setNoteEditing(true);
            }}
            className="flex flex-1 items-center justify-center px-3 py-8 text-sm text-zinc-400 transition hover:text-blue-600 dark:hover:text-blue-400"
          >
            لا يوجد ملاحظات أضف ملاحظة<span className="text-xl mr-1">+</span>
          </button>
        )}
      </div>
    </div>
  );
};
