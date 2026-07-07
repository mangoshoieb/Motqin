"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { authService } from "../services/auth.services";
import { authStorage } from "../lib/auth-storage";

export function useCompleteProfile() {
  const router = useRouter();

  return useMutation({
    mutationFn: authService.completeProfile,

    onSuccess: (data) => {
      authStorage.setTokens(
        data.token.token,
        data.token.refreshToken
      );

      router.replace("/");
    },

    onError: (error) => {
      console.error(error);
    },
  });
}