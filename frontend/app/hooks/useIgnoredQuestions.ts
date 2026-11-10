"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { questionService } from "../services/question.service";
import { lessonInformationKey } from "./useGetLessonInformation";

// Ignoring a system question hides it for this student only (it leaves the
// lesson's list and the quiz); restoring brings it back.

const ignoredKey = (lessonId: string, category: string) =>
  ["ignored-questions", lessonId, category] as const;

export const useIgnoredQuestions = (lessonId: string, category: string) =>
  useQuery({
    queryKey: ignoredKey(lessonId, category),
    queryFn: () => questionService.getIgnored(lessonId, category),
    enabled: !!lessonId && !!category,
  });

// Both directions move a question between the lesson's list and the ignored
// list, and change what the quiz runs on — refresh all three.
const useRefreshAfterChange = (lessonId: string) => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: lessonInformationKey(lessonId) });
    queryClient.invalidateQueries({ queryKey: ["ignored-questions", lessonId] });
    queryClient.invalidateQueries({ queryKey: ["session-questions", lessonId] });
  };
};

export const useIgnoreQuestion = (lessonId: string) => {
  const queryClient = useQueryClient();
  const refresh = useRefreshAfterChange(lessonId);

  return useMutation({
    mutationFn: (question: LessonInformation) => questionService.ignoreForUser(question.informationID),
    onSuccess: (_, question) => {
      // Drop it from its tab right away; the refetch confirms.
      queryClient.setQueryData<LessonInformation[]>(
        lessonInformationKey(lessonId, question.informationCategory ?? ""),
        (prev) => prev?.filter((q) => q.informationID !== question.informationID)
      );
      refresh();
    },
  });
};

export const useRestoreQuestion = (lessonId: string) => {
  const queryClient = useQueryClient();
  const refresh = useRefreshAfterChange(lessonId);

  return useMutation({
    mutationFn: (question: LessonInformation) => questionService.restoreForUser(question.informationID),
    // restored: false means it wasn't ignored any more — either way the row
    // leaves the ignored list.
    onSuccess: (_, question) => {
      queryClient.setQueryData<LessonInformation[]>(
        ignoredKey(lessonId, question.informationCategory ?? ""),
        (prev) => prev?.filter((q) => q.informationID !== question.informationID)
      );
      refresh();
    },
  });
};
