// components/planner/DayCard.tsx
import { CheckSquare, Square } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { useState } from "react";

export interface Task {
  id: string;
  title: string;
  completed: boolean;
}
const moodOptions = [
  {
    value: "مذهل",
    color: "bg-purple-500",
  },
  {
    value: "ممتاز",
    color: "bg-green-500",
  },
  {
    value: "جيد",
    color: "bg-blue-500",
  },
  {
    value: "متوسط",
    color: "bg-orange-500",
  },
];
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

  onClick?: () => void;
}

export default function DayCard({
  index,
  dayName,
  date,
  completedTasks,
  totalTasks,
  workingHours,
  focusSessions,
  mood,
  tasks,
  onClick,
}: DayCardProps) {
  const [open, setOpen] = useState(false);
  const [selectedMood, setSelectedMood] = useState(moodOptions[1]);

  const [taskList, setTaskList] = useState(tasks);
  completedTasks = taskList.filter((task) => task.completed).length;

  totalTasks = taskList.length;
  const progress =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const toggleTask = (taskId: string) => {
    setTaskList((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
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
              className="h-full rounded-full bg-blue-600 dark:bg-blue-500 transition-all"
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
        {/* Performance */}
        <section>
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
                    "rounded-full px-3 py-1 text-xs text-white",
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
                              "inline-block rounded-full px-3 py-1 text-xs text-white",
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
        </section>

        {/* Tasks */}
        <section className="mt-8">
          <h4 className="mb-3 text-base font-semibold text-right text-zinc-900 dark:text-zinc-100">المهام</h4>

          <div className="space-y-2">
            {visibleTasks.map((task) => (
              <div key={task.id} className="flex items-start gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTask(task.id);
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
                    "text-sm flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-right text-zinc-700 dark:text-zinc-300",
                    task.completed && "text-zinc-400 dark:text-zinc-600 line-through opacity-60"
                  )}
                >
                  {task.title}
                </span>
              </div>
            ))}
          </div>

          {remainingTasks > 0 && (
            <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-500">
              + {remainingTasks} more tasks
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
