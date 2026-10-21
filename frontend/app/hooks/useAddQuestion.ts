// hooks/useAddQuestion.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { questionService, type GenerateQuestionsFromPdfInput } from "../services/question.service";
import { aiQuestionToDraft } from "../lib/question-draft";
import { lessonInformationKey } from "./useGetLessonInformation";

export const useAddUserQuestion = (lessonId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: questionService.addUserQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lessonInformationKey(lessonId) });
    },
  });
};

// Generates the questions and turns them into editable drafts (decoding the
// images) in one step, so the waiting screen covers both. Nothing to
// invalidate: they aren't saved yet — they go to the review page first.
export const useGenerateQuestionsFromPdf = () =>
  useMutation({
    mutationFn: async (input: GenerateQuestionsFromPdfInput) => {
      const questions = await questionService.generateFromPdf(input);
      const drafts = await Promise.all(questions.map((q, i) => aiQuestionToDraft(q, i)));
      return drafts.map((draft, i) => ({ draft, pageNumber: questions[i].pageNumber ?? null }));
    },
  });

export const useGenerateAiQuestions = (lessonId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: questionService.uploadForAiQuestions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lessonInformationKey(lessonId) });
    },
  });
};
