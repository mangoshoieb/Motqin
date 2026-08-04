"use client";

import { Users, Swords, Check } from "lucide-react";
import { cn } from "@/app/lib/utils";
import {
  CHALLENGE_METRIC_META,
  REWARD_META,
  formatPoints,
  formatTimeLeft,
} from "@/app/constants/competition.constants";
import { Challenge } from "@/app/types/competition.types";

interface ChallengeCardProps {
  challenge: Challenge;
  onJoin: (competitionId: number) => void;
  isJoining: boolean;
}

export const ChallengeCard = ({ challenge, onJoin, isJoining }: ChallengeCardProps) => {
  const metric = CHALLENGE_METRIC_META[challenge.metric];
  const isDuel = challenge.kind === "duel";
  const hasEnded = challenge.status === "ended";
  const isJoined = challenge.status === "joined";

  return (
    <article
      className={cn(
        "flex flex-col rounded-3xl border bg-white p-5 shadow-sm transition dark:bg-zinc-900",
        hasEnded
          ? "border-zinc-200 opacity-75 dark:border-zinc-800"
          : "border-zinc-200 hover:border-blue-300 hover:shadow-md dark:border-zinc-800 dark:hover:border-blue-800"
      )}
      dir="rtl"
    >
      {/* Header: title + countdown */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {isDuel ? <Swords size={12} /> : <span aria-hidden>{metric.icon}</span>}
              {isDuel ? "تحدٍ ثنائي" : metric.label}
            </span>

            {challenge.subjectName && (
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                {challenge.subjectName}
              </span>
            )}
          </div>

          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {challenge.title}
          </h3>
        </div>

        <div className="shrink-0 text-left">
          <p
            className={cn(
              "text-sm font-bold",
              hasEnded ? "text-zinc-400" : "text-orange-600 dark:text-orange-400"
            )}
          >
            {formatTimeLeft(challenge.endDate)}
          </p>
          {!hasEnded && <p className="text-[11px] text-zinc-400">متبقية</p>}
        </div>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {challenge.description}
      </p>

      {/* Duel scoreboard — the whole point of a duel is the head-to-head */}
      {isDuel && challenge.opponent && challenge.myEntry && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
          <DuelSide
            name="أنت"
            emoji="🎯"
            score={challenge.myEntry.score}
            unit={metric.unit}
            winning={challenge.myEntry.score >= challenge.opponent.score}
          />
          <span className="shrink-0 text-xs font-bold text-zinc-400">مقابل</span>
          <DuelSide
            name={challenge.opponent.displayName}
            emoji={challenge.opponent.avatarEmoji}
            score={challenge.opponent.score}
            unit={metric.unit}
            winning={challenge.opponent.score > challenge.myEntry.score}
          />
        </div>
      )}

      {/* My standing in an official competition. Deliberately withheld until
          the student has actually scored — telling someone they're last the
          second they join is the fastest way to make them leave. */}
      {!isDuel && challenge.myEntry && (
        <div className="mt-4 flex items-center justify-between rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2.5 dark:border-blue-900 dark:bg-blue-950/30">
          {challenge.myEntry.score > 0 ? (
            <>
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                ترتيبك الحالي #{challenge.myEntry.rank}
              </span>
              <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                {formatPoints(challenge.myEntry.score)} {metric.unit}
              </span>
            </>
          ) : (
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
              أنت مشترك — يبدأ ترتيبك بالظهور بعد أول نقاطك
            </span>
          )}
        </div>
      )}

      {/* Rewards */}
      <div className="mt-4 flex flex-wrap gap-2">
        {challenge.rewards.map((reward) => (
          <span
            key={reward.label}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
              REWARD_META[reward.kind].className
            )}
          >
            <span aria-hidden>{REWARD_META[reward.kind].icon}</span>
            {reward.label}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <Users size={14} />
          {formatPoints(challenge.participants)} مشارك
        </span>

        {hasEnded ? (
          <span className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            انتهى
          </span>
        ) : isJoined ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
            <Check size={15} />
            مشترك
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onJoin(challenge.competitionId)}
            disabled={isJoining}
            className="rounded-full bg-blue-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isJoining ? "جارٍ الانضمام…" : "انضم للمسابقة"}
          </button>
        )}
      </div>
    </article>
  );
};

const DuelSide = ({
  name,
  emoji,
  score,
  unit,
  winning,
}: {
  name: string;
  emoji: string;
  score: number;
  unit: string;
  winning: boolean;
}) => (
  <div className="flex min-w-0 flex-1 items-center gap-2">
    <span className="text-xl" aria-hidden>
      {emoji}
    </span>
    <div className="min-w-0">
      <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{name}</p>
      <p
        className={cn(
          "text-sm font-bold",
          winning ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500"
        )}
      >
        {formatPoints(score)} {unit}
      </p>
    </div>
  </div>
);
