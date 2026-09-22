"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { BoardDrag, DropResolution } from "@/components/DayCard";

export interface BoardDragState extends BoardDrag {
  title: string;
  priorityValue?: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  beforeTaskId?: string;
}

interface DraggableTask {
  id: string;
  title: string;
  priorityValue?: number;
}

interface UseBoardDragOptions {
  // The tasks that can be picked up (looked up by id on pointerdown).
  tasks: DraggableTask[];
  // Called on release over a column: the day index (1..7) the task was
  // dropped on, and the task it lands before (undefined = last).
  onDrop: (taskId: string, dayIndex: number, beforeTaskId?: string) => void;
}

// How far the pointer must travel before a press becomes a drag; below
// that, releasing is a click (checkbox, opening the day) and nothing moves.
const DRAG_THRESHOLD_PX = 6;

/**
 * Drag and drop for the week board, with pointer events. Native HTML5
 * drag got stuck in the browser on this app (frozen cursor, no drop), so
 * the board runs its own: a press on a task row starts a pending drag;
 * moving past a few pixels lifts the task; the column under the pointer
 * (any element with `data-day-index`) is asked where the task would land
 * through the resolver each DayCard registers; releasing calls `onDrop`.
 */
export function useBoardDrag({ tasks, onDrop }: UseBoardDragOptions) {
  const [drag, setDrag] = useState<BoardDragState | null>(null);
  const dragRef = useRef<BoardDragState | null>(null);
  const resolversRef = useRef(new Map<number, (clientY: number) => DropResolution>());
  // A drag that moved must not count as a click on the day card under it.
  const suppressClickUntilRef = useRef(0);
  const onDropRef = useRef(onDrop);
  useEffect(() => {
    onDropRef.current = onDrop;
  }, [onDrop]);

  const registerDropResolver = useCallback(
    (dayIndex: number, resolve: ((clientY: number) => DropResolution) | null) => {
      if (resolve) resolversRef.current.set(dayIndex, resolve);
      else resolversRef.current.delete(dayIndex);
    },
    [],
  );

  const onTaskPointerDown = useCallback(
    (taskId: string, event: React.PointerEvent) => {
      if (event.button !== 0) return;
      const task = tasks.find((item) => item.id === taskId);
      if (!task) return;
      const next: BoardDragState = {
        taskId,
        title: task.title,
        priorityValue: task.priorityValue,
        active: false,
        targetDayIndex: null,
        dropIndex: null,
        startX: event.clientX,
        startY: event.clientY,
        x: event.clientX,
        y: event.clientY,
      };
      dragRef.current = next;
      setDrag(next);
    },
    [tasks],
  );

  const dragId = drag?.taskId ?? null;
  const dragActive = drag?.active ?? false;
  useEffect(() => {
    if (!dragId) return;

    const move = (event: PointerEvent) => {
      const current = dragRef.current;
      if (!current) return;
      const moved = Math.hypot(event.clientX - current.startX, event.clientY - current.startY);
      if (!current.active && moved < DRAG_THRESHOLD_PX) return;

      const column = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest<HTMLElement>("[data-day-index]");
      const targetDayIndex = column ? Number(column.dataset.dayIndex) : null;
      const resolution =
        targetDayIndex !== null ? resolversRef.current.get(targetDayIndex)?.(event.clientY) : undefined;

      const next: BoardDragState = {
        ...current,
        active: true,
        x: event.clientX,
        y: event.clientY,
        targetDayIndex: resolution ? targetDayIndex : null,
        dropIndex: resolution?.index ?? null,
        beforeTaskId: resolution?.beforeTaskId,
      };
      dragRef.current = next;
      setDrag(next);
    };

    const finish = (event: PointerEvent) => {
      const current = dragRef.current;
      if (!current) return;
      dragRef.current = null;
      setDrag(null);
      if (!current.active) return; // a plain click — let it through
      suppressClickUntilRef.current = Date.now() + 300;
      if (event.type === "pointerup" && current.targetDayIndex !== null) {
        onDropRef.current(current.taskId, current.targetDayIndex, current.beforeTaskId);
      }
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
    if (dragActive) document.body.classList.add("select-none");
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
      document.body.classList.remove("select-none");
    };
  }, [dragId, dragActive]);

  // For the day card's onClick: true right after a drag, when the click
  // that follows the release must be ignored.
  const shouldSuppressClick = useCallback(() => Date.now() < suppressClickUntilRef.current, []);

  return { drag, onTaskPointerDown, registerDropResolver, shouldSuppressClick };
}
