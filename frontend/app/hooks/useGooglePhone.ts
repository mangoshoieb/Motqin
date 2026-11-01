"use client";

import { useMutation } from "@tanstack/react-query";
import { authService } from "../services/auth.services";
import { useAuthStore } from "../lib/auth.store";
import { useAuthSuccess } from "./useAuthSuccess";

// Google sign-up, step 2: send a WhatsApp code to the phone being confirmed.
export function useGooglePhoneRequest() {
  const setPhone = useAuthStore((state) => state.setPhone);
  const setResendInfo = useAuthStore((state) => state.setResendInfo);

  return useMutation({
    mutationFn: authService.googlePhoneRequest,
    onSuccess: (data, variables) => {
      // Carries "Debug Code: …" while WhatsApp codes are off on the server.
      console.log(data.message);
      setPhone(variables.phoneNumber);
      setResendInfo(data.resendCooldownSeconds, data.resendsRemaining);
    },
  });
}

// Step 3: the code finishes sign-up (or links Google to the phone's existing
// account) and signs in.
export function useGooglePhoneVerify() {
  const completeAuth = useAuthSuccess();
  const clearPhoneData = useAuthStore((state) => state.clearPhoneData);

  return useMutation({
    mutationFn: authService.googlePhoneVerify,
    onSuccess: (data) => {
      clearPhoneData();
      completeAuth(data, data);
    },
  });
}
