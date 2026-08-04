"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Info } from "lucide-react";
import {
  LEAGUE_VISIBLE_NEIGHBOURS,
  TIER_META,
  formatTimeLeft,
  nextTier,
  previousTier,
} from "@/app/constants/competition.constants";
import { League, LeagueMember, LeagueZone } from "@/app/types/competition.types";
import { TierBadge } from "./TierBadge";
import { LeagueRow } from "./LeagueRow";

const zoneFor = (rank: number, league: League): LeagueZone => {
  if (rank <= league.promoteCount) return "promotion";
  if (rank > league.members.length - league.relegateCount) return "relegation";
  return "safe";
};

// Collapsed view shows the promotion zone, the student's own neighbourhood,
// and the relegation zone — the three places a rank actually means something.
// A student never needs to scroll past 20 strangers to find themselves.
const collapseRanks = (league: League, myRank: number): Set<number> => {
  const visible = new Set<number>();
  const total = league.members.length;

  for (let r = 1; r <= league.promoteCount; r++) visible.add(r);
  for (
    let r = myRank - LEAGUE_VISIBLE_NEIGHBOURS;
    r <= myRank + LEAGUE_VISIBLE_NEIGHBOURS;
    r++
  ) {
    if (r >= 1 && r <= total) visible.add(r);
  }
  for (let r = total - league.relegateCount + 1; r <= total; r++) {
    if (r >= 1) visible.add(r);
  }

  return visible;
};

interface LeagueBoardProps {
  league: League;
}

export const LeagueBoard = ({ league }: LeagueBoardProps) => {
  const [expanded, setExpanded] = useState(false);

  const myRank = league.members.find((m) => m.isCurrentUser)?.rank ?? 1;
  const visibleRanks = collapseRanks(league, myRank);

  const rows = expanded
    ? league.members
    : league.members.filter((m) => visibleRanks.has(m.rank));

  const up = nextTier(league.tier);
  const down = previousTier(league.tier);
  const total = league.members.length;

  // Insert the promotion/relegation cut lines and the "…" gaps between
  // non-consecutive rows in one pass over the visible rows.
  const renderRow = (member: LeagueMember, index: number) => {
    const prev = rows[index - 1];
    const hasGap = prev !== undefined && member.rank - prev.rank > 1;
    const isPromotionLine = prev !== undefined && prev.rank === league.promoteCount;
    const isRelegationLine =
      prev !== undefined && member.rank === total - league.relegateCount + 1;

    return (
      <div key={member.userId}>
        {isPromotionLine && !hasGap && (
          <CutLine
            label={up ? `خط الصعود إلى الدوري ${TIER_META[up].label}` : "خط الصدارة"}
            tone="promotion"
          />
        )}

        {hasGap && (
          <div className="my-2 flex items-center justify-center gap-2 text-zinc-400">
            <span className="text-lg leading-none">⋯</span>
            <span className="text-xs">{member.rank - prev.rank - 1} طالبًا</span>
          </div>
        )}

        {isRelegationLine && (
          <CutLine
            label={down ? `خط الهبوط إلى الدوري ${TIER_META[down].label}` : "منطقة الخطر"}
            tone="relegation"
          />
        )}

        <LeagueRow member={member} zone={zoneFor(member.rank, league)} />
      </div>
    );
  };

  return (
    <section className="space-y-4" dir="rtl">
      {/* Board header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-5">
        <div className="flex items-center gap-3">
          <TierBadge tier={league.tier} />
          <div>
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              {league.weekLabel}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {total} طالبًا · يُعاد الضبط خلال {formatTimeLeft(league.endsAt)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
            <ArrowUp size={14} />
            أول {league.promoteCount} يصعدون
          </span>
          {league.relegateCount > 0 && (
            <span className="inline-flex items-center gap-1.5 font-semibold text-red-500 dark:text-red-400">
              <ArrowDown size={14} />
              آخر {league.relegateCount} يهبطون
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2">{rows.map(renderRow)}</div>

      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="rounded-full border border-zinc-300 px-5 py-2 text-sm font-semibold text-zinc-600 transition hover:bg-white dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {expanded ? "عرض مختصر" : "عرض الدوري كامل"}
        </button>

        <p className="flex max-w-xl items-start gap-2 px-2 text-center text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          <Info size={14} className="mt-0.5 shrink-0" />
          <span>
            دوريك يضم {total} طالبًا في مرحلة دراسية قريبة من مرحلتك، ويُعاد ترتيبه كل أسبوع.
            الترتيب يقارنك بمن يشبهك — لا بكل طلاب متقن.
          </span>
        </p>
      </div>
    </section>
  );
};

const CutLine = ({
  label,
  tone,
}: {
  label: string;
  tone: "promotion" | "relegation";
}) => (
  <div className="my-3 flex items-center gap-3">
    <div
      className={`h-px flex-1 ${
        tone === "promotion"
          ? "bg-emerald-400/60 dark:bg-emerald-600/50"
          : "bg-red-400/60 dark:bg-red-700/50"
      }`}
    />
    <span
      className={`text-[11px] font-bold ${
        tone === "promotion"
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-red-500 dark:text-red-400"
      }`}
    >
      {label}
    </span>
    <div
      className={`h-px flex-1 ${
        tone === "promotion"
          ? "bg-emerald-400/60 dark:bg-emerald-600/50"
          : "bg-red-400/60 dark:bg-red-700/50"
      }`}
    />
  </div>
);
