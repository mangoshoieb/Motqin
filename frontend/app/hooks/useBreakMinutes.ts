"use client";

import { useUserPreferences } from "@/app/hooks/useUserPreferences";
import { DEFAULT_PLANNER_PREFERENCES } from "@/app/types/planner-preferences.types";

// The execution board's session lengths come from the planner preferences
// (GET /user-preferences/planner/basic): pomodoroWorkingMinutes is what a
// newly added session lasts, pomodoroBreakMinutes the break shown between
// sessions. Both fall back to the planner defaults when the user has no
// saved preferences yet.
export function useBreakMinutes() {
  const { data, isLoading } = useUserPreferences();

  return {
    sessionMinutes:
      data?.pomodoroWorkingMinutes ?? DEFAULT_PLANNER_PREFERENCES.pomodoroWorkingMinutes,
    breakMinutes: data?.pomodoroBreakMinutes ?? DEFAULT_PLANNER_PREFERENCES.pomodoroBreakMinutes,
    isLoading,
  };
}
