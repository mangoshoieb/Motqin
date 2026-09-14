"use client";

import { useQuery } from "@tanstack/react-query";
import { userPreferencesService } from "@/app/services/user-preferences.service";
import { DEFAULT_PLANNER_PREFERENCES } from "@/app/types/planner-preferences.types";

// The break the execution board shows between study sessions comes from
// GET /user-preferences (pomodoroBreakMinutes). Cached through react-query
// so every board day shares one fetch; falls back to the planner default
// when the user has no saved preferences yet.
export function useBreakMinutes() {
  const { data, isLoading } = useQuery({
    queryKey: ["user-preferences"],
    queryFn: () => userPreferencesService.getPreferences(),
    staleTime: 5 * 60 * 1000,
  });

  return {
    breakMinutes: data?.pomodoroBreakMinutes ?? DEFAULT_PLANNER_PREFERENCES.pomodoroBreakMinutes,
    isLoading,
  };
}
