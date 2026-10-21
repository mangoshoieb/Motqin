// hooks/useGetLessonInformation.ts

import { useQueries, useQuery, type UseQueryResult } from "@tanstack/react-query";
import { questionService } from "../services/question.service";
import { QUESTION_CATEGORIES } from "../constants/question.constants";

// ["lesson-information", lessonId] is the prefix to invalidate after adding
// questions; each category is cached under its own key below it, shared by
// the lesson page's tabs and the quiz. (Deliberately not the legacy
// ["questions", "by-lesson"] key, which types the rows as `Question`.)
export const lessonInformationKey = (lessonId: string, category?: string) =>
  category
    ? (["lesson-information", lessonId, category] as const)
    : (["lesson-information", lessonId] as const);

// One category of a lesson — system questions plus the student's own.
export const useGetLessonInformation = (lessonId: string, category: string) => {
  return useQuery<LessonInformation[]>({
    queryKey: lessonInformationKey(lessonId, category),
    queryFn: () => questionService.getCustomizedInformation(lessonId, category),
    enabled: !!lessonId && !!category,
  });
};

// Stable reference, so useQueries only re-combines when a result changes.
const combineCategories = (results: UseQueryResult<LessonInformation[]>[]) => ({
  data: results.every((r) => r.data) ? results.flatMap((r) => r.data ?? []) : undefined,
  isLoading: results.some((r) => r.isLoading),
  error: results.find((r) => r.error)?.error ?? null,
});

// The whole lesson: the endpoint is per category, so this is one query per
// category tab, merged once all of them are in.
export const useGetAllLessonInformation = (lessonId: string) =>
  useQueries({
    queries: QUESTION_CATEGORIES.map((c) => ({
      queryKey: lessonInformationKey(lessonId, c.value),
      queryFn: () => questionService.getCustomizedInformation(lessonId, c.value),
      enabled: !!lessonId,
    })),
    combine: combineCategories,
  });
