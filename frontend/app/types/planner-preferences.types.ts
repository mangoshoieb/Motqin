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

export type WeekDay =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

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
export type UnfinishedTaskPolicy =
  | 1 // AutomatedReschedule
  | 2 // UserReschedule
  | 3 // OverworkedNextDay
  | 4; // Tolerate

export type BusyTimesByDay = Record<WeekDay, BusyTimeEntry[]>;

export interface PlannerPreferences {
  minWorkHours: number;
  maxWorkHours: number;
  startSleepTime: string;
  endSleepTime: string;
  pomodoroWorkingMinutes: number;
  pomodoroBreakMinutes: number;
  planFailureDecision: number;
  // busyTimes: BusyTimesByDay;
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
  startSleepTime: "23:00",
  endSleepTime: "07:00",
  pomodoroWorkingMinutes: 90,
  pomodoroBreakMinutes: 5,
  minWorkHours: 1,
  maxWorkHours: 3,
  planFailureDecision: 1,
  // busyTimes: emptyBusyTimes,
};
export interface UpdatePlannerPreferencesRequest {
  minWorkHours: number;
  maxWorkHours: number;
  startSleepTime: string;
  endSleepTime: string;
  pomodoroWorkingMinutes: number;
  pomodoroBreakMinutes: number;
  planFailureDecision: number;
}
