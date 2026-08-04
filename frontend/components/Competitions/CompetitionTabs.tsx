"use client";

import { cn } from "@/app/lib/utils";

export type CompetitionTab = "league" | "challenges" | "achievements";

const TABS: { value: CompetitionTab; label: string; icon: string }[] = [
  { value: "league", label: "الدوري", icon: "🏆" },
  { value: "challenges", label: "التحديات", icon: "⚔️" },
  { value: "achievements", label: "إنجازاتي", icon: "🏅" },
];

interface CompetitionTabsProps {
  active: CompetitionTab;
  onChange: (tab: CompetitionTab) => void;
  challengeCount?: number;
}

// Segmented control, styled to match PlannerViewSwitch so the two hubs feel
// like the same app.
export const CompetitionTabs = ({
  active,
  onChange,
  challengeCount,
}: CompetitionTabsProps) => (
  <div
    className="inline-flex w-full items-center gap-1.5 rounded-2xl bg-zinc-200/70 p-1.5 dark:bg-zinc-900 sm:w-auto"
    dir="rtl"
  >
    {TABS.map((tab) => (
      <button
        key={tab.value}
        type="button"
        onClick={() => onChange(tab.value)}
        className={cn(
          "flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all sm:flex-none sm:px-6",
          active === tab.value
            ? "bg-white text-blue-700 shadow-sm dark:bg-zinc-800 dark:text-blue-400"
            : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
        )}
      >
        <span aria-hidden>{tab.icon}</span>
        {tab.label}
        {tab.value === "challenges" && challengeCount ? (
          <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {challengeCount}
          </span>
        ) : null}
      </button>
    ))}
  </div>
);
