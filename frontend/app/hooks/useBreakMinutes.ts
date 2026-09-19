"use client";

import { useUserPreferences } from "@/app/hooks/useUserPreferences";
import { DEFAULT_PLANNER_PREFERENCES } from "@/app/types/planner-preferences.types";

// The break the execution board shows between study sessions comes from
// GET /user-preferences (pomodoroBreakMinutes); falls back to the planner
// default when the user has no saved preferences yet.
export function useBreakMinutes() {
  const { data, isLoading } = useUserPreferences();

  return {
    breakMinutes: data?.pomodoroBreakMinutes ?? DEFAULT_PLANNER_PREFERENCES.pomodoroBreakMinutes,
    isLoading,
  };
}
