"use client";

import { useMutation } from "@tanstack/react-query";

import { authService } from "../services/auth.services";
import { useAuthSuccess } from "./useAuthSuccess";

export function useCompleteProfile() {
  const completeAuth = useAuthSuccess();

  return useMutation({
    mutationFn: authService.completeProfile,

    onSuccess: (data) => {
      completeAuth(data.token, data);
    },

    onError: (error) => {
      console.error(error);
    },
  });
}