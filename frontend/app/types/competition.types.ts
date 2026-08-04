// Mock-backed for now (see app/data/competitions.ts + app/hooks/useCompetitions.ts)
// but shaped against the models the backend already defines: `Challenge` maps
// onto Motqin/Models/Competition.cs (CompetitionID, Title, Description,
// StartDate, EndDate) and `CompetitionEntry` onto Motqin/Models/CompetitionEntry.cs
// (EntryID, CompetitionID, UserID, Score, Rank). Everything the backend does
// NOT model yet — leagues, tiers, streaks, achievements, the points breakdown —
// is marked below so it's obvious what still needs a server-side home.
//
// There is no CompetitionsController yet, so nothing here hits the network.

// ---------------------------------------------------------------------------
// League — weekly cohort of ~30 students of a similar grade level.
// Not modeled server-side yet: needs a League + LeagueMembership table, or a
// derived "week bucket" over CompetitionEntry.
// ---------------------------------------------------------------------------

export type LeagueTier = "bronze" | "silver" | "gold" | "platinum" | "diamond";

export type LeagueZone = "promotion" | "safe" | "relegation";

export interface LeagueMember {
  userId: string;
  displayName: string;
  avatarEmoji: string; // stand-in until profile images are uploadable
  points: number;
  rank: number;
  streakDays: number;
  isCurrentUser: boolean;
}

export interface League {
  leagueId: string;
  tier: LeagueTier;
  weekLabel: string;
  endsAt: string; // ISO — the weekly reset
  promoteCount: number; // top N promote to the next tier
  relegateCount: number; // bottom N drop a tier (always 0 in the lowest tier)
  members: LeagueMember[];
}

// ---------------------------------------------------------------------------
// Points — the single currency. Every source below already exists as a real
// signal in the app (DayOutputs in execution-board.types.ts), so the
// leaderboard is a read-out of studying rather than a separate game.
// ---------------------------------------------------------------------------

export type PointSource = "tasks" | "focus" | "quiz" | "fullDay" | "streak";

export interface PointsBreakdownEntry {
  source: PointSource;
  points: number;
  detail: string; // human-readable "how you earned it", e.g. "12 مهمة منجزة"
}

export interface MyRankCard {
  displayName: string;
  avatarEmoji: string;
  tier: LeagueTier;
  weeklyPoints: number;
  rank: number;
  previousRank: number | null; // null on a student's first week
  streakDays: number;
  zone: LeagueZone;
  pointsToNextRank: number | null; // null when already 1st
  breakdown: PointsBreakdownEntry[];
  privateMode: boolean; // opt out of appearing on other students' boards
}

// ---------------------------------------------------------------------------
// Challenges — time-boxed events. This is the part that maps 1:1 onto the
// existing backend Competition/CompetitionEntry models.
// ---------------------------------------------------------------------------

// "official" = run by Motqin, open to everyone. "duel" = a head-to-head a
// student starts against one friend. Both are Competition rows; only the
// participant count differs.
export type ChallengeKind = "official" | "duel";

// What the Score column actually measures for this competition. Not modeled
// server-side yet — Competition has no metric column.
export type ChallengeMetric = "quiz" | "studyHours" | "tasks";

export type ChallengeRewardKind = "badge" | "subscription" | "cash";

export type ChallengeStatus = "open" | "joined" | "ended";

export interface ChallengeReward {
  kind: ChallengeRewardKind;
  label: string;
}

// Mirrors Motqin/Models/CompetitionEntry.cs.
export interface CompetitionEntry {
  entryId: number;
  competitionId: number;
  userId: string;
  score: number;
  rank: number;
}

export interface DuelOpponent {
  displayName: string;
  avatarEmoji: string;
  score: number;
}

export interface Challenge {
  competitionId: number;
  title: string;
  description: string;
  startDate: string; // ISO
  endDate: string; // ISO

  kind: ChallengeKind;
  metric: ChallengeMetric;
  subjectName?: string;
  participants: number;
  rewards: ChallengeReward[];
  status: ChallengeStatus;

  myEntry?: CompetitionEntry; // present once joined
  opponent?: DuelOpponent; // duels only
}

// ---------------------------------------------------------------------------
// Achievements — permanent, personal, unlosable. The counterweight to the
// league: a bad week costs you rank, never a badge.
// Not modeled server-side yet.
// ---------------------------------------------------------------------------

export type AchievementCategory = "discipline" | "focus" | "mastery" | "social";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  unlockedAt: string | null; // null while still locked
  progress: number; // 0..1, for the locked-state progress bar
  progressLabel: string; // e.g. "72 / 100 ساعة"
}
