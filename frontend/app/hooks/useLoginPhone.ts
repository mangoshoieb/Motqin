"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { authService } from "../services/auth.services";
import { useAuthStore } from "../lib/auth.store";
import { otpErrorMessage } from "../lib/otp-errors";
import { authFieldErrors } from "../lib/auth-field-errors";

// POST /auth/phone-logIn-request, for تسجيل دخول and إنشاء الحساب. The
// page passes its own onError to put details.PhoneNumber / InviterCode under
// the fields; anything else gets a toast here.
export function useLogInPhone({ signUp = false }: { signUp?: boolean } = {}) {
  const router = useRouter();
  const setPhone = useAuthStore((state) => state.setPhone);
  const setResendInfo = useAuthStore((state) => state.setResendInfo);
  const setWhatsAppDebug = useAuthStore((state) => state.setWhatsAppDebug);

  return useMutation({
    mutationFn: authService.logInPhone,

    onSuccess: (data, variables) => {
      setPhone(variables.phoneNumber);
      setResendInfo(data.resendCooldownSeconds, data.resendsRemaining);
      setWhatsAppDebug(data.whatsApp);

      // A registered number typed on the sign-up page: it's a sign-in.
      if (signUp && data.isNewUser === false) {
        toast.info("لديك حساب بهذا الرقم، أدخل الرمز لتسجيل دخولك.");
      }

      router.push("/verify-phone");
    },
    // 429 (a code within 60 seconds, or 5 in 15 minutes) and 503 (WhatsApp
    // refused the message) both land here.
    onError: (error) => {
      if (authFieldErrors(error)) return;
      toast.error("تعذر إرسال رمز التحقق", {
        description: otpErrorMessage(error),
        className: "!bg-red-200/80 dark:bg-red-500/20 ",
      });
    },
  });
}
