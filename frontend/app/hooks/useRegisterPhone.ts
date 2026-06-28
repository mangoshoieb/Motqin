"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { authService } from "../services/auth.services";

export function useRegisterPhone() {
  const router = useRouter();

  return useMutation({
    mutationFn: authService.registerPhone,

    onSuccess: (data, variables) => {
      console.log(data.message)
      router.push(
        `/verify-phone?phone=${encodeURIComponent(
          variables.phoneNumber
        )}}`
      );
    },

    onError: (error) => {
      console.error(error);
    },
  });
}