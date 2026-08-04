"use client";

import { useState } from "react";
import { ChevronDown, Flame, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { useAnimatedNumber } from "@/app/hooks/useAnimatedNumber";
import {
  POINT_SOURCE_LABELS,
  TIER_META,
  formatDays,
  formatPoints,
  formatTimeLeft,
  nextTier,
} from "@/app/constants/competition.constants";
import { MyRankCard as MyRankCardData } from "@/app/types/competition.types";
import { TierBadge } from "./TierBadge";

interface MyRankCardProps {
  card: MyRankCardData;
  promoteCount: number;
  memberCount: number;
  endsAt: string;
}

// The persistent header of the competitions hub: where the student stands this
// week, and — more importantly — the one number that would move them up.
// Deliberately leads with the closable gap rather than the absolute rank.
export const MyRankCard = ({
  card,
  promoteCount,
  memberCount,
  endsAt,
}: MyRankCardProps) => {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const animatedPoints = useAnimatedNumber(card.weeklyPoints);

  const meta = TIER_META[card.tier];
  const up = nextTier(card.tier);

  const delta = card.previousRank !== null ? card.previousRank - card.rank : null;
  const totalBreakdown = card.breakdown.reduce((sum, e) => sum + e.points, 0);

  // How far into the promotion zone the student is, as a share of the whole
  // board — drives the progress bar under the headline.
  const zoneProgress = Math.min(
    1,
    Math.max(0, (memberCount - card.rank + 1) / (memberCount - promoteCount + 1))
  );

  const headline =
    card.zone === "promotion"
      ? up
        ? `أنت في منطقة الصعود إلى الدوري ${TIER_META[up].label}`
        : "أنت في القمة — حافظ على مركزك"
      : card.pointsToNextRank !== null
        ? `${formatPoints(card.pointsToNextRank)} نقطة تفصلك عن المركز ${card.rank - 1}`
        : "واصل التقدم";

  return (
    <section
      className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6"
      dir="rtl"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        {/* Identity */}
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex size-16 items-center justify-center rounded-full bg-gradient-to-br text-3xl shadow-lg",
              meta.ring,
              meta.glow
            )}
            aria-hidden
          >
            {card.avatarEmoji}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {card.displayName}
              </h2>
              {card.privateMode && (
                <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[11px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  وضع خاص
                </span>
              )}
            </div>

            <div className="mt-2 flex items-center gap-2">
              <TierBadge tier={card.tier} size="sm" />
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-orange-600 dark:text-orange-400">
                <Flame size={15} />
                {formatDays(card.streakDays)}
              </span>
            </div>
          </div>
        </div>

        {/* Rank + points */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="flex items-baseline justify-center gap-1.5">
              <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                #{card.rank}
              </span>
              {delta !== null && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 text-sm font-bold",
                    delta > 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : delta < 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-zinc-400"
                  )}
                  title="مقارنة بترتيبك الأسبوع الماضي"
                >
                  {delta > 0 ? (
                    <TrendingUp size={15} />
                  ) : delta < 0 ? (
                    <TrendingDown size={15} />
                  ) : (
                    <Minus size={15} />
                  )}
                  {delta !== 0 && Math.abs(delta)}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              من {memberCount} طالبًا
            </p>
          </div>

          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {formatPoints(animatedPoints)}
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">نقطة هذا الأسبوع</p>
          </div>
        </div>
      </div>

      {/* The closable gap — the actual call to action */}
      <div className="mt-6">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{headline}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            يُعاد ضبط الدوري خلال {formatTimeLeft(endsAt)}
          </p>
        </div>

        <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className={cn(
              "h-full rounded-full bg-gradient-to-l transition-all duration-700",
              card.zone === "promotion"
                ? "from-emerald-400 to-emerald-600"
                : card.zone === "relegation"
                  ? "from-red-400 to-red-600"
                  : "from-blue-400 to-blue-600"
            )}
            style={{ width: `${Math.round(zoneProgress * 100)}%` }}
          />
        </div>
      </div>

      {/* Where the points came from */}
      <button
        type="button"
        onClick={() => setShowBreakdown((prev) => !prev)}
        className="mt-5 flex w-full items-center justify-between rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        aria-expanded={showBreakdown}
      >
        <span>من أين جاءت نقاطي؟</span>
        <ChevronDown
          size={18}
          className={cn("transition-transform", showBreakdown && "rotate-180")}
        />
      </button>

      {showBreakdown && (
        <div className="mt-3 space-y-2">
          {card.breakdown.map((entry) => {
            const source = POINT_SOURCE_LABELS[entry.source];
            const share = totalBreakdown > 0 ? entry.points / totalBreakdown : 0;

            return (
              <div
                key={entry.source}
                className="rounded-2xl border border-zinc-200 p-3 dark:border-zinc-800"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span aria-hidden>{source.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                        {source.label}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{entry.detail}</p>
                    </div>
                  </div>

                  <span className="shrink-0 text-sm font-bold text-blue-600 dark:text-blue-400">
                    +{formatPoints(entry.points)}
                  </span>
                </div>

                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-blue-500/70"
                    style={{ width: `${Math.round(share * 100)}%` }}
                  />
                </div>
              </div>
            );
          })}

          <p className="px-1 pt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            كل نقطة في متقن تأتي من مذاكرة فعلية — مهمة أنجزتها، دقيقة ركّزت فيها، أو
            اختبار حللته. لا توجد طريقة لجمع النقاط دون مذاكرة.
          </p>
        </div>
      )}
    </section>
  );
};
