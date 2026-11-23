"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, PencilRuler, RefreshCw, Sparkles } from "lucide-react";
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
import Link from "next/link";
import { PlannerViewSwitch } from "@/components/Planner/PlannerViewSwitch";
import { PeriodPager } from "@/components/Planner/PeriodPager";
import AiPlanningSection from "@/components/Planner/AiPlanningSection";
import NextWeekBoard from "@/components/Planner/NextWeekBoard";
import { AddTaskDialog } from "@/components/ExecutionBoard/AddTaskDialog";
import { ExecutionTask } from "@/app/types/execution-board.types";
import { useWorkHourLimits } from "@/app/hooks/useUserPreferences";
import { useBoardDrag } from "@/app/hooks/useBoardDrag";
import { useAuthKind } from "@/app/hooks/useAuthKind";
import { BoardDragGhost } from "@/components/Planner/BoardDragGhost";

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

  // Arriving with "?tab=ai" (back from the planner preferences): glide down
  // to the AI planning card and light it up for a moment, so the student
  // lands where they left off rather than at the top of the page.
  const planningRef = useRef<HTMLElement>(null);
  const [highlightPlanning, setHighlightPlanning] = useState(false);
  const scrolledToPlanning = useRef(false);


  // The top board shows the current week by default and pages back through
  // earlier weeks or ahead to coming ones (weekOffset < 0 / > 0).
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

  // Each day's performance (hours studied, sessions done) from GET
  // /study-plan/user-performance-by-range. Under "study-plans", so whatever
  // refreshes the plans (a session ending, a task toggled) refreshes this too.
  // A plan without PerformanceRange answers 403 not_in_plan — the cards then
  // keep the numbers worked out from the plans themselves. Guests skip it.
  const isRegistered = useAuthKind() === "user";
  const { data: performance } = useQuery({
    queryKey: ["study-plans", "performance", dates[0], dates[6]],
    queryFn: () => studyPlansService.performanceByRange(dates[0], dates[6]),
    enabled: isRegistered,
    retry: false,
    placeholderData: (previous) => previous,
  });
  // Keyed by yyyy-MM-dd, this week's days only (placeholder data can still
  // be the previous week's while the new one loads).
  const performanceByDate = new Map(
    (performance?.days ?? [])
      .map((day) => [day.date.slice(0, 10), day] as const)
      .filter(([date]) => date >= dates[0] && date <= dates[6]),
  );

  // Waits for the week board above to load (it decides where the card ends
  // up), then gives the layout a beat to settle before scrolling — smoothly,
  // so it reads as moving down the page rather than a jump.
  useEffect(() => {
    if (scrolledToPlanning.current || isLoading || searchParams.get("tab") !== "ai") return;
    let fadeTimer: number | undefined;
    // Marked done only once it has actually scrolled, so a re-run of this
    // effect before then reschedules instead of skipping it.
    const scrollTimer = window.setTimeout(() => {
      scrolledToPlanning.current = true;
      planningRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      setHighlightPlanning(true);
      fadeTimer = window.setTimeout(() => setHighlightPlanning(false), 2200);
    }, 350);
    return () => {
      window.clearTimeout(scrollTimer);
      if (fadeTimer) window.clearTimeout(fadeTimer);
    };
  }, [isLoading, searchParams]);

  const weekTitle = isCurrentWeek
    ? "الأسبوع الحالي"
    : weekOffset === -1
      ? "الأسبوع السابق"
      : weekOffset === 1
        ? "الأسبوع القادم"
        : weekOffset === -2
          ? "قبل أسبوعين"
          : weekOffset === 2
            ? "بعد أسبوعين"
            : weekOffset < 0
              ? `قبل ${-weekOffset} أسابيع`
              : `بعد ${weekOffset} أسابيع`;

  const days = weekData.map((day, index) => {
    const date = dates[index];
    const items = studyPlans?.items.filter((item) => item.date === date) ?? [];
    const dayPerformance = performanceByDate.get(date);
    return {
      ...applyStudyPlansToDay(
        { ...day, date, isToday: date === todayDate },
        items,
      ),
      ...(dayPerformance && {
        // Hours to one decimal, like the local fallback.
        workingHours: Math.round(dayPerformance.productiveMinutes / 6) / 10,
        focusSessions: dayPerformance.completedSessionsCount,
      }),
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
    // The day the task left closes the gap: its remaining tasks move up so
    // the freed slot (e.g. ★★★) goes to the next one in line.
    if (dateChanged) {
      sortByPriority(
        items.filter((item) => item.date === moved.date && item.id !== moved.id),
        (item) => item.priority,
      ).forEach((item, index) => {
        const priority = priorityForPosition(index);
        if (priority !== item.priority) priorities.set(item.id, priority);
      });
    }
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

  // Drag and drop on the board (pointer-based, see useBoardDrag): a drop
  // lands the task in the target day at the gap it was showing.
  const {
    drag: boardDrag,
    onTaskPointerDown,
    registerDropResolver,
    shouldSuppressClick,
  } = useBoardDrag({
    tasks: (studyPlans?.items ?? []).map((item) => ({
      id: String(item.id),
      title: item.title,
      priorityValue: item.priority,
    })),
    onDrop: (taskId, dayIndex, beforeTaskId) => void moveTask(taskId, dates[dayIndex - 1], beforeTaskId),
  });

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
        {/* Same layout as the execution board's header: the view switch and
            preferences on top, then the title with the week arrows on its
            left, and the week's dates under it. */}
        <div className="mb-6 flex flex-col gap-6 px-17">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <PlannerViewSwitch />

            <Link
              href="/settings/planner"
              className="shrink-0 px-5 py-2.5 rounded-full border border-zinc-200 text-zinc-600 text-sm font-medium transition hover:bg-white dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              تفضيلات المخطط
            </Link>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-4">
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{weekTitle}</h1>
              <PeriodPager
                onPrevious={() => setWeekOffset((offset) => offset - 1)}
                onNext={() => setWeekOffset((offset) => offset + 1)}
                previousLabel="الأسبوع السابق"
                nextLabel="الأسبوع التالي"
              />
              {isFetching && !isLoading && (
                <RefreshCw
                  size={16}
                  aria-label="جاري التحديث"
                  className="animate-spin text-blue-500 dark:text-blue-400"
                />
              )}
            </div>
            <p className="mt-1 text-right text-zinc-500 dark:text-zinc-400" dir="ltr">
              {formatPlannerDate(dates[0])} - {formatPlannerDate(dates[6])}
            </p>
          </div>
        </div>

        <div className="h-[75vh] flex rounded-xl overflow-hidden max-w-[99vw] border border-zinc-200 shadow-sm dark:border-zinc-800">
          {days.map((day) => (
            <div key={day.index} className="flex-1 overflow-hidden">
              <DayCard
                {...day}
                onClick={() => {
                  if (shouldSuppressClick()) return;
                  router.push(`/planner/execution/${day.index}?week=${weekOffset}`);
                }}
                hourLimits={hourLimits}
                onTaskComplete={updateTaskCompletion}
                droppable
                boardDrag={boardDrag}
                onTaskPointerDown={onTaskPointerDown}
                registerDropResolver={registerDropResolver}
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

        <BoardDragGhost drag={boardDrag} />

        {addTaskDate && (
          <AddTaskDialog
            date={addTaskDate}
            onCreated={onTaskAdded}
            onClose={() => setAddTaskDate(null)}
          />
        )}

        {/* Planning next week: AI-generated from goals, or built by hand day by day. */}
        <section
          ref={planningRef}
          className={cn(
            "mt-10 scroll-mt-6 rounded-3xl transition-shadow duration-700",
            highlightPlanning && "shadow-[0_0_0_4px_rgba(59,130,246,0.35)] dark:shadow-[0_0_0_4px_rgba(59,130,246,0.25)]",
          )}
        >
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
