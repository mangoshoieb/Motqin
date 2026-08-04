import { cn } from "@/app/lib/utils";
import { TIER_META } from "@/app/constants/competition.constants";
import { LeagueTier } from "@/app/types/competition.types";

interface TierBadgeProps {
  tier: LeagueTier;
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
}

// The tier chip used wherever a league is named — the rank card, the board
// header, and the promotion/relegation hints.
export const TierBadge = ({
  tier,
  size = "md",
  showLabel = true,
  className,
}: TierBadgeProps) => {
  const meta = TIER_META[tier];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white font-bold dark:border-zinc-700 dark:bg-zinc-800",
        size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm",
        meta.accent,
        className
      )}
    >
      <span aria-hidden>{meta.icon}</span>
      {showLabel && <span>الدوري {meta.label}</span>}
    </span>
  );
};
