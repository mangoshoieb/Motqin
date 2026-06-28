import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { useEffect } from "react";
interface Props {
  onSuccess: (idToken: string) => void;
}

import { authService } from "../services/auth.services";
import { authStorage } from "../lib/auth-storage";

export function useGoogleLogin() {
  const router = useRouter();

  return useMutation({
    mutationFn: authService.googleLogin,

    onSuccess: (data) => {
      authStorage.setTokens(data.tokens.accessToken, data.tokens.refreshToken);

      router.replace("/");
    },

    onError: (error) => {
      console.error(error);
    },
  });
}
