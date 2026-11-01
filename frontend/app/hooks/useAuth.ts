import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { authService } from "../services/auth.services";
import { authStorage } from "../lib/auth-storage";
import { useAuthStore } from "../lib/auth.store";
import { otpErrorMessage } from "../lib/otp-errors";
import { useAuthSuccess } from "./useAuthSuccess";

export function useGoogleLogin() {
  const router = useRouter();
  const completeAuth = useAuthSuccess();
  const setGoogleIdToken = useAuthStore((state) => state.setGoogleIdToken);

  return useMutation({
    mutationFn: authService.googleLogin,

    onSuccess: (data, variables) => {
      // A Google account without a confirmed phone: nothing was created yet.
      // Confirm a phone by WhatsApp first, sending the same Google token.
      if (data.needsPhone) {
        setGoogleIdToken(variables.idToken);
        router.push("/google-phone");
        return;
      }

      completeAuth(data, data);
    },

    onError: (error) => {
      console.error(error);
      toast.error("تعذر تسجيل الدخول بجوجل", { description: otpErrorMessage(error) });
    },
  });
}

export function useAuth() {
  const token = authStorage.getAccessToken();

  return {
    isAuthenticated: !!token,
    token,
  };
}
