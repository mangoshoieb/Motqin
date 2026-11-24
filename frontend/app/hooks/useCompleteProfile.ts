"use client";

import { useMutation } from "@tanstack/react-query";

import { authService } from "../services/auth.services";
import { useAuthSuccess } from "./useAuthSuccess";

// Errors are shown by the page: field messages under the fields, a toast
// for anything else.
export function useCompleteProfile() {
  const completeAuth = useAuthSuccess();

  return useMutation({
    mutationFn: authService.completeProfile,

    onSuccess: (data) => {
      completeAuth(data.token, data);
    },
  });
}
