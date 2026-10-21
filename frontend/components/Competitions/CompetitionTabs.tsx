"use client";

import { cn } from "@/app/lib/utils";

export type CompetitionTab = "league" | "challenges" | "achievements";

const TABS: { value: CompetitionTab; label: string; icon: string }[] = [
  { value: "league", label: "مسابقة الاستمرارية", icon: "🏆" },
  { value: "challenges", label: "مسابقة المشاركة", icon: "⚔️" },
  { value: "achievements", label: "مسابقة الإنجاز", icon: "🏅" },
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
    className="inline-flex w-full items-stretch gap-2 rounded-3xl bg-zinc-200/70 p-2 dark:bg-zinc-900 sm:w-auto"
    dir="rtl"
  >
    {TABS.map((tab) => (
      <button
        key={tab.value}
        type="button"
        onClick={() => onChange(tab.value)}
        className={cn(
          // The longer names stack under their icon on phones so all three
          // still fit side by side.
          "flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-3 py-3 text-xs font-bold leading-tight transition-all sm:flex-none sm:flex-row sm:gap-2.5 sm:px-7 sm:py-4 sm:text-base",
          active === tab.value
            ? "bg-white text-blue-700 shadow-sm dark:bg-zinc-800 dark:text-blue-400"
            : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
        )}
      >
        <span aria-hidden className="text-xl leading-none sm:text-lg">{tab.icon}</span>
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
