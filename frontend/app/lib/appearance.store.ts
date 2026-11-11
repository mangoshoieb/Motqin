import { create } from "zustand";
import { persist } from "zustand/middleware";
import { APPEARANCE_STORAGE_KEY, AppLanguage, LANGUAGES, TextSize } from "./appearance";

// How the app looks on this device, beyond the light/dark theme (that one is
// next-themes' job): the text size and the interface language. The API has
// no fields for these, so they live in the browser.

interface AppearanceState {
  textSize: TextSize;
  language: AppLanguage;
  setTextSize: (textSize: TextSize) => void;
  setLanguage: (language: AppLanguage) => void;
}

export const useAppearanceStore = create<AppearanceState>()(
  persist(
    (set) => ({
      textSize: "md",
      language: "ar",
      setTextSize: (textSize) => set({ textSize }),
      setLanguage: (language) => {
        if (LANGUAGES.find((l) => l.value === language)?.available) set({ language });
      },
    }),
    { name: APPEARANCE_STORAGE_KEY },
  ),
);
