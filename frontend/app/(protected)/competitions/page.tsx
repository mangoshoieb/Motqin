"use client";

import { useState } from "react";
import Skeleton from "@/components/ui/Skeleton";
import { useMyLeague, useMyRankCard } from "@/app/hooks/useCompetitions";
import {
  CompetitionTab,
  CompetitionTabs,
} from "@/components/Competitions/CompetitionTabs";
import { CompetitionHero } from "@/components/Competitions/CompetitionHero";
import {
  AchievementBoard,
  ReferralBoard,
  StreakBoard,
} from "@/components/Competitions/CompetitionBoards";

export default function CompetitionsPage() {
  const [tab, setTab] = useState<CompetitionTab>("league");

  const { data: card, isLoading: cardLoading } = useMyRankCard();
  const { data: league } = useMyLeague();

  return (
    <main className="min-h-screen w-full bg-zinc-100 dark:bg-zinc-950" dir="rtl">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            المسابقات والصدارة
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            نقاطك تأتي من مذاكرتك الفعلية — مهام مخططك، دقائق تركيزك، ودقة اختباراتك.
          </p>
        </header>

        {/* Persistent across all three tabs: the invite, with the student's
            score folded underneath it. */}
        {cardLoading || !card || !league ? (
          <Skeleton className="h-56 w-full rounded-3xl" />
        ) : (
          <CompetitionHero
            card={card}
            promoteCount={league.promoteCount}
            memberCount={league.members.length}
            endsAt={league.endsAt}
          />
        )}

        <div className="my-6">
          <CompetitionTabs active={tab} onChange={setTab} />
        </div>

        {/* Each tab is one live leaderboard (GET /competition/...). */}
        {tab === "league" && <StreakBoard />}
        {tab === "challenges" && <ReferralBoard />}
        {tab === "achievements" && <AchievementBoard />}
      </div>
    </main>
  );
}
