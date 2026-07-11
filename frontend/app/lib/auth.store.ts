import { create } from "zustand";

interface AuthStore {
  phoneNumber: string;
  username: string;
  resendCooldownSeconds: number;
  resendsRemaining: number;

  setPhoneData: (phoneNumber: string, username?: string) => void;
  setPhone: (phoneNumber: string) => void;
  setResendInfo: (resendCooldownSeconds: number, resendsRemaining: number) => void;

  clearPhoneData: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  phoneNumber: "",
  username: "",
  resendCooldownSeconds: 0,
  resendsRemaining: 0,

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

  clearPhoneData: () =>
    set({
      phoneNumber: "",
      username: "",
      resendCooldownSeconds: 0,
      resendsRemaining: 0,
    }),
}));