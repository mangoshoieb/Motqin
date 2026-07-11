"use client";

import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";
import { authService } from "../services/auth.services";

// Reuses the phone login-request endpoint to resend an OTP — no dedicated
// resend endpoint needed, the backend treats it the same way and returns
// resendCooldownSeconds / resendsRemaining for rate limiting.
export function useResendOtp() {
  return useMutation({
    mutationFn: authService.logInPhone,

    onSuccess: () => {
      toast.success("تم إرسال رمز تحقق جديد");
    },

    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message;
      toast.error(message ?? "تعذر إعادة إرسال الرمز، حاول لاحقًا", {
        className: "!bg-red-200/80 ",
      });
    },
  });
}
