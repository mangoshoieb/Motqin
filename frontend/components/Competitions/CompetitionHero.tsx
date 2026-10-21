"use client";

import { useState } from "react";
import { ChevronDown, Gift } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { formatPoints } from "@/app/constants/competition.constants";
import { MyRankCard as MyRankCardData } from "@/app/types/competition.types";
import { MyRankCard } from "./MyRankCard";
import { TierBadge } from "./TierBadge";
import { INVITE_HEADLINE, InviteSharePanel } from "./InviteShare";

interface CompetitionHeroProps {
  card: MyRankCardData;
  promoteCount: number;
  memberCount: number;
  endsAt: string;
}

// Animates its content's height between 0 and auto (the grid-rows trick),
// fading with it. Closed content is inert, so it can't be tabbed into.
function Collapsible({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows,opacity] duration-500 ease-in-out motion-reduce:transition-none",
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
      )}
      aria-hidden={!open}
      inert={!open}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

// The top card of the competitions hub. By default it invites friends, with
// the student's score folded into one line at the bottom. Opening the score
// lets it take the card, and the invite shrinks to one line at the top —
// clicking that brings the invite back.
export const CompetitionHero = ({ card, promoteCount, memberCount, endsAt }: CompetitionHeroProps) => {
  const [showScore, setShowScore] = useState(false);

  return (
    <section
      dir="rtl"
      className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6"
    >
      {/* Invite, folded to one line while the score is open */}
      <Collapsible open={showScore}>
        <button
          type="button"
          onClick={() => setShowScore(false)}
          aria-expanded={!showScore}
          className="mb-5 flex w-full items-center gap-3 rounded-2xl border border-amber-200 bg-gradient-to-l from-amber-50 to-orange-50 px-4 py-3 text-right transition hover:border-amber-300 dark:border-amber-900/50 dark:from-amber-950/30 dark:to-orange-950/30"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 to-orange-500 text-white" aria-hidden>
            <Gift size={16} />
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-bold text-amber-900 dark:text-amber-200">
            {INVITE_HEADLINE}
          </span>
          <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
            ادعُ أصدقاءك
            <ChevronDown size={16} />
          </span>
        </button>
      </Collapsible>

      {/* Invite, in full */}
      <Collapsible open={!showScore}>
        <InviteSharePanel />
      </Collapsible>

      {/* Score, folded to one line under the invite */}
      <Collapsible open={!showScore}>
        <button
          type="button"
          onClick={() => setShowScore(true)}
          aria-expanded={showScore}
          className="mt-5 flex w-full flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-zinc-200 px-4 py-3 text-right transition hover:border-blue-300 hover:bg-blue-50/40 dark:border-zinc-700 dark:hover:border-blue-800 dark:hover:bg-blue-950/20"
        >
          <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">نقاطك هذا الأسبوع</span>
          <TierBadge tier={card.tier} size="sm" />
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            <span className="font-bold text-zinc-900 dark:text-zinc-100">#{card.rank}</span> من {memberCount}
          </span>
          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
            {formatPoints(card.weeklyPoints)} نقطة
          </span>
          <span className="ms-auto flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
            عرض التفاصيل
            <ChevronDown size={16} />
          </span>
        </button>
      </Collapsible>

      {/* Score, in full */}
      <Collapsible open={showScore}>
        <MyRankCard
          card={card}
          promoteCount={promoteCount}
          memberCount={memberCount}
          endsAt={endsAt}
        />
      </Collapsible>
    </section>
  );
};
