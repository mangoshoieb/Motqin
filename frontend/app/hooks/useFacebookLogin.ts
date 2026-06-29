"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authStorage } from "../lib/auth-storage";
import { authService } from "../services/auth.services";


export function useFacebookLogin() {
  const router = useRouter();

  return useMutation({
    mutationFn: authService.facebookLogin,

    onSuccess: (data) => {
      console.log("from hook")
      authStorage.setTokens(
        data.tokens.accessToken,
        data.tokens.refreshToken
      );

      router.replace("/");
    },

    onError: (error) => {
      console.error(error);
    },
  });
}