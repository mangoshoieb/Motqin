"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, ChevronLeft, ChevronRight, PencilRuler, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import DayCard from "@/components/DayCard";
import { weekData } from "@/app/data/days";
import { StudyPlanDuration, studyPlansService } from "@/app/services/motqin";
import {
  applyStudyPlansToDay,
  currentWeekDates,
  dateOnly,
  formatPlannerDate,
  nextFreePriority,
  priorityForPosition,
  sortByPriority,
} from "@/app/lib/study-plan";
import { cn } from "@/app/lib/utils";
import { PlannerViewSwitch } from "@/components/Planner/PlannerViewSwitch";
import AiPlanningSection from "@/components/Planner/AiPlanningSection";
import NextWeekBoard from "@/components/Planner/NextWeekBoard";
import { AddTaskDialog } from "@/components/ExecutionBoard/AddTaskDialog";
import { ExecutionTask } from "@/app/types/execution-board.types";
import { useWorkHourLimits } from "@/app/hooks/useUserPreferences";

type PlanningTab = "ai" | "manual";

const planningTabs: {
  value: PlanningTab;
  label: string;
  icon: typeof Sparkles;
}[] = [
  { value: "ai", label: "التخطيط بالذكاء الاصطناعي", icon: Sparkles },
  { value: "manual", label: "التخطيط اليدوي", icon: PencilRuler },
];

const Planner = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [planningTab, setPlanningTab] = useState<PlanningTab>(
    searchParams.get("tab") === "manual" ? "manual" : "ai",
  );
  // The day whose "إضافة مهمة" opened the dialog (null = closed).
  const [addTaskDate, setAddTaskDate] = useState<string | null>(null);

  // The top board shows the current week by default and can page back
  // through earlier weeks (weekOffset ≤ 0); next week lives in the
  // manual-planning tab below, so paging forward stops at 0.
  const [weekOffset, setWeekOffset] = useState(0);
  const isCurrentWeek = weekOffset === 0;
  const dates = currentWeekDates(weekOffset);
  const nextWeekDates = currentWeekDates(1);
  const todayDate = dateOnly(new Date());
  // Daily min/max study hours from the planner preferences — colours the
  // hours badge on each day card.
  const { limits: hourLimits } = useWorkHourLimits();
  const weekQueryKey = ["study-plans", "week", weekOffset, dates[0], dates[6]];
  const { data: studyPlans, isLoading, isFetching } = useQuery({
    queryKey: weekQueryKey,
    // GET /study-plan/filter: Duration=Week is "this week" server-side, so
    // any other week goes through CustomRange with the week's bounds.
    queryFn: () =>
      studyPlansService.filter({
        duration: isCurrentWeek ? StudyPlanDuration.Week : StudyPlanDuration.CustomRange,
        startDate: dates[0],
        endDate: dates[6],
      }),
    placeholderData: (previous) => previous,
  });

  const weekTitle = isCurrentWeek
    ? "الأسبوع الحالي"
    : weekOffset === -1
      ? "الأسبوع السابق"
      : weekOffset === -2
        ? "قبل أسبوعين"
        : `قبل ${-weekOffset} أسابيع`;

  const days = weekData.map((day, index) => {
    const date = dates[index];
    const items = studyPlans?.items.filter((item) => item.date === date) ?? [];
    return {
      ...applyStudyPlansToDay(
        { ...day, date, isToday: date === todayDate },
        items,
      ),
      isFuture: date > todayDate,
      isPast: date < todayDate,
    };
  });

  // Drag a task into a day (the same one or another). While dragging, the
  // card shows a gap where the task will land; on drop it is inserted right
  // there — before `beforeTaskId`, or last when that's undefined — and the
  // day is renumbered by position exactly like reordering on the execution
  // board: the first three rows are ★★★ / ★★ / ★, the rest lose their stars.
  // Everything goes through PUT /study-plan/{id} with { date, priority }.
  // The backend refuses past dates, and DayCard already blocks dropping there.
  const moveTask = async (
    taskId: string,
    targetDate: string,
    beforeTaskId?: string,
  ) => {
    const items = studyPlans?.items ?? [];
    const moved = items.find((item) => String(item.id) === taskId);
    if (!moved) return;

    // The day's order without the moved task, then the task slotted in.
    const ordered = sortByPriority(
      items.filter((item) => item.date === targetDate && item.id !== moved.id),
      (item) => item.priority,
    );
    const to = beforeTaskId
      ? ordered.findIndex((item) => String(item.id) === beforeTaskId)
      : -1;
    ordered.splice(to < 0 ? ordered.length : to, 0, moved);

    const priorities = new Map<number, number>();
    ordered.forEach((item, index) => {
      const priority = priorityForPosition(index);
      if (priority !== item.priority) priorities.set(item.id, priority);
    });

    const dateChanged = moved.date !== targetDate;
    if (!dateChanged && priorities.size === 0) return;

    // Show the new order right away; the refetch below confirms it (or
    // puts things back if the server disagreed).
    queryClient.setQueryData<typeof studyPlans>(
      weekQueryKey,
      (current) =>
        current && {
          ...current,
          items: current.items.map((item) => ({
            ...item,
            date: item.id === moved.id ? targetDate : item.date,
            priority: priorities.get(item.id) ?? item.priority,
          })),
        },
    );

    const updates = [...priorities].map(([id, priority]) =>
      studyPlansService.update(id, {
        priority,
        ...(id === moved.id && dateChanged ? { date: targetDate } : {}),
      }),
    );
    if (dateChanged && !priorities.has(moved.id)) {
      updates.push(studyPlansService.update(moved.id, { date: targetDate }));
    }

    try {
      await Promise.all(updates);
      if (dateChanged)
        toast.success(`تم نقل المهمة إلى ${formatPlannerDate(targetDate)}`);
    } catch {
      toast.error(
        dateChanged
          ? "تعذر نقل المهمة إلى هذا اليوم"
          : "تعذر حفظ ترتيب الأولويات",
      );
    } finally {
      await queryClient.invalidateQueries({ queryKey: ["study-plans"] });
      queryClient.invalidateQueries({ queryKey: ["execution-board"] });
    }
  };

  // A task added from the board takes the day's first free focus slot,
  // exactly as one added on the execution board does; the dialog has
  // already created it and refreshed the list.
  const onTaskAdded = (task: ExecutionTask) => {
    if (!addTaskDate) return;
    const dayItems =
      studyPlans?.items.filter((item) => item.date === addTaskDate) ?? [];
    const priority = nextFreePriority(dayItems.map((item) => item.priority));
    if (priority === 0) return;
    void studyPlansService
      .update(Number(task.id), { priority })
      .then(() => queryClient.invalidateQueries({ queryKey: ["study-plans"] }))
      .catch(() => toast.error("تعذر حفظ أولوية المهمة"));
  };

  // The checkbox is a toggle on the server too — DayCard handles the
  // optimistic flip and reverts if this throws.
  const updateTaskCompletion = async (taskId: string) => {
    try {
      await studyPlansService.toggleStatus(Number(taskId));
      await queryClient.invalidateQueries({ queryKey: ["study-plans"] });
    } catch (error) {
      toast.error("تعذر حفظ حالة المهمة");
      throw error;
    }
  };

  return (
    <main className="h-full w-full bg-zinc-100 dark:bg-zinc-950" dir="rtl">
      <div className="px-6 py-8">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6 px-17">
          <PlannerViewSwitch />

          <div className="flex flex-wrap items-center gap-4">
            {/* Week pager — RTL, so "back" points right and "forward" left. */}
            <div className="flex items-center gap-1 rounded-full border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
              <button
                type="button"
                onClick={() => setWeekOffset((offset) => offset - 1)}
                title="الأسبوع السابق"
                aria-label="الأسبوع السابق"
                className="flex size-8 items-center justify-center rounded-full text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <ChevronRight size={18} />
              </button>
              <button
                type="button"
                onClick={() => setWeekOffset((offset) => Math.min(0, offset + 1))}
                disabled={isCurrentWeek}
                title="الأسبوع التالي"
                aria-label="الأسبوع التالي"
                className="flex size-8 items-center justify-center rounded-full text-zinc-600 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <ChevronLeft size={18} />
              </button>
            </div>

            <div className="flex items-baseline gap-4">
              {isFetching && !isLoading && (
                <RefreshCw
                  size={16}
                  aria-label="جاري التحديث"
                  className="animate-spin text-blue-500 dark:text-blue-400"
                />
              )}
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                {weekTitle}
              </h1>
              <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                {formatPlannerDate(dates[0])} - {formatPlannerDate(dates[6])}
              </div>
            </div>

            {/* {!isCurrentWeek && (
              <button
                type="button"
                onClick={() => setWeekOffset(0)}
                className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/60"
              >
                <Undo2 size={14} />
                العودة إلى الأسبوع الحالي
              </button>
            )} */}
          </div>
        </div>

        <div className="h-[75vh] flex rounded-xl overflow-hidden max-w-[99vw] border border-zinc-200 shadow-sm dark:border-zinc-800">
          {days.map((day) => (
            <div key={day.index} className="flex-1 overflow-hidden">
              <DayCard
                {...day}
                onClick={() =>
                  router.push(`/planner/execution/${day.index}?week=${weekOffset}`)
                }
                hourLimits={hourLimits}
                onTaskComplete={updateTaskCompletion}
                onTaskDrop={(taskId, beforeTaskId) =>
                  void moveTask(taskId, dates[day.index - 1], beforeTaskId)
                }
                // Opens the add-task dialog right here, for that day.
                onAddTask={
                  day.isPast
                    ? undefined
                    : () => setAddTaskDate(dates[day.index - 1])
                }
              />
            </div>
          ))}
        </div>

        {isLoading && (
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            جاري تحميل مهام الأسبوع...
          </p>
        )}

        {addTaskDate && (
          <AddTaskDialog
            date={addTaskDate}
            onCreated={onTaskAdded}
            onClose={() => setAddTaskDate(null)}
          />
        )}

        {/* Planning next week: AI-generated from goals, or built by hand day by day. */}
        <section className="mt-10">
          <div className="mb-4 flex items-baseline gap-2">
            <CalendarDays
              className="text-blue-600 dark:text-blue-400"
              size={22}
            />
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              التخطيط للأسبوع القادم
            </h2>
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {formatPlannerDate(nextWeekDates[0])} -{" "}
              {formatPlannerDate(nextWeekDates[6])}
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-2xl bg-zinc-200/70 p-1.5 dark:bg-zinc-900">
            {planningTabs.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setPlanningTab(value)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold transition-all",
                  planningTab === value
                    ? "bg-white text-blue-700 shadow-sm dark:bg-zinc-800 dark:text-blue-400"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200",
                )}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>

          {planningTab === "ai" ? (
            <AiPlanningSection onPlanned={() => setPlanningTab("manual")} />
          ) : (
            <NextWeekBoard />
          )}
        </section>
      </div>
    </main>
  );
};

export default Planner;
