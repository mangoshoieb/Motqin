"use client";

import { useState } from "react";
import { DEFAULT_PLANNER_PREFERENCES, PlannerPreferences } from "@/app/types/planner-preferences.types";

const STORAGE_KEY = "motqin:planner-preferences";

function loadPreferences(): PlannerPreferences {
  if (typeof window === "undefined") return DEFAULT_PLANNER_PREFERENCES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PLANNER_PREFERENCES;
    return { ...DEFAULT_PLANNER_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PLANNER_PREFERENCES;
  }
}

// Local-only for now (see the type file's header comment). useState's lazy
// initializer is the sanctioned place for this impure, run-once read —
// unlike doing it in an effect — and every consumer already sits behind the
// protected-route auth gate, so there's no meaningful SSR pass to mismatch
// against.
export function usePlannerPreferences() {
  const [preferences, setPreferencesState] = useState<PlannerPreferences>(loadPreferences);

  const savePreferences = (next: PlannerPreferences) => {
    setPreferencesState(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore — e.g. storage disabled/full; the in-memory value still updates
    }
  };

  return { preferences, savePreferences, isLoaded: true };
}
