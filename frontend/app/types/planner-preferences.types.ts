// Local-only for now (see app/hooks/usePlannerPreferences.ts) — there is no
// GET endpoint yet that returns saved planner preferences, and fields like
// maxDailyStudyHours/breakIntervalMinutes have no backend field at all.
// sleepStart/sleepEnd and busyTimes are the client shape for what would
// eventually round-trip through POST /api/planner/times (FreetimeDto) —
// that endpoint models *free* time, so a real integration would need to
// submit the computed complement of sleep+busy time, not these fields
// directly.

export interface TimeRange {
  start: string; // "HH:MM", 24h
  end: string; // "HH:MM", 24h
}

export type WeekDay = "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday";

export const WEEKDAYS: { key: WeekDay; label: string }[] = [
  { key: "sunday", label: "الأحد" },
  { key: "monday", label: "الاثنين" },
  { key: "tuesday", label: "الثلاثاء" },
  { key: "wednesday", label: "الأربعاء" },
  { key: "thursday", label: "الخميس" },
  { key: "friday", label: "الجمعة" },
  { key: "saturday", label: "السبت" },
];

export interface BusyTimeEntry {
  id: string;
  allDay: boolean;
  range: TimeRange; // ignored when allDay is true, but always present so toggling back is seamless
}

// How an unfinished task gets rescheduled. Captured as a preference here;
// actually enforcing it (an automatic end-of-day/week sweep that searches
// for free slots against busyTimes) is separate follow-up work tied to the
// existing POST /planner/generate-schedule endpoint.
export type UnfinishedTaskPolicy = "next-week" | "same-week" | "hybrid";

export type BusyTimesByDay = Record<WeekDay, BusyTimeEntry[]>;

export interface PlannerPreferences {
  sleepStart: string; // "HH:MM"
  sleepEnd: string; // "HH:MM"
  // Doubles as both the default session length and the Pomodoro work
  // interval before a break — these were two separate fields at first, but
  // they're the same number in practice, so they're merged into one.
  breakIntervalMinutes: number;
  breakDurationMinutes: number;
  maxDailyStudyHours: number;
  unfinishedTaskPolicy: UnfinishedTaskPolicy;
  busyTimes: BusyTimesByDay;
}

const emptyBusyTimes: BusyTimesByDay = {
  sunday: [],
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
};

export const DEFAULT_PLANNER_PREFERENCES: PlannerPreferences = {
  sleepStart: "23:00",
  sleepEnd: "07:00",
  breakIntervalMinutes: 45,
  breakDurationMinutes: 10,
  maxDailyStudyHours: 6,
  unfinishedTaskPolicy: "hybrid",
  busyTimes: emptyBusyTimes,
};
