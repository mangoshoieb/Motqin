"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "../services/auth.services";

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string; name: string; role?: string | null; gradeLevel?: number }) =>
      authService.updateProfile(id, payload),
    // /users/me is what the navbar, comments and profile read from.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["current-user"] }),
  });
}
