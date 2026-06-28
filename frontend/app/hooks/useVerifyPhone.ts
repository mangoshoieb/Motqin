"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { authService } from "../services/auth.services";
import { authStorage } from "../lib/auth-storage";

export function useVerifyPhone() {
  const router = useRouter();

  return useMutation({
    mutationFn: authService.verifyPhone,

    onSuccess: (data) => {
      console.log("SUCCESS");
      console.log(data);

      authStorage.setTokens(
        data.token.accessToken,
        data.token.refreshToken
      );

      console.log("Tokens saved");

      router.replace("/");

      console.log("Redirect called");
    },

    onError: (error) => {
      console.log("ERROR");
      console.error(error);
    },
  });
}