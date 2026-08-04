"use client";

import { useState } from "react";
import Skeleton from "@/components/ui/Skeleton";
import {
  useAchievements,
  useChallenges,
  useMyLeague,
  useMyRankCard,
} from "@/app/hooks/useCompetitions";
import {
  CompetitionTab,
  CompetitionTabs,
} from "@/components/Competitions/CompetitionTabs";
import { MyRankCard } from "@/components/Competitions/MyRankCard";
import { LeagueBoard } from "@/components/Competitions/LeagueBoard";
import { ChallengesList } from "@/components/Competitions/ChallengesList";
import { AchievementsGrid } from "@/components/Competitions/AchievementsGrid";

export default function CompetitionsPage() {
  const [tab, setTab] = useState<CompetitionTab>("league");

  const { data: card, isLoading: cardLoading } = useMyRankCard();
  const { data: league, isLoading: leagueLoading } = useMyLeague();
  const { data: challenges, isLoading: challengesLoading } = useChallenges();
  const { data: achievements, isLoading: achievementsLoading } = useAchievements();

  const openChallenges = challenges?.filter((c) => c.status === "open").length;

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

        {/* Persistent across all three tabs — the student's standing is the
            context for everything below it. */}
        {cardLoading || !card || !league ? (
          <Skeleton className="h-56 w-full rounded-3xl" />
        ) : (
          <MyRankCard
            card={card}
            promoteCount={league.promoteCount}
            memberCount={league.members.length}
            endsAt={league.endsAt}
          />
        )}

        <div className="my-6">
          <CompetitionTabs active={tab} onChange={setTab} challengeCount={openChallenges} />
        </div>

        {tab === "league" &&
          (leagueLoading || !league ? (
            <BoardSkeleton />
          ) : (
            <LeagueBoard league={league} />
          ))}

        {tab === "challenges" &&
          (challengesLoading || !challenges ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-64 w-full rounded-3xl" />
              ))}
            </div>
          ) : (
            <ChallengesList challenges={challenges} />
          ))}

        {tab === "achievements" &&
          (achievementsLoading || !achievements ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-36 w-full rounded-3xl" />
              ))}
            </div>
          ) : (
            <AchievementsGrid achievements={achievements} />
          ))}
      </div>
    </main>
  );
}

const BoardSkeleton = () => (
  <div className="space-y-2">
    <Skeleton className="h-20 w-full rounded-3xl" />
    {Array.from({ length: 8 }).map((_, i) => (
      <Skeleton key={i} className="h-16 w-full rounded-2xl" />
    ))}
  </div>
);
