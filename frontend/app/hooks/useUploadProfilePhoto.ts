"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "../services/auth.services";
import { compressImage } from "../lib/compress-image";

// The server takes JPEG, PNG or WebP up to 6 MB (it checks the bytes, not
// the name).
export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_PHOTO_BYTES = 6 * 1024 * 1024;

export function useUploadProfilePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!PHOTO_TYPES.includes(file.type)) throw new Error("unsupported");
      if (file.size > MAX_PHOTO_BYTES) throw new Error("too-large");
      // Shrink it on the device first (see compress-image.ts).
      const upload = await compressImage(file).catch(() => file);
      await authService.uploadProfilePhoto(upload);
    },
    // /users/me is the source of truth for photoUrl — refetch it.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["current-user"] }),
  });
}
