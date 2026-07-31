"use client";
import { useRouter } from "next/navigation";
import DayCard from "@/components/DayCard";
import { weekData } from "@/app/data/days";
import { PlannerViewSwitch } from "@/components/Planner/PlannerViewSwitch";

const Planner = () => {
  const router = useRouter();

  return (
    <main className="h-full w-full bg-[var(--surface)]" dir="rtl">
      <div className="p-2 ">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex gap-40">
            <h1 className="text-3xl font-bold py-4">الأسبوع الأول</h1>
            <div className="mt-5 text-lg font-semibold">18 يونيو - 24 يونيو</div>
          </div>

          <PlannerViewSwitch />
        </div>

        <div className="h-[75vh] flex rounded-xl overflow-hidden max-w-[99vw]">
          {weekData.map((day) => (
            <div key={day.index} className="flex-1 overflow-hidden">
              <DayCard {...day} onClick={() => router.push(`/planner/execution/${day.index}`)} />
            </div>
          ))}
        </div>

        <div>Goals</div>
      </div>
    </main>
  );
};

export default Planner;
