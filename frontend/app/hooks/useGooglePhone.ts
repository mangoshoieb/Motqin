"use client";

import { useMutation } from "@tanstack/react-query";
import { authService } from "../services/auth.services";
import { useAuthStore } from "../lib/auth.store";
import { useAuthSuccess } from "./useAuthSuccess";

// Google sign-up, form step: the second POST /auth/google with «بياناتك».
// Answers a token (signed in), needsPhone (the page moves on to the phone
// step) or a validation error the page puts under the fields.
export function useGoogleProfileSubmit() {
  const completeAuth = useAuthSuccess();
  const clearPhoneData = useAuthStore((state) => state.clearPhoneData);

  return useMutation({
    mutationFn: authService.googleLogin,
    onSuccess: (data) => {
      if (data.needsPhone || data.needsProfile) return;
      clearPhoneData();
      completeAuth(data, data);
    },
  });
}

// Phone step: send a WhatsApp code to the phone being confirmed.
export function useGooglePhoneRequest() {
  const setPhone = useAuthStore((state) => state.setPhone);
  const setResendInfo = useAuthStore((state) => state.setResendInfo);
  const setWhatsAppDebug = useAuthStore((state) => state.setWhatsAppDebug);

  return useMutation({
    mutationFn: authService.googlePhoneRequest,
    onSuccess: (data, variables) => {
      setPhone(variables.phoneNumber);
      setResendInfo(data.resendCooldownSeconds, data.resendsRemaining);
      setWhatsAppDebug(data.whatsApp);
    },
  });
}

// Code step: finishes sign-up (or links Google to the phone's existing
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
