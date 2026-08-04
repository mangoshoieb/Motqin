import {
  AchievementCategory,
  ChallengeMetric,
  ChallengeRewardKind,
  LeagueTier,
  PointSource,
} from "../types/competition.types";

// Expected paths — there is no CompetitionsController on the backend yet, so
// nothing calls these. Kept here so wiring the real endpoints later is a
// matter of pointing the hooks' queryFn at a service that uses them.
export const COMPETITION_API_ROUTES = {
  MY_CARD: "/competitions/my-card",
  MY_LEAGUE: "/competitions/league",
  CHALLENGES: "/competitions",
  CHALLENGE_BY_ID: (id: number) => `/competitions/${id}`,
  JOIN_CHALLENGE: (id: number) => `/competitions/${id}/entries`,
  CHALLENGE_LEADERBOARD: (id: number) => `/competitions/${id}/entries`,
  ACHIEVEMENTS: "/competitions/achievements",
};

// ---------------------------------------------------------------------------
// Points engine — the single source of truth for what studying is worth.
// Every rule below reads off a signal the app already produces (DayOutputs:
// tasksCompleted, totalStudyMinutes, totalSessions, quizAccuracy), so points
// can only be earned by actually studying.
// ---------------------------------------------------------------------------

export const POINT_RULES = {
  PER_TASK: 15,
  PER_FOCUS_BLOCK: 10,
  FOCUS_BLOCK_MINUTES: 25,
  QUIZ_ACCURACY_MULTIPLIER: 30, // accuracy (0..1) × 30 → max 30 per quiz
  FULL_DAY_BONUS: 40, // every task on a day completed
  STREAK_BONUS_PER_DAY: 5, // capped, see STREAK_BONUS_CAP_DAYS
  STREAK_BONUS_CAP_DAYS: 10,
} as const;

// Shown in the "كيف أحسب نقاطي؟" panel, in display order.
export const POINT_SOURCE_LABELS: Record<
  PointSource,
  { label: string; rule: string; icon: string }
> = {
  tasks: {
    label: "مهام المخطط",
    rule: `${POINT_RULES.PER_TASK} نقاط لكل مهمة منجزة`,
    icon: "✅",
  },
  focus: {
    label: "دقائق التركيز",
    rule: `${POINT_RULES.PER_FOCUS_BLOCK} نقاط لكل ${POINT_RULES.FOCUS_BLOCK_MINUTES} دقيقة تركيز`,
    icon: "⏱️",
  },
  quiz: {
    label: "دقة الاختبارات",
    rule: `حتى ${POINT_RULES.QUIZ_ACCURACY_MULTIPLIER} نقطة حسب نسبة الإجابات الصحيحة`,
    icon: "🎯",
  },
  fullDay: {
    label: "يوم مكتمل",
    rule: `${POINT_RULES.FULL_DAY_BONUS} نقطة عند إنهاء كل مهام اليوم`,
    icon: "🌟",
  },
  streak: {
    label: "السلسلة",
    rule: `${POINT_RULES.STREAK_BONUS_PER_DAY} نقاط لكل يوم متتالٍ (بحد أقصى ${POINT_RULES.STREAK_BONUS_CAP_DAYS} أيام)`,
    icon: "🔥",
  },
};

// ---------------------------------------------------------------------------
// League tiers, lowest → highest. Order matters: TIER_ORDER drives promotion
// and relegation, and the lowest tier never relegates (nobody gets pushed out
// of the bottom — a bad week should cost rank, not push a student off the map).
// ---------------------------------------------------------------------------

export const TIER_ORDER: LeagueTier[] = [
  "bronze",
  "silver",
  "gold",
  "platinum",
  "diamond",
];

export const TIER_META: Record<
  LeagueTier,
  { label: string; icon: string; accent: string; ring: string; glow: string }
> = {
  bronze: {
    label: "برونزي",
    icon: "🥉",
    accent: "text-amber-700 dark:text-amber-500",
    ring: "from-amber-600/80 to-amber-800/80",
    glow: "shadow-amber-700/20",
  },
  silver: {
    label: "فضي",
    icon: "🥈",
    accent: "text-zinc-500 dark:text-zinc-300",
    ring: "from-zinc-400/80 to-zinc-600/80",
    glow: "shadow-zinc-500/20",
  },
  gold: {
    label: "ذهبي",
    icon: "🥇",
    accent: "text-yellow-600 dark:text-yellow-400",
    ring: "from-yellow-400/80 to-amber-600/80",
    glow: "shadow-yellow-500/25",
  },
  platinum: {
    label: "بلاتيني",
    icon: "💠",
    accent: "text-sky-600 dark:text-sky-400",
    ring: "from-sky-400/80 to-cyan-600/80",
    glow: "shadow-sky-500/25",
  },
  diamond: {
    label: "ألماسي",
    icon: "💎",
    accent: "text-violet-600 dark:text-violet-400",
    ring: "from-violet-400/80 to-fuchsia-600/80",
    glow: "shadow-violet-500/25",
  },
};

export const nextTier = (tier: LeagueTier): LeagueTier | null => {
  const i = TIER_ORDER.indexOf(tier);
  return i >= 0 && i < TIER_ORDER.length - 1 ? TIER_ORDER[i + 1] : null;
};

export const previousTier = (tier: LeagueTier): LeagueTier | null => {
  const i = TIER_ORDER.indexOf(tier);
  return i > 0 ? TIER_ORDER[i - 1] : null;
};

// How many rows above and below the student are shown before the board
// collapses. Showing "#847 of 12,000" is the fastest way to make someone quit;
// a student only ever needs to see who they can realistically catch.
export const LEAGUE_VISIBLE_NEIGHBOURS = 4;

// ---------------------------------------------------------------------------
// Challenges
// ---------------------------------------------------------------------------

export const CHALLENGE_METRIC_META: Record<
  ChallengeMetric,
  { label: string; unit: string; icon: string }
> = {
  quiz: { label: "دقة الاختبارات", unit: "نقطة", icon: "🎯" },
  studyHours: { label: "ساعات المذاكرة", unit: "ساعة", icon: "⏱️" },
  tasks: { label: "المهام المنجزة", unit: "مهمة", icon: "✅" },
};

export const REWARD_META: Record<
  ChallengeRewardKind,
  { icon: string; className: string }
> = {
  badge: {
    icon: "🏅",
    className:
      "border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300",
  },
  subscription: {
    icon: "🎁",
    className:
      "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
  },
  cash: {
    icon: "💰",
    className:
      "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
};

export const ACHIEVEMENT_CATEGORY_LABELS: Record<AchievementCategory, string> = {
  discipline: "الانضباط",
  focus: "التركيز",
  mastery: "الإتقان",
  social: "المشاركة",
};

// ---------------------------------------------------------------------------
// Formatting helpers — shared so the league board, the rank card and the
// challenge cards all phrase time and numbers identically.
// ---------------------------------------------------------------------------

// Latin digits with thousands separators, matching the numerals used
// everywhere else in the app (the planner, the execution board, the pricing
// pages). Arabic-Indic digits here would leave the UI mixing ٧٠ and 5 in the
// same sentence, since plain interpolated numbers stay Latin.
export const formatPoints = (points: number) => points.toLocaleString("en-US");

// Arabic counts its nouns differently at 1, 2, 3–10 and 11+, so "7 يوم" is
// wrong where "7 أيام" is right. Used for both streaks and countdowns.
export const formatDays = (days: number) => {
  if (days === 1) return "يوم واحد";
  if (days === 2) return "يومان";
  if (days <= 10) return `${days} أيام`;
  return `${days} يومًا`;
};

// "3 أيام" / "12 ساعة" / "انتهت" — used for both the weekly reset and the
// challenge countdowns.
export const formatTimeLeft = (endsAt: string, now: Date = new Date()) => {
  const diffMs = new Date(endsAt).getTime() - now.getTime();
  if (diffMs <= 0) return "انتهت";

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return "أقل من ساعة";
  if (hours < 24) return `${hours} ساعة`;

  return formatDays(Math.floor(hours / 24));
};
