import { create } from "zustand";

interface AuthStore {
  phoneNumber: string;
  username: string;
  resendCooldownSeconds: number;
  resendsRemaining: number;
  // The Google ID token of a sign-up that still needs a confirmed phone
  // (POST /auth/google answered needsPhone). Memory only — it lasts about an
  // hour, and a reload sends the user back to the Google button.
  googleIdToken: string;

  setPhoneData: (phoneNumber: string, username?: string) => void;
  setPhone: (phoneNumber: string) => void;
  setResendInfo: (resendCooldownSeconds: number, resendsRemaining: number) => void;
  setGoogleIdToken: (googleIdToken: string) => void;

  clearPhoneData: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  phoneNumber: "",
  username: "",
  resendCooldownSeconds: 0,
  resendsRemaining: 0,
  googleIdToken: "",

  setPhoneData: (phoneNumber, username) =>
    set({
      phoneNumber,
      username,
    }),
  setPhone: (phoneNumber) =>
    set({
      phoneNumber,
    }),
  setResendInfo: (resendCooldownSeconds, resendsRemaining) =>
    set({
      resendCooldownSeconds,
      resendsRemaining,
    }),
  setGoogleIdToken: (googleIdToken) =>
    set({
      googleIdToken,
    }),

  clearPhoneData: () =>
    set({
      phoneNumber: "",
      username: "",
      resendCooldownSeconds: 0,
      resendsRemaining: 0,
      googleIdToken: "",
    }),
}));
