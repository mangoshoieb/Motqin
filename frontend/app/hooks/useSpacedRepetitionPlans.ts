"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import { useGetSubjects } from "./useGetSubjects";
import { motqinService } from "../services/lesson.service";
import {
  SpacedRepetitionPlan,
  SpacedRepetitionPlanStatus,
  spacedRepetitionService,
} from "../services/spaced-repetition.service";

export type ReviewGroup = "missed" | "coming" | "completed";

// A spaced-repetition plan as the execution board shows it: which of the
// filter's groups it fell in, plus the subject and lesson names resolved
// from their ids (undefined until those lists load, or if they don't know it).
export interface ReviewItem {
  id: number;
  subjectId: number;
  lessonId: number;
  category: string;
  repetitionNumber: number;
  group: ReviewGroup;
  subjectName?: string;
  lessonTitle?: string;
  // The most recent past session's score, when there is one.
  lastScore?: { correct: number; total: number };
}

// The filter groups the stored statuses itself, so each group is asked for
// separately and the item is tagged with the one it came back in.
const GROUPS: { group: ReviewGroup; status: SpacedRepetitionPlanStatus }[] = [
  { group: "missed", status: SpacedRepetitionPlanStatus.Missed },
  { group: "coming", status: SpacedRepetitionPlanStatus.Coming },
  { group: "completed", status: SpacedRepetitionPlanStatus.Completed },
];

async function fetchDayPlans(date: string) {
  const responses = await Promise.all(
    GROUPS.map(({ status }) => spacedRepetitionService.filterPlans({ date, status })),
  );
  const seen = new Set<number>();
  const plans: { plan: SpacedRepetitionPlan; group: ReviewGroup }[] = [];
  responses.forEach((response, index) => {
    for (const plan of response.items) {
      if (seen.has(plan.id)) continue;
      seen.add(plan.id);
      plans.push({ plan, group: GROUPS[index].group });
    }
  });
  return plans;
}

const lastScoreOf = (plan: SpacedRepetitionPlan) => {
  const last = plan.previousSessions?.at(-1);
  return last && last.totalQuestionsCount > 0
    ? { correct: last.correctAnswersCount, total: last.totalQuestionsCount }
    : undefined;
};

// The spaced-repetition reviews due on `date` (YYYY-MM-DD): missed first,
// then coming, then completed — each group soonest first, as the API sends it.
export const useSpacedRepetitionPlans = (date: string | undefined) => {
  const plansQuery = useQuery({
    queryKey: ["spaced-repetition-plans", date],
    queryFn: () => fetchDayPlans(date!),
    enabled: !!date,
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

  const items: ReviewItem[] = (plansQuery.data ?? []).map(({ plan, group }) => ({
    id: plan.id,
    subjectId: plan.subjectId,
    lessonId: plan.lessonId,
    category: plan.category,
    repetitionNumber: plan.repetitionNumber,
    group,
    subjectName: subjects?.find((s) => s.subjectID === plan.subjectId)?.name,
    lessonTitle: lessonTitles.get(plan.lessonId),
    lastScore: lastScoreOf(plan),
  }));

  return { items, isLoading: plansQuery.isLoading, isError: plansQuery.isError };
};
