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
import { localDayOf } from "../lib/review-dates";

// Every missed review (however long ago — it's still owed), and coming
// ones for today or the next 7 days. Later ones are on the full review
// table.
export type ComingRange = "today" | "week";

const WINDOW_DAYS = 7;

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

// The review's day in the student's local time. nextReviewDate is UTC, and
// the filter now reads its date windows as days in the student's country,
// so the local day is the one that matches (a review at 00:30 Cairo time is
// 22:30 UTC the day before).
const reviewDayOf = (plan: SpacedRepetitionPlan) => localDayOf(plan.nextReviewDate);

const lastScoreOf = (plan: SpacedRepetitionPlan) => {
  const last = plan.previousSessions?.at(-1);
  return last && last.totalQuestionsCount > 0
    ? { correct: last.correctAnswersCount, total: last.totalQuestionsCount }
    : undefined;
};

// All missed reviews up to today (most overdue first), and coming ones
// from today on — each side its own request, so each has its own window.
export const useReviewOverview = ({ comingRange }: { comingRange: ComingRange }) => {
  const today = dateOnly(new Date());

  const missedQuery = useQuery({
    queryKey: ["spaced-repetition-plans", "missed", today],
    queryFn: () =>
      // No startDate: a review missed weeks ago is still owed.
      spacedRepetitionService.filterPlans({
        status: SpacedRepetitionPlanStatus.Missed,
        endDate: today,
      }),
  });

  const comingQuery = useQuery({
    queryKey: ["spaced-repetition-plans", "coming", comingRange, today],
    queryFn: () =>
      spacedRepetitionService.filterPlans({
        status: SpacedRepetitionPlanStatus.Coming,
        startDate: today,
        endDate: comingRange === "today" ? today : addDays(today, WINDOW_DAYS),
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
