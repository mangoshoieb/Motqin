"use client";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import DayCard from "@/components/DayCard";
import { weekData } from "@/app/data/days";
import { studyPlansService } from "@/app/services/motqin";
import { applyStudyPlansToDay, currentWeekDates, formatPlannerDate } from "@/app/lib/study-plan";
import { PlannerViewSwitch } from "@/components/Planner/PlannerViewSwitch";
import GoalsSection from "@/components/Planner/GoalsSection";

const Planner = () => {
  const router = useRouter();
  const dates = currentWeekDates();
  const { data: studyPlans, isLoading } = useQuery({
    queryKey: ["study-plans", "week", dates[0], dates[6]],
    queryFn: () => studyPlansService.filter({ duration: 2, startDate: dates[0], endDate: dates[6] }),
  });

  const days = weekData.map((day, index) => {
    const date = dates[index];
    const items = studyPlans?.items.filter((item) => item.date === date) ?? [];
    return applyStudyPlansToDay({ ...day, date }, items);
  });

  return (
    <main className="h-full w-full bg-zinc-100 dark:bg-zinc-950" dir="rtl">
      <div className="px-6 py-8">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6 px-17">
          <PlannerViewSwitch />

          <div className="flex items-baseline gap-4">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              الأسبوع الأول
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
                onClick={() => router.push(`/planner/execution/${day.index}`)}
              />
            </div>
          ))}
        </div>

        {isLoading && (
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">جاري تحميل مهام الأسبوع...</p>
        )}

        <GoalsSection />
      </div>
    </main>
  );
};

export default Planner;
