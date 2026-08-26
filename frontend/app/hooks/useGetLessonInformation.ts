// hooks/useGetLessonInformation.ts

import { useQuery } from "@tanstack/react-query";
import { questionService } from "../services/question.service";

// Deliberately a different query key from the legacy ["questions", "by-lesson"]
// used by useLessonSession: both hit the same endpoint, but they type the
// response differently, so sharing a cache entry would hand one of them the
// wrong shape.
export const useGetLessonInformation = (lessonId: string) => {
  return useQuery<LessonInformation[]>({
    queryKey: ["lesson-information", "by-lesson", lessonId],
    queryFn: () => questionService.getInformationByLesson(lessonId),
    enabled: !!lessonId,
  });
};
