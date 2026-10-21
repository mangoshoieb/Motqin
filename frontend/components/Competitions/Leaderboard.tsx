"use client";

import { AlertCircle, RotateCcw, Trophy } from "lucide-react";
import { cn } from "@/app/lib/utils";
import Skeleton from "@/components/ui/Skeleton";
import UserAvatar from "@/components/ui/UserAvatar";

// One student on a leaderboard, already formatted for display — each
// competition maps its own row shape onto this (see CompetitionBoards).
export interface LeaderboardRowView {
  userId: string;
  rank: number;
  fullName: string;
  photoUrl: string | null;
  subtitle: string; // grade and stage
  value: string; // the number the board is ranked by
  valueUnit: string;
  details?: string[]; // secondary stats, shown as small chips
}

interface LeaderboardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  // Anything else the intro card should carry (e.g. the week it covers).
  extra?: React.ReactNode;
  rows: LeaderboardRowView[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  currentUserId?: string;
  emptyText: string;
  // Shown in the intro card when the student isn't on the board.
  notRankedText: string;
}

const MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

const PODIUM_STYLE: Record<number, { block: string; ring: string; lift: string }> = {
  1: {
    block: "from-amber-300 to-amber-500",
    ring: "ring-amber-400",
    lift: "sm:-translate-y-4",
  },
  2: {
    block: "from-zinc-200 to-zinc-400 dark:from-zinc-500 dark:to-zinc-700",
    ring: "ring-zinc-300 dark:ring-zinc-500",
    lift: "",
  },
  3: {
    block: "from-orange-300 to-orange-500",
    ring: "ring-orange-300",
    lift: "",
  },
};

const YouChip = () => (
  <span className="shrink-0 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
    أنت
  </span>
);

function PodiumCard({ row, isMe }: { row: LeaderboardRowView; isMe: boolean }) {
  const style = PODIUM_STYLE[row.rank];

  return (
    <div
      className={cn(
        "flex w-1/3 min-w-0 flex-col items-center gap-2 rounded-3xl border bg-white px-3 pb-4 pt-5 text-center shadow-sm transition dark:bg-zinc-900",
        style.lift,
        isMe
          ? "border-blue-500 ring-2 ring-blue-500/20"
          : "border-zinc-200 dark:border-zinc-800",
      )}
    >
      <div className="relative">
        <UserAvatar
          name={row.fullName}
          photoUrl={row.photoUrl}
          size={row.rank === 1 ? 72 : 60}
          className={cn("ring-4", style.ring)}
        />
        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-2xl" aria-label={`المركز ${row.rank}`}>
          {MEDALS[row.rank]}
        </span>
      </div>

      <div className="mt-2 flex w-full min-w-0 items-center justify-center gap-1.5">
        <p className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-100">{row.fullName}</p>
        {isMe && <YouChip />}
      </div>
      <p className="-mt-1.5 truncate text-[11px] text-zinc-500 dark:text-zinc-400">{row.subtitle}</p>

      <div
        className={cn(
          "mt-1 w-full rounded-2xl bg-gradient-to-b px-2 py-2 text-white shadow-inner",
          style.block,
        )}
      >
        <p className="text-xl font-bold tabular-nums leading-none">{row.value}</p>
        <p className="mt-1 text-[11px] font-semibold opacity-90">{row.valueUnit}</p>
      </div>
    </div>
  );
}

function LeaderRow({ row, isMe }: { row: LeaderboardRowView; isMe: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border px-3 py-2.5 transition sm:gap-4 sm:px-4 sm:py-3",
        isMe
          ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/20 dark:border-blue-500 dark:bg-blue-950/30"
          : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700",
      )}
    >
      <span className="w-7 shrink-0 text-center text-sm font-bold tabular-nums text-zinc-400">{row.rank}</span>
      <UserAvatar name={row.fullName} photoUrl={row.photoUrl} size={40} />

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-1.5">
          <p
            className={cn(
              "truncate font-semibold",
              isMe ? "text-blue-700 dark:text-blue-300" : "text-zinc-800 dark:text-zinc-200",
            )}
          >
            {row.fullName}
          </p>
          {isMe && <YouChip />}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-zinc-500 dark:text-zinc-400">
          <span>{row.subtitle}</span>
          {row.details?.map((detail) => (
            <span key={detail} className="rounded-full bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">
              {detail}
            </span>
          ))}
        </div>
      </div>

      <div className="shrink-0 text-left">
        <p
          className={cn(
            "text-lg font-bold tabular-nums leading-none",
            isMe ? "text-blue-700 dark:text-blue-300" : "text-zinc-900 dark:text-zinc-100",
          )}
        >
          {row.value}
        </p>
        <p className="mt-1 text-[11px] text-zinc-400">{row.valueUnit}</p>
      </div>
    </div>
  );
}

// A competition's board: an intro card (what it ranks, and where the student
// stands), the top three on a podium, then everyone else in rank order.
export const Leaderboard = ({
  icon,
  title,
  description,
  extra,
  rows,
  isLoading,
  isError,
  onRetry,
  currentUserId,
  emptyText,
  notRankedText,
}: LeaderboardProps) => {
  const me = currentUserId ? rows?.find((row) => row.userId === currentUserId) : undefined;
  const podium = (rows ?? []).filter((row) => row.rank <= 3).sort((a, b) => a.rank - b.rank);
  // Second place on the right, first in the middle, third on the left.
  const podiumOrder = [podium[1], podium[0], podium[2]].filter(Boolean) as LeaderboardRowView[];
  const rest = (rows ?? []).filter((row) => row.rank > 3);

  return (
    <div className="flex flex-col gap-4" dir="rtl">
      {/* What this board ranks, and where the student stands on it */}
      <div className="flex flex-wrap items-center gap-4 rounded-3xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-5">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-2xl dark:bg-blue-950/40" aria-hidden>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100">{title}</h3>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
          {extra}
        </div>
        {!isLoading && !isError && rows && rows.length > 0 && (
          <div
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold",
              me
                ? "bg-blue-600 text-white"
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
            )}
          >
            <Trophy size={16} aria-hidden />
            {me ? `أنت في المركز #${me.rank} · ${me.value} ${me.valueUnit}` : notRankedText}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-52 w-full rounded-3xl" />
            ))}
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-zinc-300 bg-white/60 px-4 py-10 text-center dark:border-zinc-700 dark:bg-zinc-900/60">
          <AlertCircle size={28} className="text-red-500" />
          <p className="text-sm text-zinc-600 dark:text-zinc-300">تعذر تحميل الترتيب</p>
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
          >
            <RotateCcw size={14} />
            إعادة المحاولة
          </button>
        </div>
      ) : !rows || rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-zinc-300 bg-white/60 px-4 py-10 text-center dark:border-zinc-700 dark:bg-zinc-900/60">
          <span className="text-3xl" aria-hidden>
            {icon}
          </span>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">{emptyText}</p>
        </div>
      ) : (
        <>
          <div className="flex items-end justify-center gap-2 pt-4 sm:gap-4">
            {podiumOrder.map((row) => (
              <PodiumCard key={row.userId} row={row} isMe={row.userId === currentUserId} />
            ))}
          </div>

          {rest.length > 0 && (
            <div className="flex flex-col gap-2">
              {rest.map((row) => (
                <LeaderRow key={row.userId} row={row} isMe={row.userId === currentUserId} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
