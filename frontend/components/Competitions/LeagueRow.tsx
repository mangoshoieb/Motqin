import { Flame } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { formatDays, formatPoints } from "@/app/constants/competition.constants";
import { LeagueMember, LeagueZone } from "@/app/types/competition.types";

const MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

interface LeagueRowProps {
  member: LeagueMember;
  zone: LeagueZone;
}

export const LeagueRow = ({ member, zone }: LeagueRowProps) => {
  const medal = MEDALS[member.rank];

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border px-3 py-2.5 transition sm:gap-4 sm:px-4 sm:py-3",
        member.isCurrentUser
          ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/20 dark:border-blue-500 dark:bg-blue-950/30"
          : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
      )}
    >
      {/* Rank */}
      <div className="w-8 shrink-0 text-center">
        {medal ? (
          <span className="text-xl" aria-label={`المركز ${member.rank}`}>
            {medal}
          </span>
        ) : (
          <span
            className={cn(
              "text-sm font-bold",
              zone === "promotion"
                ? "text-emerald-600 dark:text-emerald-400"
                : zone === "relegation"
                  ? "text-red-500 dark:text-red-400"
                  : "text-zinc-400"
            )}
          >
            {member.rank}
          </span>
        )}
      </div>

      {/* Avatar */}
      <div
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xl dark:bg-zinc-800"
        aria-hidden
      >
        {member.avatarEmoji}
      </div>

      {/* Name + streak */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate font-semibold",
            member.isCurrentUser
              ? "text-blue-700 dark:text-blue-300"
              : "text-zinc-800 dark:text-zinc-200"
          )}
        >
          {member.displayName}
        </p>

        {member.streakDays > 0 && (
          <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
            <Flame size={12} className="text-orange-500" />
            سلسلة {formatDays(member.streakDays)}
          </p>
        )}
      </div>

      {/* Points */}
      <div className="shrink-0 text-left">
        <p
          className={cn(
            "font-bold",
            member.isCurrentUser
              ? "text-blue-700 dark:text-blue-300"
              : "text-zinc-900 dark:text-zinc-100"
          )}
        >
          {formatPoints(member.points)}
        </p>
        <p className="text-[11px] text-zinc-400">نقطة</p>
      </div>
    </div>
  );
};
