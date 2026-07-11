// hooks/useGetQuestionsByLesson.ts

import { useQuery } from "@tanstack/react-query";
import { questionService } from "../services/question.service";

export const useGetQuestionsByLesson = (lessonId: string) => {
  return useQuery<Question[]>({
    queryKey: ["questions", "by-lesson", lessonId],
    queryFn: () => questionService.getQuestionsByLesson(lessonId),
    enabled: !!lessonId,
  });
};
