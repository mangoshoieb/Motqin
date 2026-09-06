"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_PLANNER_PREFERENCES,
  PlannerPreferences,
} from "@/app/types/planner-preferences.types";
import { userPreferencesService } from "@/app/services/user-preferences.service";

function formatTimeForInput(time: string): string {
  if (!time) return "";

  // "02:06:05.1500000" -> "02:06"
  return time.slice(0, 5);
}

function normalizePreferences(
  preferences: PlannerPreferences
): PlannerPreferences {
  return {
    ...preferences,
    startSleepTime: formatTimeForInput(preferences.startSleepTime),
    endSleepTime: formatTimeForInput(preferences.endSleepTime),
  };
}

export function usePlannerPreferences() {
  const [preferences, setPreferences] = useState<PlannerPreferences>(
    DEFAULT_PLANNER_PREFERENCES
  );

  const [hasPreferences, setHasPreferences] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await userPreferencesService.getPreferences();

      if (data) {
        setPreferences(normalizePreferences(data));
        setHasPreferences(true);
      } else {
        setPreferences(DEFAULT_PLANNER_PREFERENCES);
        setHasPreferences(false);
      }
    } catch (error) {
      console.error("Failed to fetch planner preferences:", error);
      setError("فشل تحميل تفضيلات المخطط.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createPreferences = useCallback(
    async (data: PlannerPreferences) => {
      try {
        setIsSaving(true);
        setError(null);

        const created =
          await userPreferencesService.createPreferences(data);

        if (created) {
          setPreferences(normalizePreferences(created));
        }

        setHasPreferences(true);

        return created;
      } catch (error) {
        console.error("Failed to create planner preferences:", error);
        setError("فشل حفظ تفضيلات المخطط.");
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  const updatePreferences = useCallback(
    async (data: PlannerPreferences) => {
      try {
        setIsSaving(true);
        setError(null);

        const updated =
          await userPreferencesService.updatePreferences(data);

        if (updated) {
          setPreferences(normalizePreferences(updated));
        }

        setHasPreferences(true);

        return updated;
      } catch (error) {
        console.error("Failed to update planner preferences:", error);
        setError("فشل تحديث تفضيلات المخطط.");
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  const deletePreferences = useCallback(async () => {
    try {
      setIsSaving(true);
      setError(null);

      await userPreferencesService.deletePreferences();

      setPreferences(DEFAULT_PLANNER_PREFERENCES);
      setHasPreferences(false);
    } catch (error) {
      console.error("Failed to delete planner preferences:", error);
      setError("فشل حذف تفضيلات المخطط.");
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return {
    preferences,
    hasPreferences,

    isLoading,
    isSaving,
    error,

    fetchPreferences,
    createPreferences,
    updatePreferences,
    deletePreferences,
  };
}