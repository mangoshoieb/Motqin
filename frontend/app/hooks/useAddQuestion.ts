// hooks/useAddQuestion.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { questionService } from "../services/question.service";

export const useAddMcqQuestion = (lessonId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: questionService.addMcqQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions", "by-lesson", lessonId] });
    },
  });
};

export const useAddFillQuestion = (lessonId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: questionService.addFillQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions", "by-lesson", lessonId] });
    },
  });
};
