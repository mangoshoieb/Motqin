"use client";

import { formatPoints } from "@/app/constants/competition.constants";
import { MyRankCard as MyRankCardData } from "@/app/types/competition.types";
import { TierBadge } from "./TierBadge";
import { InviteSharePanel } from "./InviteShare";

interface CompetitionHeroProps {
  card: MyRankCardData;
  memberCount: number;
}

// The top card of the competitions hub: the invite, and under it a one-line
// preview of the weekly points.
//
// The points (league, rank, weekly points) are still mock data — no API
// serves them yet — so the line is marked قريبًا with the numbers blurred,
// and it no longer opens the full breakdown (MyRankCard), so nobody reads
// made-up numbers as theirs. Bring the toggle back once there's an API.
export const CompetitionHero = ({ card, memberCount }: CompetitionHeroProps) => {
  return (
    <section
      dir="rtl"
      className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6"
    >
      <InviteSharePanel />

      <div className="mt-5 flex w-full flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-dashed border-zinc-200 px-4 py-3 dark:border-zinc-700">
        <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">نقاطك هذا الأسبوع</span>
        <span className="flex select-none items-center gap-4 blur-[5px]" aria-hidden>
          <TierBadge tier={card.tier} size="sm" />
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            <span className="font-bold text-zinc-900 dark:text-zinc-100">#{card.rank}</span> من {memberCount}
          </span>
          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
            {formatPoints(card.weeklyPoints)} نقطة
          </span>
        </span>
        <span className="ms-auto rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
          قريبًا
        </span>
      </div>
    </section>
  );
};
