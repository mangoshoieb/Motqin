"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { spacedRepetitionService } from "../services/spaced-repetition.service";
import { sessionStorageService } from "../lib/session-storage";
import { lessonInformationKey } from "./useGetLessonInformation";

// POST /spaced-repetition/restart for one lesson + category. Besides the
// server's "finished" marks, the quiz keeps its own paused session in this
// browser — that goes too, or the quiz would resume where it left off.
export const useRestartRepetition = (lessonId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (category: string) =>
      spacedRepetitionService.restartRepetition({ lessonId: Number(lessonId), category }),
    onSuccess: (_, category) => {
      // load() only returns a snapshot for this lesson + category.
      if (sessionStorageService.load(lessonId, category)) sessionStorageService.clear();
      queryClient.invalidateQueries({ queryKey: lessonInformationKey(lessonId) });
      // An open quiz refetches its batch and starts over; otherwise the
      // next visit fetches fresh anyway.
      queryClient.invalidateQueries({ queryKey: ["session-questions", lessonId] });
    },
  });
};
