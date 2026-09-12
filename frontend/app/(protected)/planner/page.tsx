"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PencilRuler, Sparkles } from "lucide-react";
import { toast } from "sonner";
import DayCard from "@/components/DayCard";
import { weekData } from "@/app/data/days";
import { StudyPlanDuration, StudyPlanItemStatus, studyPlansService } from "@/app/services/motqin";
import { applyStudyPlansToDay, currentWeekDates, dateOnly, formatPlannerDate } from "@/app/lib/study-plan";
import { cn } from "@/app/lib/utils";
import { PlannerViewSwitch } from "@/components/Planner/PlannerViewSwitch";
import GoalsSection from "@/components/Planner/GoalsSection";
import NextWeekBoard from "@/components/Planner/NextWeekBoard";

type PlanningTab = "ai" | "manual";

const planningTabs: { value: PlanningTab; label: string; icon: typeof Sparkles }[] = [
  { value: "ai", label: "التخطيط بالذكاء الاصطناعي", icon: Sparkles },
  { value: "manual", label: "التخطيط اليدوي", icon: PencilRuler },
];

const Planner = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [planningTab, setPlanningTab] = useState<PlanningTab>("ai");

  // The top board is always the current week; next week lives in the
  // manual-planning tab below.
  const dates = currentWeekDates(0);
  const todayDate = dateOnly(new Date());
  const { data: studyPlans, isLoading } = useQuery({
    queryKey: ["study-plans", "week", 0, dates[0], dates[6]],
    queryFn: () =>
      studyPlansService.filter({
        duration: StudyPlanDuration.Week,
        startDate: dates[0],
        endDate: dates[6],
      }),
  });

  const days = weekData.map((day, index) => {
    const date = dates[index];
    const items = studyPlans?.items.filter((item) => item.date === date) ?? [];
    return {
      ...applyStudyPlansToDay({ ...day, date, isToday: date === todayDate }, items),
      isFuture: date > todayDate,
    };
  });

  const updateTaskCompletion = async (taskId: string, completed: boolean) => {
    try {
      await studyPlansService.update(Number(taskId), {
        status: completed ? StudyPlanItemStatus.Completed : StudyPlanItemStatus.Upcoming,
      });
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

          <div className="flex items-baseline gap-4">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              الأسبوع الحالي
            </h1>
            <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {formatPlannerDate(dates[0])} - {formatPlannerDate(dates[6])}
            </div>
          </div>
        </div>

        <div className="h-[75vh] flex rounded-xl overflow-hidden max-w-[99vw] border border-zinc-200 shadow-sm dark:border-zinc-800">
          {days.map((day) => (
            <div key={day.index} className="flex-1 overflow-hidden">
              <DayCard
                {...day}
                onClick={() => router.push(`/planner/execution/${day.index}?week=0`)}
                onTaskComplete={updateTaskCompletion}
              />
            </div>
          ))}
        </div>

        {isLoading && (
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">جاري تحميل مهام الأسبوع...</p>
        )}

        {/* Planning next week: AI-generated from goals, or built by hand day by day. */}
        <section className="mt-10">
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
            <GoalsSection onPlanned={() => setPlanningTab("manual")} />
          ) : (
            <NextWeekBoard />
          )}
        </section>
      </div>
    </main>
  );
};

export default Planner;
