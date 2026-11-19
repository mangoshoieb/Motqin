"use client";

import { useQuery } from "@tanstack/react-query";
import { teacherHomeService } from "../services/teacher-home.service";

export const TEACHER_ALERTS_QUERY_KEY = ["teacher-home", "alerts"] as const;

// Student alerts for the teacher's home page (mock data until the API lands).
export function useTeacherAlerts(enabled = true) {
  return useQuery({
    queryKey: TEACHER_ALERTS_QUERY_KEY,
    queryFn: teacherHomeService.getAlerts,
    enabled,
    staleTime: 60 * 1000,
  });
}
