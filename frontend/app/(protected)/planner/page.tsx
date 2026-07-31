"use client";
import { useRouter } from "next/navigation";
import DayCard from "@/components/DayCard";
import { weekData } from "@/app/data/days";
import { PlannerViewSwitch } from "@/components/Planner/PlannerViewSwitch";

const Planner = () => {
  const router = useRouter();

  return (
    <main className="h-full w-full bg-zinc-100 dark:bg-zinc-950" dir="rtl">
      <div className="px-6 py-8">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6 px-16.5">
          <PlannerViewSwitch />

          <div className="flex items-baseline gap-4">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              الأسبوع الأول
            </h1>
            <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              18 يونيو - 24 يونيو
            </div>
          </div>
        </div>

        <div className="h-[75vh] flex rounded-xl overflow-hidden max-w-[99vw] border border-zinc-200 shadow-sm dark:border-zinc-800">
          {weekData.map((day) => (
            <div key={day.index} className="flex-1 overflow-hidden">
              <DayCard
                {...day}
                onClick={() => router.push(`/planner/execution/${day.index}`)}
              />
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 p-6 text-center text-sm text-zinc-400 dark:text-zinc-600">
          الأهداف (قريبًا)
        </div>
      </div>
    </main>
  );
};

export default Planner;
