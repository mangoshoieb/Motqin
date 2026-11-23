"use client";

import Link from "next/link";
import { DayOutputs } from "@/app/types/execution-board.types";
import { formatMinutes } from "@/app/lib/duration";
import { PlannerViewSwitch } from "@/components/Planner/PlannerViewSwitch";
import { PeriodPager } from "@/components/Planner/PeriodPager";
import Skeleton from "@/components/ui/Skeleton";

interface ExecutionBoardHeaderProps {
  dayName: string;
  date: string;
  // Missing while the day is loading — the stats show placeholders.
  outputs?: DayOutputs;
  onPreviousDay: () => void;
  onNextDay: () => void;
}

// "Very detailed day information" header — the week/today switch, the link
// to planner preferences, the day's title with arrows to the day before and
// after, and its outputs (tasks completed, sessions, study time).
export const ExecutionBoardHeader = ({
  dayName,
  date,
  outputs,
  onPreviousDay,
  onNextDay,
}: ExecutionBoardHeaderProps) => {
  const stats = outputs
    ? [
        {
          value: `${outputs.tasksCompleted}/${outputs.totalTasks}`,
          label: "مهام منجزة",
          className: "text-blue-600 dark:text-blue-400",
        },
        { value: String(outputs.totalSessions), label: "جلسات تركيز" },
        { value: formatMinutes(outputs.totalStudyMinutes), label: "ساعات الدراسة" },
      ]
    : null;

  return (
    <div className="flex flex-col gap-6">
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
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">لوحة تنفيذ يوم {dayName}</h1>
          <PeriodPager
            onPrevious={onPreviousDay}
            onNext={onNextDay}
            previousLabel="اليوم السابق"
            nextLabel="اليوم التالي"
          />
        </div>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">{date}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {stats
          ? stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl bg-white border border-zinc-200 p-4 dark:bg-zinc-900 dark:border-zinc-800"
              >
                <p className={`text-2xl font-bold ${stat.className ?? "text-zinc-900 dark:text-zinc-100"}`}>
                  {stat.value}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{stat.label}</p>
              </div>
            ))
          : [0, 1, 2].map((key) => <Skeleton key={key} className="h-[86px] rounded-2xl" />)}
      </div>
    </div>
  );
};
