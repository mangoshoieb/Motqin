"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import { useGetSubjects } from "./useGetSubjects";
import { motqinService } from "../services/lesson.service";
import {
  SpacedRepetitionPlan,
  SpacedRepetitionPlanStatus,
  spacedRepetitionService,
} from "../services/spaced-repetition.service";
import { dateOnly } from "../lib/study-plan";

// How far back the missed side looks, and how far ahead the coming side.
export type MissedRange = "all" | "week" | "month";
export type ComingRange = "today" | "week" | "month" | "all";

const RANGE_DAYS = { week: 7, month: 30 } as const;

// A spaced-repetition plan as the subjects page's review section shows it.
export interface ReviewOverviewItem {
  id: number;
  subjectId: number;
  lessonId: number;
  category: string;
  repetitionNumber: number;
  // YYYY-MM-DD of the next review, and how many days that is from today
  // (negative = overdue).
  reviewDay: string;
  daysFromToday: number;
  subjectName?: string;
  lessonTitle?: string;
  // The most recent past session's score, when there is one.
  lastScore?: { correct: number; total: number };
}

const addDays = (day: string, days: number) => {
  const date = new Date(`${day}T00:00:00`);
  date.setDate(date.getDate() + days);
  return dateOnly(date);
};

const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);

// The calendar day of the review exactly as the server wrote it. The filter
// windows are applied server-side on that same date, so converting to local
// time first could move a review across midnight and out of its window.
const reviewDayOf = (plan: SpacedRepetitionPlan) => plan.nextReviewDate.slice(0, 10);

const lastScoreOf = (plan: SpacedRepetitionPlan) => {
  const last = plan.previousSessions?.at(-1);
  return last && last.totalQuestionsCount > 0
    ? { correct: last.correctAnswersCount, total: last.totalQuestionsCount }
    : undefined;
};

// Missed reviews up to today (oldest window first), and coming ones from
// today on — each side its own request, so each has its own range filter.
export const useReviewOverview = ({
  missedRange,
  comingRange,
}: {
  missedRange: MissedRange;
  comingRange: ComingRange;
}) => {
  const today = dateOnly(new Date());

  const missedQuery = useQuery({
    queryKey: ["spaced-repetition-plans", "missed", missedRange, today],
    queryFn: () =>
      spacedRepetitionService.filterPlans({
        status: SpacedRepetitionPlanStatus.Missed,
        endDate: today,
        ...(missedRange !== "all" && { startDate: addDays(today, -RANGE_DAYS[missedRange]) }),
      }),
  });

  const comingQuery = useQuery({
    queryKey: ["spaced-repetition-plans", "coming", comingRange, today],
    queryFn: () =>
      spacedRepetitionService.filterPlans({
        status: SpacedRepetitionPlanStatus.Coming,
        startDate: today,
        ...(comingRange === "today" && { endDate: today }),
        ...((comingRange === "week" || comingRange === "month") && {
          endDate: addDays(today, RANGE_DAYS[comingRange]),
        }),
      }),
  });

  const { data: subjects } = useGetSubjects();

  // Lesson titles, one list per subject that has a review — the same cache
  // entries the subject pages use (useGetLessons).
  const plans = [...(missedQuery.data?.items ?? []), ...(comingQuery.data?.items ?? [])];
  const subjectIds = [...new Set(plans.map((plan) => plan.subjectId))];
  const lessonTitles = useQueries({
    queries: subjectIds.map((subjectId) => ({
      queryKey: ["lessons", String(subjectId)],
      queryFn: () => motqinService.getLessons(String(subjectId)),
    })),
    combine: (results) => {
      const titles = new Map<number, string>();
      for (const result of results) {
        for (const lesson of result.data?.lessons ?? []) titles.set(lesson.lessonId, lesson.title);
      }
      return titles;
    },
  });

  const toItem = (plan: SpacedRepetitionPlan): ReviewOverviewItem => {
    const reviewDay = reviewDayOf(plan);
    return {
      id: plan.id,
      subjectId: plan.subjectId,
      lessonId: plan.lessonId,
      category: plan.category,
      repetitionNumber: plan.repetitionNumber,
      reviewDay,
      daysFromToday: daysBetween(today, reviewDay),
      subjectName: subjects?.find((s) => s.subjectID === plan.subjectId)?.name,
      lessonTitle: lessonTitles.get(plan.lessonId),
      lastScore: lastScoreOf(plan),
    };
  };

  return {
    // The API sends each side soonest first; for missed that's the most
    // overdue first, which is the order to catch up in.
    missed: (missedQuery.data?.items ?? []).map(toItem),
    coming: (comingQuery.data?.items ?? []).map(toItem),
    isLoading: missedQuery.isLoading || comingQuery.isLoading,
    isError: missedQuery.isError || comingQuery.isError,
    refetch: () => {
      missedQuery.refetch();
      comingQuery.refetch();
    },
  };
};
