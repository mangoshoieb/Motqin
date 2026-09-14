"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "../services/auth.services";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export function useUploadProfilePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!file.type.startsWith("image/")) throw new Error("not-image");
      if (file.size > MAX_PHOTO_BYTES) throw new Error("too-large");
      await authService.uploadProfilePhoto(file);
    },
    // /users/me is the source of truth for photoUrl — refetch it.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["current-user"] }),
  });
}
