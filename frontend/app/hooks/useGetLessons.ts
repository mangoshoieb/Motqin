// hooks/useGetLessons.ts

import { useQuery } from "@tanstack/react-query";
import { motqinService } from "../services/lesson.service";

export const useGetLessons = (subjectId: string) => {
  return useQuery<Lessons>({
    queryKey: ["lessons", subjectId],
    queryFn: () => motqinService.getLessons(subjectId),
    enabled: !!subjectId,
  });
};