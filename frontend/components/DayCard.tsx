// components/planner/DayCard.tsx
import { CheckSquare, Plus, Square, Star } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { useState } from "react";

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
interface DayCardProps {
  index: number;
  dayName: string;
  date: string;

  completedTasks: number;
  totalTasks: number;

  workingHours: number;
  focusSessions: number;

  mood:"مذهل" | "ممتاز" | "جيد" | "متوسط";
  tasks: Task[];
  isFuture?: boolean;
  onTaskComplete?: (taskId: string, completed: boolean) => Promise<void>;

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
  tasks,
  isFuture = false,
  onTaskComplete,
  onClick,
  onAddTask,
}: DayCardProps) {
  const [open, setOpen] = useState(false);
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
  const visibleTasks = taskList?.slice(0, 4) ?? [];
  const remainingTasks = Math.max(taskList?.length - 4, 0);

  return (
    <div
      onClick={onClick}
      dir="rtl"
      className={cn(
        "flex flex-col overflow-hidden h-full cursor-pointer bg-white transition-all duration-200 hover:shadow-lg dark:bg-zinc-900",
        index !== 7 && "border-l border-zinc-200 dark:border-zinc-800",
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
        {/* Performance is only meaningful after the day has started. */}
        {!isFuture && <section>
          <h4 className="mb-3 text-lg font-semibold text-right text-zinc-900 dark:text-zinc-100">الأداء</h4>

          <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <div className="flex justify-between">
              <span>ساعات العمل</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">{workingHours}</span>
            </div>

            <div className="flex justify-between">
              <span>جلسات التركيز</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">{focusSessions}</span>
            </div>

            <div className="flex items-center justify-between">
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
            </div>
          </div>
        </section>}

        {/* Tasks */}
        <section className="mt-8">
          <h4 className="mb-3 text-base font-semibold text-right text-zinc-900 dark:text-zinc-100">المهام</h4>

          <div className="space-y-2">
            {visibleTasks.map((task) => (
              <div key={task.id} className="flex items-start gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    void toggleTask(task.id);
                  }}
                >
                  {task.completed ? (
                    <CheckSquare size={20} className="text-blue-600 dark:text-blue-400 mt-1" />
                  ) : (
                    <Square size={20} className="text-zinc-400 dark:text-zinc-600 mt-1" />
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
                    className="mt-1.5 flex shrink-0 gap-px"
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
            ))}
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
