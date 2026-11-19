"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "../services/auth.services";
import { SUBJECTS_QUERY_KEY } from "./useGetSubjects";
import { UpdateMeRequest } from "../types/auth.types";

// PUT /users/me. The response is the whole updated profile, so it goes
// straight into the current-user cache (navbar, comments and profile read
// from it).
export function useUpdateMe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateMeRequest) => authService.updateMe(payload),
    onSuccess: (user, payload) => {
      queryClient.setQueryData(["current-user"], user);
      // Stage and grade decide which subjects the app offers.
      if (payload.educationalStage !== undefined || payload.gradeLevel !== undefined) {
        void queryClient.invalidateQueries({ queryKey: SUBJECTS_QUERY_KEY });
      }
    },
  });
}
