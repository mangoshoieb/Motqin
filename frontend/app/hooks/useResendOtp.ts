"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authService } from "../services/auth.services";
import { useAuthStore } from "../lib/auth.store";
import { otpErrorMessage, otpRetryAfterSeconds } from "../lib/otp-errors";

// Reuses the phone login-request endpoint to resend an OTP — no dedicated
// resend endpoint needed, the backend treats it the same way and returns
// resendCooldownSeconds / resendsRemaining for rate limiting.
export function useResendOtp() {
  const setResendInfo = useAuthStore((state) => state.setResendInfo);

  return useMutation({
    mutationFn: authService.logInPhone,

    onSuccess: () => {
      toast.success("تم إرسال رمز تحقق جديد");
    },

    onError: (error) => {
      // A 429 says how long to wait — restart the countdown from it.
      const retryAfter = otpRetryAfterSeconds(error);
      if (retryAfter) setResendInfo(retryAfter, useAuthStore.getState().resendsRemaining);

      toast.error(otpErrorMessage(error), {
        className: "!bg-red-200/80 ",
      });
    },
  });
}
