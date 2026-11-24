import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { authService } from "../services/auth.services";
import { authStorage } from "../lib/auth-storage";
import { useAuthStore } from "../lib/auth.store";
import { otpErrorMessage } from "../lib/otp-errors";
import { useAuthSuccess } from "./useAuthSuccess";

// The Google button: the first POST /auth/google, with only the token (plus
// the invite code and account type from the sign-up page).
export function useGoogleLogin() {
  const router = useRouter();
  const completeAuth = useAuthSuccess();
  const startGoogleSignup = useAuthStore((state) => state.startGoogleSignup);

  return useMutation({
    mutationFn: authService.googleLogin,

    onSuccess: (data, variables) => {
      // A new user: fill in «بياناتك» first (then maybe a phone).
      // An existing account without a needed phone: straight to the phone.
      if (data.needsProfile || data.needsPhone) {
        startGoogleSignup(variables.idToken, !!data.needsProfile, data.fullName);
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
