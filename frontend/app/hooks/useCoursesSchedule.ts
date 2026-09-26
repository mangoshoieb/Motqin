"use client";

import { useQuery } from "@tanstack/react-query";
import { courseSchedulesService } from "@/app/services/motqin";

/**
 * GET /user-preferences/planner/validate-courses-schedule — whether every
 * subject in the user's curriculum has its lesson times on the weekly
 * schedule. The AI planner can't lay out a week around lessons it doesn't
 * know about, so the intro card sends the user back to the settings page
 * until this comes back complete.
 */
export function useCoursesScheduleValidation() {
  const { data, isLoading } = useQuery({
    queryKey: ["courses-schedule-validation"],
    queryFn: () => courseSchedulesService.validate(),
    staleTime: 5 * 60 * 1000,
  });

  return {
    // Until it has loaded, assume complete: the gate ahead of it is the
    // preferences one, and a slow request shouldn't flash a warning.
    isComplete: data?.isComplete ?? true,
    totalSubjects: data?.totalSubjects ?? 0,
    scheduledSubjectsCount: data?.scheduledSubjectsCount ?? 0,
    missingCount: Math.max(0, (data?.totalSubjects ?? 0) - (data?.scheduledSubjectsCount ?? 0)),
    isLoading,
  };
}
