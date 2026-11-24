"use client";

import { useQuery } from "@tanstack/react-query";
import { studyPlansService, UserPerformanceDay } from "@/app/services/motqin";
import { dateOnly } from "@/app/lib/study-plan";
import { useAuthKind } from "./useAuthKind";

// The server's own numbers for each day — completed sessions and the
// minutes they add up to — keyed by yyyy-MM-dd, for the week cards and the
// day board.
//
// Two sources:
// - GET /study-plan/user-performance-by-range: any days, but a plan feature
//   (PerformanceRange); plans without it answer 403 not_in_plan.
// - GET /study-plan/user-performance: today only, on every plan. It wins for
//   today, so today's numbers are right whatever the plan.
// A day missing from both falls back to what the caller works out from the
// day's own sessions (completed ones only).
//
// Keys start with "study-plans", so whatever refreshes the plans (a session
// ending, a task toggled) refreshes these too. Guests skip both.
export function usePlannerPerformance(startDate: string | undefined, endDate: string | undefined) {
  const registered = useAuthKind() === "user";
  const today = dateOnly(new Date());
  const hasRange = !!startDate && !!endDate;
  const includesToday = hasRange && startDate! <= today && today <= endDate!;

  const range = useQuery({
    queryKey: ["study-plans", "performance", startDate, endDate],
    queryFn: () => studyPlansService.performanceByRange(startDate!, endDate!),
    enabled: registered && hasRange,
    retry: false,
    placeholderData: (previous) => previous,
  });

  const todayQuery = useQuery({
    queryKey: ["study-plans", "performance", "today", today],
    queryFn: () => studyPlansService.performanceToday(),
    enabled: registered && includesToday,
    retry: false,
  });

  const byDate = new Map<string, UserPerformanceDay>();
  for (const day of range.data?.days ?? []) {
    const date = day.date.slice(0, 10);
    // Placeholder data can still be the previous range while the new one loads.
    if (hasRange && date >= startDate! && date <= endDate!) byDate.set(date, day);
  }
  if (includesToday && todayQuery.data) byDate.set(today, { ...todayQuery.data, date: today });
  return byDate;
}
