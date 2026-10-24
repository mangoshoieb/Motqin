"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import { useGetSubjects } from "./useGetSubjects";
import { motqinService } from "../services/lesson.service";
import {
  SpacedRepetitionPlan,
  SpacedRepetitionPlanStatus,
  SpacedRepetitionPreviousSession,
  spacedRepetitionService,
} from "../services/spaced-repetition.service";
import { dateOnly } from "../lib/study-plan";
import { parseServerDate } from "../lib/session-clock";

// Where a review sits relative to today, which is also its colour on the
// full table: coming (blue), today (green), done (orange), missed (red).
export type ReviewTimelineState = "upcoming" | "today" | "completed" | "missed";

// One review on the full table: either still due (a plan's next review), or
// one the student already sat (a past repetition of a plan).
export interface ReviewTimelineTask {
  key: string;
  planId: number;
  subjectId: number;
  lessonId: number;
  category: string;
  // 0 is the first study of the lesson, the sitting the plan was built
  // from; reviews count from 1.
  repetitionNumber: number;
  // YYYY-MM-DD the review falls on, and how many days that is from today.
  day: string;
  daysFromToday: number;
  done: boolean;
  state: ReviewTimelineState;
  subjectName?: string;
  lessonTitle?: string;
  // The score of a review already sat; for a due one, the last sitting's.
  score?: { correct: number; total: number };
  // When a review already sat was finished, for ordering within its day.
  finishedAt?: number;
}

type PlanGroup = "missed" | "coming" | "completed";

// The filter groups the stored statuses itself, so each group is asked for
// separately and every plan is tagged with the one it came back in.
const GROUPS: { group: PlanGroup; status: SpacedRepetitionPlanStatus }[] = [
  { group: "missed", status: SpacedRepetitionPlanStatus.Missed },
  { group: "coming", status: SpacedRepetitionPlanStatus.Coming },
  { group: "completed", status: SpacedRepetitionPlanStatus.Completed },
];

// The filter rejects a call without dates (400), but an open-ended range is
// fine: from long before the app existed onward is every plan there is.
const EVERY_PLAN_FROM = "2000-01-01";

async function fetchAllPlans() {
  const responses = await Promise.all(
    GROUPS.map(({ status }) =>
      spacedRepetitionService.filterPlans({ status, startDate: EVERY_PLAN_FROM }),
    ),
  );
  const seen = new Set<number>();
  const plans: { plan: SpacedRepetitionPlan; group: PlanGroup }[] = [];
  responses.forEach((response, index) => {
    for (const plan of response.items) {
      if (seen.has(plan.id)) continue;
      seen.add(plan.id);
      plans.push({ plan, group: GROUPS[index].group });
    }
  });
  return plans;
}

const daysBetween = (from: string, to: string) =>
  Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);

const stateOf = (daysFromToday: number, done: boolean): ReviewTimelineState =>
  daysFromToday > 0 ? "upcoming" : daysFromToday === 0 ? "today" : done ? "completed" : "missed";

const scoreOf = (sittings: SpacedRepetitionPreviousSession[]) => {
  const total = sittings.reduce((sum, s) => sum + s.totalQuestionsCount, 0);
  const correct = sittings.reduce((sum, s) => sum + s.correctAnswersCount, 0);
  return total > 0 ? { correct, total } : undefined;
};

// Every review of every plan: the past repetitions it was built from, plus
// its next one while it still has one due.
function tasksOf(plan: SpacedRepetitionPlan, group: PlanGroup, today: string) {
  const tasks: Omit<ReviewTimelineTask, "subjectName" | "lessonTitle">[] = [];
  const base = {
    planId: plan.id,
    subjectId: plan.subjectId,
    lessonId: plan.lessonId,
    category: plan.category,
  };

  // A repetition can take several sittings (a batch of questions each), so
  // the sittings are grouped by repetition; one that's still under way is
  // part of the due review, not a finished one.
  const byRepetition = new Map<number, SpacedRepetitionPreviousSession[]>();
  for (const sitting of plan.previousSessions ?? []) {
    const sittings = byRepetition.get(sitting.repetitionNumber) ?? [];
    sittings.push(sitting);
    byRepetition.set(sitting.repetitionNumber, sittings);
  }

  for (const [repetitionNumber, sittings] of byRepetition) {
    if (group !== "completed" && repetitionNumber >= plan.repetitionNumber) continue;
    const finishedAt = Math.max(
      ...sittings.map((s) => parseServerDate(s.endTime ?? s.startTime) ?? 0),
    );
    if (!finishedAt) continue;
    const day = dateOnly(new Date(finishedAt));
    const daysFromToday = daysBetween(today, day);
    tasks.push({
      ...base,
      key: `${plan.id}-${repetitionNumber}`,
      repetitionNumber,
      day,
      daysFromToday,
      done: true,
      state: stateOf(daysFromToday, true),
      score: scoreOf(sittings),
      finishedAt,
    });
  }

  if (group !== "completed") {
    // The calendar day exactly as the server wrote it — the same day the
    // filter windows use (see useReviewOverview).
    const day = plan.nextReviewDate.slice(0, 10);
    const daysFromToday = daysBetween(today, day);
    const last = plan.previousSessions?.at(-1);
    tasks.push({
      ...base,
      key: `${plan.id}-${plan.repetitionNumber}`,
      repetitionNumber: plan.repetitionNumber,
      day,
      daysFromToday,
      done: false,
      state: stateOf(daysFromToday, false),
      score: last ? scoreOf([last]) : undefined,
    });
  }

  return tasks;
}

// Every spaced-repetition review the student has, past and coming, for the
// full review table — ungrouped and unsorted; the page lays them out by day.
export const useReviewTimeline = () => {
  const today = dateOnly(new Date());

  const plansQuery = useQuery({
    queryKey: ["spaced-repetition-plans", "timeline"],
    queryFn: fetchAllPlans,
  });

  const { data: subjects } = useGetSubjects();

  // Lesson titles, one list per subject that has a review — the same cache
  // entries the subject pages use (useGetLessons).
  const subjectIds = [...new Set((plansQuery.data ?? []).map(({ plan }) => plan.subjectId))];
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

  const tasks: ReviewTimelineTask[] = (plansQuery.data ?? []).flatMap(({ plan, group }) =>
    tasksOf(plan, group, today).map((task) => ({
      ...task,
      subjectName: subjects?.find((s) => s.subjectID === plan.subjectId)?.name,
      lessonTitle: lessonTitles.get(plan.lessonId),
    })),
  );

  return {
    tasks,
    today,
    isLoading: plansQuery.isLoading,
    isError: plansQuery.isError,
    refetch: plansQuery.refetch,
  };
};
