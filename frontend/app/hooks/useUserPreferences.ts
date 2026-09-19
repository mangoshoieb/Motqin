"use client";

import { useQuery } from "@tanstack/react-query";
import { userPreferencesService } from "@/app/services/user-preferences.service";

// GET /user-preferences, cached through react-query so the planner board,
// the execution board and anything else that needs a limit share one fetch.
// `data` is null while the user hasn't saved preferences yet.
export function useUserPreferences() {
  return useQuery({
    queryKey: ["user-preferences"],
    queryFn: () => userPreferencesService.getPreferences(),
    staleTime: 5 * 60 * 1000,
  });
}

// The daily study-hours window from the preferences, or null until they're
// loaded / when none are saved.
export function useWorkHourLimits() {
  const { data, isLoading } = useUserPreferences();
  const limits =
    data && data.maxWorkHours > 0 ? { min: data.minWorkHours, max: data.maxWorkHours } : null;
  return { limits, isLoading };
}
