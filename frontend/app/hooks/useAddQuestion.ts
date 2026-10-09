// hooks/useAddQuestion.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { questionService } from "../services/question.service";

// The questions page reads useGetLessonInformation's cache — refresh that.
const lessonInformationKey = (lessonId: string) =>
  ["lesson-information", "by-lesson", lessonId] as const;

export const useAddUserQuestion = (lessonId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: questionService.addUserQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lessonInformationKey(lessonId) });
    },
  });
};

export const useGenerateAiQuestions = (lessonId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: questionService.uploadForAiQuestions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lessonInformationKey(lessonId) });
    },
  });
};
