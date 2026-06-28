import { create } from "zustand";

interface AuthStore {
  phoneNumber: string;
  username: string;

  setPhoneData: (phoneNumber: string, username: string) => void;

  clearPhoneData: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  phoneNumber: "",
  username: "",

  setPhoneData: (phoneNumber, username) =>
    set({
      phoneNumber,
      username,
    }),

  clearPhoneData: () =>
    set({
      phoneNumber: "",
      username: "",
    }),
}));