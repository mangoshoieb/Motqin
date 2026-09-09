"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import DayCard from "@/components/DayCard";
import { weekData } from "@/app/data/days";
import { studyPlansService } from "@/app/services/motqin";
import { applyStudyPlansToDay, currentWeekDates, formatPlannerDate } from "@/app/lib/study-plan";
import { PlannerViewSwitch } from "@/components/Planner/PlannerViewSwitch";
import GoalsSection from "@/components/Planner/GoalsSection";

const Planner = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const parsedWeek = Number(searchParams.get("week") ?? "0");
  const weekOffset = Number.isFinite(parsedWeek) ? Math.max(0, Math.min(1, parsedWeek)) : 0;
  const dates = currentWeekDates(weekOffset);
  const { data: studyPlans, isLoading } = useQuery({
    queryKey: ["study-plans", "week", weekOffset, dates[0], dates[6]],
    queryFn: () => studyPlansService.filter({ duration: 2, startDate: dates[0], endDate: dates[6] }),
  });

  const days = weekData.map((day, index) => {
    const date = dates[index];
    const items = studyPlans?.items.filter((item) => item.date === date) ?? [];
    const today = new Date();
    const todayDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const isFuture = weekOffset > 0 || date > todayDate;
    return {
      ...applyStudyPlansToDay({ ...day, date, isToday: date === todayDate }, items),
      isFuture,
    };
  });

  const updateTaskCompletion = async (taskId: string, completed: boolean) => {
    try {
      await studyPlansService.update(Number(taskId), { status: completed ? 1 : 3 });
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

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push(`/planner?week=${Math.max(0, weekOffset - 1)}`)}
              disabled={weekOffset === 0}
              title="الأسبوع السابق"
              className="rounded-lg p-2 text-zinc-500 hover:bg-white disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-zinc-800"
            >
              <ChevronRight size={18} />
            </button>
            <button
              type="button"
              onClick={() => router.push(`/planner?week=${Math.min(1, weekOffset + 1)}`)}
              disabled={weekOffset === 1}
              title="الأسبوع التالي"
              className="rounded-lg p-2 text-zinc-500 hover:bg-white disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-zinc-800"
            >
              <ChevronLeft size={18} />
            </button>
          <div className="flex items-baseline gap-4">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              الأسبوع الأول
            </h1>
            <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {formatPlannerDate(dates[0])} - {formatPlannerDate(dates[6])}
            </div>
          </div>
          </div>
        </div>

        <div className="h-[75vh] flex rounded-xl overflow-hidden max-w-[99vw] border border-zinc-200 shadow-sm dark:border-zinc-800">
          {days.map((day) => (
            <div key={day.index} className="flex-1 overflow-hidden">
                <DayCard
                {...day}
                onClick={() => router.push(`/planner/execution/${day.index}?week=${weekOffset}`)}
                onTaskComplete={updateTaskCompletion}
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
