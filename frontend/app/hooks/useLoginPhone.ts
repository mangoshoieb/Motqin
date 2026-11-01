"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { authService } from "../services/auth.services";
import { useAuthStore } from "../lib/auth.store";
import { otpErrorMessage } from "../lib/otp-errors";

export function useLogInPhone() {
  const router = useRouter();
  const setPhone = useAuthStore(
    state => state.setPhone
);
  const setResendInfo = useAuthStore(
    state => state.setResendInfo
  );
  return useMutation({
    mutationFn: authService.logInPhone,

    onSuccess: (data, variables) => {
      console.log(data.message)
      setPhone(
          variables.phoneNumber
      );
      setResendInfo(
        data.resendCooldownSeconds,
        data.resendsRemaining
      );

      router.push("/verify-phone");
  },
    // 429 (a code within 60 seconds, or 5 in 15 minutes) and 503 (WhatsApp
    // refused the message) both land here.
    onError: (error) => {
      console.error(error);
      toast.error("تعذر إرسال رمز التحقق", {
        description: otpErrorMessage(error),
        className: "!bg-red-200/80 ",
      });
    },
  });
}
