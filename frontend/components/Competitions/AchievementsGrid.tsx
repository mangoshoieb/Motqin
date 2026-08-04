"use client";

import { Lock } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { ACHIEVEMENT_CATEGORY_LABELS } from "@/app/constants/competition.constants";
import { Achievement, AchievementCategory } from "@/app/types/competition.types";

const CATEGORY_ORDER: AchievementCategory[] = [
  "discipline",
  "focus",
  "mastery",
  "social",
];

interface AchievementsGridProps {
  achievements: Achievement[];
}

// The counterweight to the league: nothing here can be lost. A bad week costs
// rank, never a badge — which is what keeps a student from disappearing after
// one relegation.
export const AchievementsGrid = ({ achievements }: AchievementsGridProps) => {
  const unlocked = achievements.filter((a) => a.unlockedAt !== null).length;

  return (
    <section className="space-y-6" dir="rtl">
      <div className="rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100">إنجازاتي</h3>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              الشارات دائمة — لا تفقدها مهما تغيّر ترتيبك في الدوري
            </p>
          </div>

          <p className="shrink-0 text-2xl font-bold text-violet-600 dark:text-violet-400">
            {unlocked}
            <span className="text-base text-zinc-400"> / {achievements.length}</span>
          </p>
        </div>

        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-gradient-to-l from-violet-400 to-violet-600 transition-all duration-700"
            style={{ width: `${Math.round((unlocked / achievements.length) * 100)}%` }}
          />
        </div>
      </div>

      {CATEGORY_ORDER.map((category) => {
        const items = achievements.filter((a) => a.category === category);
        if (items.length === 0) return null;

        return (
          <div key={category}>
            <h4 className="mb-3 text-sm font-bold text-zinc-500 dark:text-zinc-400">
              {ACHIEVEMENT_CATEGORY_LABELS[category]}
            </h4>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((achievement) => (
                <AchievementCard key={achievement.id} achievement={achievement} />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
};

const AchievementCard = ({ achievement }: { achievement: Achievement }) => {
  const isUnlocked = achievement.unlockedAt !== null;

  return (
    <article
      className={cn(
        "rounded-3xl border p-4 transition",
        isUnlocked
          ? "border-violet-200 bg-violet-50 dark:border-violet-900 dark:bg-violet-950/25"
          : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-2xl text-2xl",
            isUnlocked
              ? "bg-white shadow-sm dark:bg-zinc-900"
              : "bg-zinc-100 grayscale dark:bg-zinc-800"
          )}
          aria-hidden
        >
          {isUnlocked ? achievement.icon : <Lock size={20} className="text-zinc-400" />}
        </div>

        <div className="min-w-0 flex-1">
          <h5
            className={cn(
              "font-bold",
              isUnlocked
                ? "text-violet-900 dark:text-violet-200"
                : "text-zinc-700 dark:text-zinc-300"
            )}
          >
            {achievement.title}
          </h5>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            {achievement.description}
          </p>
        </div>
      </div>

      <div className="mt-3">
        <div className="mb-1.5 flex items-center justify-between">
          <span
            className={cn(
              "text-[11px] font-semibold",
              isUnlocked
                ? "text-violet-700 dark:text-violet-300"
                : "text-zinc-500 dark:text-zinc-400"
            )}
          >
            {achievement.progressLabel}
          </span>
          {!isUnlocked && (
            <span className="text-[11px] text-zinc-400">
              {Math.round(achievement.progress * 100)}%
            </span>
          )}
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700",
              isUnlocked ? "bg-violet-500" : "bg-zinc-400 dark:bg-zinc-600"
            )}
            style={{ width: `${Math.round(achievement.progress * 100)}%` }}
          />
        </div>
      </div>
    </article>
  );
};
