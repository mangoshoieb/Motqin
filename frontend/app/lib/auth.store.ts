import { create } from "zustand";
import type { SignupProfileFields, WhatsAppDebug } from "../types/auth.types";

// The «بياناتك» form as a Google sign-up sends it: kept between the form
// step and the phone step, since google/phone-verify needs it again.
export interface GoogleProfile extends SignupProfileFields {
  fullName: string;
}

interface AuthStore {
  phoneNumber: string;
  username: string;
  resendCooldownSeconds: number;
  resendsRemaining: number;
  // The Google ID token of a sign-up that isn't finished: POST /auth/google
  // answered needsProfile or needsPhone. Memory only — it lasts about an
  // hour, and a reload sends the user back to the Google button.
  googleIdToken: string;
  // needsProfile on the first call: /google-phone opens on the form.
  googleNeedsProfile: boolean;
  // The name Google gave, to prefill the form.
  googleFullName: string;
  googleProfile: GoogleProfile | null;
  // Test only, while WhatsApp is on hold: the last code message.
  whatsAppDebug: WhatsAppDebug | null;

  setPhoneData: (phoneNumber: string, username?: string) => void;
  setPhone: (phoneNumber: string) => void;
  setResendInfo: (resendCooldownSeconds: number, resendsRemaining: number) => void;
  setGoogleIdToken: (googleIdToken: string) => void;
  startGoogleSignup: (googleIdToken: string, needsProfile: boolean, fullName?: string) => void;
  setGoogleProfile: (profile: GoogleProfile | null) => void;
  setWhatsAppDebug: (debug: WhatsAppDebug | null | undefined) => void;

  clearPhoneData: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  phoneNumber: "",
  username: "",
  resendCooldownSeconds: 0,
  resendsRemaining: 0,
  googleIdToken: "",
  googleNeedsProfile: false,
  googleFullName: "",
  googleProfile: null,
  whatsAppDebug: null,

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
  startGoogleSignup: (googleIdToken, needsProfile, fullName = "") =>
    set({
      googleIdToken,
      googleNeedsProfile: needsProfile,
      googleFullName: fullName,
      googleProfile: null,
      phoneNumber: "",
      whatsAppDebug: null,
    }),
  setGoogleProfile: (googleProfile) => set({ googleProfile }),
  // Only kept while the server says it didn't send the message.
  setWhatsAppDebug: (debug) => set({ whatsAppDebug: debug && !debug.sent ? debug : null }),

  clearPhoneData: () =>
    set({
      phoneNumber: "",
      username: "",
      resendCooldownSeconds: 0,
      resendsRemaining: 0,
      googleIdToken: "",
      googleNeedsProfile: false,
      googleFullName: "",
      googleProfile: null,
      whatsAppDebug: null,
    }),
}));
