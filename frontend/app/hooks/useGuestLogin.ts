"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authService } from "../services/auth.services";
import { authStorage } from "../lib/auth-storage";
import { authReturnPath, useAuthGate } from "../lib/auth-gate.store";
import { useGuestStore } from "../lib/guest.store";
import { toastApiError } from "../lib/api-error";

// "Try without an account" — starts a guest session and treats its tokens
// exactly like a login's (same storage, same refresh flow).
export function useGuestLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.signInAsGuest,

    onSuccess: (data) => {
      authStorage.setTokens(data.token, data.refreshToken);
      useGuestStore.getState().setRemaining(data.guest.remaining);
      useAuthGate.getState().close();
      queryClient.resetQueries();

      toast.success("أهلاً بك في متقن!", {
        description: "جرّب كل شيء بحرية، وأنشئ حسابك متى شئت دون أن تفقد ما أنجزته.",
      });

      router.replace(authReturnPath.take() ?? "/");
    },

    onError: (error) => toastApiError("تعذر بدء التجربة", error),
  });
}
