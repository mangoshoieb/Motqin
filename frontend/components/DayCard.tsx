// components/planner/DayCard.tsx
import { CheckSquare, Plus, Square, Star } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/app/lib/utils";
import { HoursStatus, hoursStatusFor } from "@/app/lib/study-plan";
import { useEffect, useRef, useState } from "react";

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priorityValue?: number; // backend priority slot, see planner.types
}

// Light tints so the rating reads as a label, not a call to action.
const moodOptions = [
  {
    value: "مذهل",
    color: "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300",
  },
  {
    value: "ممتاز",
    color: "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300",
  },
  {
    value: "جيد",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  },
  {
    value: "متوسط",
    color: "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300",
  },
];

// 1 → ★★★, 2 → ★★, 3 → ★, anything else → no stars.
const starsFor = (priorityValue?: number) =>
  priorityValue && priorityValue >= 1 && priorityValue <= 3 ? 4 - priorityValue : 0;

// The hours badge: a translucent circle whose tint says how the day's
// studied hours compare with the user's daily window.
const hoursBadge: Record<HoursStatus, { className: string; title: string }> = {
  future: {
    className: "bg-zinc-400/15 text-zinc-500 shadow-zinc-400/30 dark:text-zinc-400",
    title: "لم يبدأ هذا اليوم بعد",
  },
  unknown: {
    className: "bg-zinc-400/15 text-zinc-600 shadow-zinc-400/30 dark:text-zinc-300",
    title: "حدد ساعات الدراسة اليومية في تفضيلات المخطط",
  },
  below: {
    className: "bg-red-500/15 text-red-600 shadow-red-500/30 dark:text-red-400",
    title: "أقل من الحد الأدنى لساعات الدراسة",
  },
  within: {
    className: "bg-emerald-500/15 text-emerald-600 shadow-emerald-500/30 dark:text-emerald-400",
    title: "ضمن ساعات الدراسة اليومية",
  },
  above: {
    className: "bg-blue-500/15 text-blue-600 shadow-blue-500/30 dark:text-blue-400",
    title: "أكثر من الحد الأقصى لساعات الدراسة",
  },
};

// Height of one task row — the gap that opens for a dragged task.
const TASK_ROW_HEIGHT = 36;

interface DayCardProps {
  index: number;
  dayName: string;
  date: string;

  completedTasks: number;
  totalTasks: number;

  // Hours of completed focus sessions this day.
  workingHours: number;
  focusSessions: number;
  // The user's daily study window (planner preferences); null until known.
  hourLimits?: { min: number; max: number } | null;

  mood:"مذهل" | "ممتاز" | "جيد" | "متوسط";
  tasks: Task[];
  isFuture?: boolean;
  // Past days can't receive tasks (the backend rejects it), so they're not
  // drop targets.
  isPast?: boolean;
  onTaskComplete?: (taskId: string, completed: boolean) => Promise<void>;
  // A task was dropped on this day at the gap the card was showing: insert
  // it before `beforeTaskId`, or last when that's undefined. Works for a
  // task from another day and for reordering within this one.
  onTaskDrop?: (taskId: string, beforeTaskId?: string) => void;

  onClick?: () => void;
  // Shown only for today and future days — the backend rejects tasks on
  // past dates anyway. Pinned to the card's bottom edge.
  onAddTask?: () => void;
}

export default function DayCard({
  index,
  dayName,
  date,
  completedTasks,
  totalTasks,
  workingHours,
  focusSessions,
  hourLimits,
  tasks,
  isFuture = false,
  isPast = false,
  onTaskComplete,
  onTaskDrop,
  onClick,
  onAddTask,
}: DayCardProps) {
  const [open, setOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const canDrop = Boolean(onTaskDrop) && !isPast;

  // Sortable-style drag feedback. `draggingId` is the row picked up from
  // THIS card (it leaves the list while in the air); `dropIndex` is where
  // in the remaining rows a dragged task — from here or another day —
  // would land, shown as a gap the other rows slide away from.
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const rowRefs = useRef(new Map<string, HTMLDivElement>());

  // A drag that ends anywhere (dropped elsewhere, cancelled with Escape)
  // must close this card's gap and bring its picked-up row back — the
  // row's own dragend/dragleave aren't guaranteed to fire then.
  useEffect(() => {
    const reset = () => {
      setDraggingId(null);
      setDropIndex(null);
      setDragOver(false);
    };
    window.addEventListener("dragend", reset);
    window.addEventListener("drop", reset);
    return () => {
      window.removeEventListener("dragend", reset);
      window.removeEventListener("drop", reset);
    };
  }, []);

  const hoursStatus = hoursStatusFor(workingHours, hourLimits, isFuture);
  const [selectedMood, setSelectedMood] = useState(moodOptions[1]);

  const [taskList, setTaskList] = useState(tasks);
  const [initializedTasks, setInitializedTasks] = useState(tasks);
  if (tasks !== initializedTasks) {
    setInitializedTasks(tasks);
    setTaskList(tasks);
  }

  completedTasks = taskList.filter((task) => task.completed).length;

  totalTasks = taskList.length;
  const progress =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const toggleTask = async (taskId: string) => {
    const task = taskList.find((item) => item.id === taskId);
    if (!task) return;
    const completed = !task.completed;

    setTaskList((prev) => prev.map((item) =>
      item.id === taskId ? { ...item, completed } : item,
    ));

    try {
      await onTaskComplete?.(taskId, completed);
    } catch {
      setTaskList((prev) => prev.map((item) =>
        item.id === taskId ? { ...item, completed: task.completed } : item,
      ));
    }
  };
  // The rows that count: the list minus the one being dragged from here,
  // capped at four. The gap (dropIndex) indexes into `remaining`, so a drop
  // past the visible rows still lands before the first hidden one.
  const remaining = taskList.filter((task) => task.id !== draggingId);
  const visibleTasks = remaining.slice(0, 4);
  const remainingTasks = Math.max(remaining.length - 4, 0);
  // What's actually rendered: those rows plus the picked-up one, kept in
  // the DOM but collapsed. It must stay mounted — a dragged element that
  // gets removed never receives dragend, and the row would stay hidden.
  const renderedTasks = taskList.filter(
    (task) => task.id === draggingId || visibleTasks.includes(task),
  );

  // Where a task at this pointer height would slot in: before the first
  // visible row whose middle is below the pointer, else after them all.
  const dropIndexAt = (clientY: number) => {
    const index = visibleTasks.findIndex((task) => {
      const row = rowRefs.current.get(task.id);
      if (!row) return false;
      const box = row.getBoundingClientRect();
      return clientY < box.top + box.height / 2;
    });
    return index < 0 ? visibleTasks.length : index;
  };

  // The gap the dragged task will drop into — sized like a row, so the
  // rows around it slide exactly one slot.
  const dropGap = (
    <motion.div
      key="drop-gap"
      layout
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: TASK_ROW_HEIGHT, opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 40 }}
      className="pointer-events-none mb-2 rounded-lg border-2 border-dashed border-blue-400 bg-blue-50/70 dark:border-blue-500 dark:bg-blue-950/40"
      aria-hidden
    />
  );

  return (
    <div
      onClick={onClick}
      onDragOver={(e) => {
        if (!canDrop || !e.dataTransfer.types.includes("text/task-id")) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDragOver(true);
        const next = dropIndexAt(e.clientY);
        setDropIndex((current) => (current === next ? current : next));
      }}
      onDragLeave={(e) => {
        // Moving between this card's own children also fires dragleave.
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
        setDragOver(false);
        setDropIndex(null);
      }}
      onDrop={(e) => {
        const at = dropIndex;
        setDragOver(false);
        setDropIndex(null);
        if (!canDrop) return;
        const taskId = e.dataTransfer.getData("text/task-id");
        if (!taskId) return;
        e.preventDefault();
        const index = at ?? dropIndexAt(e.clientY);
        onTaskDrop?.(taskId, remaining[index]?.id);
      }}
      dir="rtl"
      className={cn(
        "flex flex-col overflow-hidden h-full cursor-pointer bg-white transition-all duration-200 hover:shadow-lg dark:bg-zinc-900",
        index !== 7 && "border-l border-zinc-200 dark:border-zinc-800",
        dragOver && "bg-blue-50 ring-2 ring-inset ring-blue-400 dark:bg-blue-950/30",
      )}
    >
      {/* Header */}
      <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 bg-blue-600/20">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{dayName}</h3>

          <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">{date}</span>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-blue-600/50  transition-all"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
            {completedTasks}/{totalTasks}
          </span>
        </div>
      </div>

      {/* Body */}
      <div
        className="flex flex-1 flex-col p-3 bg-white dark:bg-zinc-900"
        dir="rtl"
      >
        {/* Performance: hours studied vs the daily window, sessions done.
            Future days show it greyed out. */}
        <section>
          <h4 className="mb-3 text-lg font-semibold text-right text-zinc-900 dark:text-zinc-100">الأداء</h4>

          <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center justify-between">
              <span>ساعات الأنجاز</span>
              <span
                title={hoursBadge[hoursStatus].title}
                className={cn(
                  "flex size-6 items-center justify-center rounded-full font-bold tabular-nums transition-colors",
                  hoursBadge[hoursStatus].className,
                )}
              >
                {isFuture ? "—" : workingHours}
              </span>
            </div>

            <div className="flex justify-between">
              <span>جلسات التركيز</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100 ml-2">{focusSessions}</span>
            </div>

            {/* <div className="flex items-center justify-between">
              <span>تقييم اليوم</span>

              <div className="relative">  
                <button
                  type="button" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen(!open);
                  }}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold",
                    selectedMood.color
                  )}
                >
                  {selectedMood.value}
                </button>

                {open && (
                  <div className="top-full left-0 mt-2 w-32 border border-zinc-200 rounded-lg bg-white shadow-lg z-50 p-2 absolute dark:border-zinc-700 dark:bg-zinc-800">
                    <div className="space-y-2">
                      {moodOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMood(option);
                            setOpen(false);
                          }}
                          className="w-full text-right"
                        >
                          <span
                            className={cn(
                              "inline-block rounded-full px-3 py-1 text-xs font-semibold",
                              option.color
                            )}
                          >
                            {option.value}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div> */}
          </div>
        </section>

        {/* Tasks */}
        <section className="mt-8">
          <h4 className="mb-3 text-base font-semibold text-right text-zinc-900 dark:text-zinc-100">المهام</h4>

          {/* Rows animate to their new place whenever the gap moves or a
              row leaves, so the list visibly makes room for the dragged
              task instead of just highlighting a target. */}
          <div className="flex flex-col">
            <AnimatePresence initial={false}>
              {renderedTasks.flatMap((task) => {
                const lifted = task.id === draggingId;
                const position = visibleTasks.indexOf(task);
                const row = (
                  <motion.div
                    key={task.id}
                    layout
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                    initial={{ opacity: 0, scale: 0.96, height: "auto", marginBottom: 8 }}
                    animate={
                      lifted
                        ? { opacity: 0, scale: 0.96, height: 0, marginBottom: 0 }
                        : { opacity: 1, scale: 1, height: "auto", marginBottom: 8 }
                    }
                    exit={{ opacity: 0, scale: 0.96, height: 0, marginBottom: 0 }}
                    style={{ overflow: lifted ? "hidden" : undefined }}
                    ref={(element) => {
                      if (element) rowRefs.current.set(task.id, element);
                      else rowRefs.current.delete(task.id);
                    }}
                  >
                    {/* Native HTML5 drag lives on a plain div: motion.div
                        reserves onDragStart/onDragEnd for its own gestures. */}
                    <div
                      draggable
                      onDragStart={(e) => {
                        e.stopPropagation();
                        e.dataTransfer.setData("text/task-id", task.id);
                        e.dataTransfer.setData("text/task-date", date);
                        e.dataTransfer.effectAllowed = "move";
                        // Let the browser snapshot the drag image before the
                        // row leaves the list.
                        setTimeout(() => setDraggingId(task.id), 0);
                      }}
                      onDragEnd={() => setDraggingId(null)}
                      className={cn(
                        "flex cursor-grab items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 shadow-sm transition-[border-color,box-shadow] hover:border-zinc-300 hover:shadow-md active:cursor-grabbing dark:border-zinc-700 dark:bg-zinc-800/60 dark:hover:border-zinc-600",
                        task.completed && "bg-zinc-50 shadow-none dark:bg-zinc-900",
                      )}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void toggleTask(task.id);
                        }}
                      >
                        {task.completed ? (
                          <CheckSquare size={20} className="text-blue-600 dark:text-blue-400" />
                        ) : (
                          <Square size={20} className="text-zinc-400 dark:text-zinc-600" />
                        )}
                      </button>

                      <span
                        title={task.title}
                        className={cn(
                          "text-sm flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-right text-zinc-700 dark:text-zinc-300",
                          task.completed && "text-zinc-400 dark:text-zinc-600 line-through opacity-60"
                        )}
                      >
                        {task.title}
                      </span>

                      {starsFor(task.priorityValue) > 0 && (
                        <span
                          className="flex shrink-0 gap-px"
                          title={`الأولوية ${task.priorityValue}`}
                          aria-label={`الأولوية ${starsFor(task.priorityValue)} من 3`}
                        >
                          {[1, 2, 3].map((star) => (
                            <Star
                              key={star}
                              size={11}
                              fill={star <= starsFor(task.priorityValue) ? "currentColor" : "none"}
                              className={
                                star <= starsFor(task.priorityValue)
                                  ? "text-amber-400"
                                  : "text-zinc-300 dark:text-zinc-700"
                              }
                            />
                          ))}
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
                return !lifted && dropIndex === position ? [dropGap, row] : [row];
              })}
              {dropIndex !== null && dropIndex >= visibleTasks.length && dropGap}
            </AnimatePresence>
          </div>
          {remainingTasks > 0 && (
            <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-500">
              + {remainingTasks} مهام أخرى
            </p>
          )}

        </section>

        {onAddTask && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddTask();
            }}
            className="mt-auto flex items-center justify-center gap-1 self-center rounded-md border border-dashed border-blue-300 px-5 py-1 text-[11px] font-semibold text-blue-700 transition hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950/40"
          >
            <Plus size={12} />
            إضافة مهمة
          </button>
        )}
      </div>
    </div>
  );
}
