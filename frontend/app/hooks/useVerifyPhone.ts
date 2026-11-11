"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { authService } from "../services/auth.services";
import { toast } from "sonner";
import { otpErrorMessage } from "../lib/otp-errors";
import { useAuthSuccess } from "./useAuthSuccess";

export function useVerifyPhone() {
  const router = useRouter();
  const completeAuth = useAuthSuccess();
  return useMutation({
    mutationFn: authService.verifyPhone,

    onSuccess: (data) => {
      if (data.needsSignup) {
        router.replace("/complete-profile");
        return;
      }

      if (!data.token) {
        console.error("Token is missing.");
        return;
      }

      completeAuth(data.token, data);
    },

    // Wrong, expired or never-requested codes, and otp_too_many_attempts
    // after 5 wrong tries (then even the right code needs a new send).
    onError: (error) => {
      console.error(error);
      toast.error(otpErrorMessage(error), {
        className: "!bg-red-200/80 dark:bg-red-500/20 ",
      });
    },
  });
}
