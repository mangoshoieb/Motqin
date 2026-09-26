"use client";

import { useEffect, useRef, useState } from "react";
import { BreakTimer, ExecutionSession, ExecutionTask } from "@/app/types/execution-board.types";
import { cn } from "@/app/lib/utils";
import { ExecutionTaskRow } from "./ExecutionTaskRow";

// A drag in progress: which card, where the pointer started, how far it has
// moved, and which card it's over (the drop target).
interface DragState {
  id: string;
  pointerId: number;
  startY: number;
  dy: number;
  targetId: string | null;
}

interface ExecutionTaskListProps {
  title: string;
  tasks: ExecutionTask[];
  sessionsByTaskId: Map<string, ExecutionSession[]>;
  breakMinutes?: number; // pomodoroBreakMinutes from the user's preferences
  onToggleComplete: (id: string) => void;
  onAddSession?: (task: ExecutionTask) => void;
  // Logs study done outside the app (status ManuallyCompleted).
  onAddCompletedSession?: (task: ExecutionTask) => void;
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
  onDropTask,
}: ExecutionTaskListProps) => {
  // Reordering is done with pointer events rather than native HTML5 drag
  // and drop: the browser's drag machinery proved to get stuck on this page
  // (frozen cursor, no drop), and pointer events never hand control away.
  // The pressed card follows the pointer; the card under it shows a line
  // where the drop will land; releasing calls onDropTask like before.
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const rowRefs = useRef(new Map<string, HTMLDivElement>());

  const targetAt = (clientY: number, draggedId: string) => {
    let best: { id: string; distance: number } | null = null;
    for (const [id, element] of rowRefs.current) {
      if (id === draggedId) continue;
      const box = element.getBoundingClientRect();
      const distance = Math.abs(clientY - (box.top + box.height / 2));
      if (!best || distance < best.distance) best = { id, distance };
    }
    return best?.id ?? null;
  };

  const startDrag = (id: string) => (event: React.PointerEvent<HTMLSpanElement>) => {
    if (event.button !== 0 || !onDropTask) return;
    event.preventDefault();
    const next: DragState = { id, pointerId: event.pointerId, startY: event.clientY, dy: 0, targetId: null };
    dragRef.current = next;
    setDrag(next);
  };

  useEffect(() => {
    if (!drag) return;

    const move = (event: PointerEvent) => {
      const current = dragRef.current;
      if (!current || event.pointerId !== current.pointerId) return;
      const dy = event.clientY - current.startY;
      const next = { ...current, dy, targetId: targetAt(event.clientY, current.id) };
      dragRef.current = next;
      setDrag(next);
    };
    const finish = (event: PointerEvent) => {
      const current = dragRef.current;
      if (!current || event.pointerId !== current.pointerId) return;
      dragRef.current = null;
      setDrag(null);
      if (event.type === "pointerup" && current.targetId && current.targetId !== current.id) {
        onDropTask?.(current.id, current.targetId);
      }
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
    // No text selection while a card is being dragged around.
    document.body.classList.add("select-none");
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
      document.body.classList.remove("select-none");
    };
    // Only the drag's identity matters here; its position updates through the ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag?.id]);

  const draggedIndex = drag ? tasks.findIndex((task) => task.id === drag.id) : -1;
  const targetIndex = drag?.targetId ? tasks.findIndex((task) => task.id === drag.targetId) : -1;
  // Moving down drops the card after the target; moving up, before it —
  // the same rule reorderTasks applies.
  const insertionSide = targetIndex > draggedIndex ? "below" : "above";

  return (
    <section className="flex flex-col gap-3">
      {title && <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{title}</h2>}

      {tasks.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">لا توجد مهام هنا لهذا اليوم</p>
      ) : (
        <div className="flex flex-col gap-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              ref={(element) => {
                if (element) rowRefs.current.set(task.id, element);
                else rowRefs.current.delete(task.id);
              }}
              style={drag?.id === task.id ? { transform: `translateY(${drag.dy}px)` } : undefined}
              className={cn(
                "relative rounded-lg",
                drag?.id === task.id && "z-20 shadow-2xl shadow-blue-500/20 ring-2 ring-blue-400 transition-none",
                drag && drag.id !== task.id && "transition-shadow",
                drag?.targetId === task.id &&
                  (insertionSide === "above"
                    ? "before:absolute before:-top-2 before:inset-x-0 before:h-1 before:rounded-full before:bg-blue-500"
                    : "after:absolute after:-bottom-2 after:inset-x-0 after:h-1 after:rounded-full after:bg-blue-500"),
              )}
            >
            <ExecutionTaskRow
              task={task}
              sessions={sessionsByTaskId.get(task.id) ?? []}
              breakMinutes={breakMinutes}
              onToggleComplete={onToggleComplete}
              onAddSession={onAddSession}
              onAddCompletedSession={onAddCompletedSession}
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
              dragHandleProps={onDropTask ? { onPointerDown: startDrag(task.id) } : undefined}
              isDragging={drag?.id === task.id}
            />
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
