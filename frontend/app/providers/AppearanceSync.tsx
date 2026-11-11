"use client";

import { useEffect } from "react";
import { applyAppearance } from "@/app/lib/appearance";
import { useAppearanceStore } from "@/app/lib/appearance.store";

// Keeps <html> in step with the saved appearance (text size, language) —
// on load and whenever it changes, in this tab or another one.
export default function AppearanceSync() {
  const textSize = useAppearanceStore((s) => s.textSize);
  const language = useAppearanceStore((s) => s.language);

  useEffect(() => {
    applyAppearance({ textSize, language });
  }, [textSize, language]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === useAppearanceStore.persist.getOptions().name) {
        void useAppearanceStore.persist.rehydrate();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return null;
}
