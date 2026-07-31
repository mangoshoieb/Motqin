"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/app/lib/utils";
import { weekData } from "@/app/data/days";

// Segmented control for switching between the week board and today's
// execution board — self-contained (looks up "today" from weekData) so it
// renders identically wherever it's used.
export const PlannerViewSwitch = () => {
  const pathname = usePathname();
  const isExecution = pathname.startsWith("/planner/execution");
  const todayIndex = weekData.find((d) => d.isToday)?.index ?? weekData[0]?.index ?? 1;

  return (
    <div className="inline-flex items-center gap-1.5 rounded-2xl bg-zinc-200/70 dark:bg-zinc-900 p-1.5">
      <Link
        href="/planner"
        className={cn(
          "px-5 py-2 rounded-xl text-sm font-bold transition-all",
          !isExecution
            ? "bg-white text-blue-700 shadow-sm dark:bg-zinc-800 dark:text-blue-400"
            : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
        )}
      >
        عرض الأسبوع
      </Link>
      <Link
        href={`/planner/execution/${todayIndex}`}
        className={cn(
          "px-5 py-2 rounded-xl text-sm font-bold transition-all",
          isExecution
            ? "bg-white text-blue-700 shadow-sm dark:bg-zinc-800 dark:text-blue-400"
            : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
        )}
      >
        لوحة اليوم
      </Link>
    </div>
  );
};
