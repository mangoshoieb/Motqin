// Appearance options shared by the settings page, the store and the root
// layout's boot script. No React or zustand here: the server layout imports
// this file.

export type TextSize = "sm" | "md" | "lg" | "xl";
export type AppLanguage = "ar" | "en";

// The percent is the root font size; Tailwind sizes are in rem, so the whole
// interface (text, spacing, icons sized in rem) scales with it.
export const TEXT_SIZES: { value: TextSize; label: string; percent: number }[] = [
  { value: "sm", label: "صغير", percent: 87.5 },
  { value: "md", label: "افتراضي", percent: 100 },
  { value: "lg", label: "كبير", percent: 112.5 },
  { value: "xl", label: "كبير جدًا", percent: 125 },
];

export const LANGUAGES: { value: AppLanguage; label: string; native: string; available: boolean }[] = [
  { value: "ar", label: "العربية", native: "Arabic", available: true },
  // The interface has no English strings yet; it's listed so the choice is
  // visible, and switches on once the translation lands.
  { value: "en", label: "الإنجليزية", native: "English", available: false },
];

// The boot script below reads this key before first paint, so keep it and
// the persisted shape ({ state: { textSize, language } }) in step with the
// store.
export const APPEARANCE_STORAGE_KEY = "motqin-appearance";

export const applyAppearance = ({ textSize, language }: { textSize: TextSize; language: AppLanguage }) => {
  const html = document.documentElement;
  html.dataset.textSize = textSize;
  html.lang = language;
};

// Runs in <head> before React hydrates, so a saved text size doesn't flash
// in at the default size first. Plain ES5, no imports.
export const appearanceBootScript = `(function(){try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(
  APPEARANCE_STORAGE_KEY,
)})||"{}").state||{};var h=document.documentElement;if(s.textSize)h.dataset.textSize=s.textSize;if(s.language)h.lang=s.language;}catch(e){}})();`;
