// hooks/useGetLessons.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CustomLessonPayload, motqinService } from "../services/lesson.service";

const LESSONS_QUERY_KEY = ["lessons"] as const;

// System lessons first, then the student's own — a stable sort, so each
// group keeps the order the backend sent.
const systemLessonsFirst = (data: Lessons): Lessons => ({
  ...data,
  lessons: data.lessons
    ? [...data.lessons].sort((a, b) => Number(!!a.isMine) - Number(!!b.isMine))
    : data.lessons,
});

export const useGetLessons = (subjectId: string) => {
  return useQuery<Lessons>({
    queryKey: [...LESSONS_QUERY_KEY, subjectId],
    queryFn: () => motqinService.getLessons(subjectId),
    select: systemLessonsFirst,
    enabled: !!subjectId,
  });
};

// Mutations refresh every cached lesson list rather than one subject's:
// the same subject can be cached under more than one key spelling.
export const useCreateLesson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ subjectId, ...payload }: { subjectId: number } & CustomLessonPayload) =>
      motqinService.createCustomLesson(subjectId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LESSONS_QUERY_KEY });
    },
  });
};

export const useUpdateLesson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...payload }: { id: number } & CustomLessonPayload) =>
      motqinService.updateCustomLesson(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LESSONS_QUERY_KEY });
    },
  });
};

export const useDeleteLesson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => motqinService.removeCustomLesson(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LESSONS_QUERY_KEY });
    },
  });
};
