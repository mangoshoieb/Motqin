"use client";

import Link from "next/link";
import { DayOutputs } from "@/app/types/execution-board.types";
import { PlannerViewSwitch } from "@/components/Planner/PlannerViewSwitch";

interface ExecutionBoardHeaderProps {
  dayName: string;
  date: string;
  outputs: DayOutputs;
}

const formatHours = (minutes: number) => {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs}:${mins.toString().padStart(2, "0")}`;
};

// "Very detailed day information" header — the week/today switch, a
// placeholder link to planner preferences, and the day's outputs (tasks
// completed, sessions, study time, quiz accuracy).
export const ExecutionBoardHeader = ({ dayName, date, outputs }: ExecutionBoardHeaderProps) => {
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
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">لوحة تنفيذ يوم {dayName}</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">{date}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white border border-zinc-200 p-4 dark:bg-zinc-900 dark:border-zinc-800">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {outputs.tasksCompleted}/{outputs.totalTasks}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">مهام منجزة</p>
        </div>
        <div className="rounded-2xl bg-white border border-zinc-200 p-4 dark:bg-zinc-900 dark:border-zinc-800">
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{outputs.totalSessions}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">جلسات</p>
        </div>
        <div className="rounded-2xl bg-white border border-zinc-200 p-4 dark:bg-zinc-900 dark:border-zinc-800">
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {formatHours(outputs.totalStudyMinutes)}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">ساعات الدراسة</p>
        </div>
        <div className="rounded-2xl bg-white border border-zinc-200 p-4 dark:bg-zinc-900 dark:border-zinc-800">
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {outputs.quizAccuracy !== null ? `${Math.round(outputs.quizAccuracy * 100)}%` : "—"}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">دقة الاختبارات</p>
        </div>
      </div>
    </div>
  );
};
