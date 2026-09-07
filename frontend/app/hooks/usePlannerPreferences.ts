"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_PLANNER_PREFERENCES,
  PlannerPreferences,
  BusyTimesByDay,
  UpdatePlannerPreferencesRequest,
} from "@/app/types/planner-preferences.types";
import { userPreferencesService } from "@/app/services/user-preferences.service";

function formatTimeForInput(time?: string): string {
  if (!time) return "";

  // Supports both:
  // "23:00"
  // "23:00:00.0000000"
  //
  // UI always keeps HH:mm
  return time.slice(0, 5);
}

function normalizeBusyTimes(value?: unknown): BusyTimesByDay {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      sunday: [],
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
    };
  }

  const busyTimes = value as Partial<BusyTimesByDay>;

  return {
    sunday: busyTimes.sunday ?? [],
    monday: busyTimes.monday ?? [],
    tuesday: busyTimes.tuesday ?? [],
    wednesday: busyTimes.wednesday ?? [],
    thursday: busyTimes.thursday ?? [],
    friday: busyTimes.friday ?? [],
    saturday: busyTimes.saturday ?? [],
  };
}

function normalizePreferences(
  preferences: Partial<PlannerPreferences> | null | undefined
): PlannerPreferences {
  return {
    minWorkHours:
      preferences?.minWorkHours ??
      DEFAULT_PLANNER_PREFERENCES.minWorkHours,

    maxWorkHours:
      preferences?.maxWorkHours ??
      DEFAULT_PLANNER_PREFERENCES.maxWorkHours,

    startSleepTime:
      formatTimeForInput(preferences?.startSleepTime) ||
      DEFAULT_PLANNER_PREFERENCES.startSleepTime,

    endSleepTime:
      formatTimeForInput(preferences?.endSleepTime) ||
      DEFAULT_PLANNER_PREFERENCES.endSleepTime,

    pomodoroWorkingMinutes:
      preferences?.pomodoroWorkingMinutes ??
      DEFAULT_PLANNER_PREFERENCES.pomodoroWorkingMinutes,

    pomodoroBreakMinutes:
      preferences?.pomodoroBreakMinutes ??
      DEFAULT_PLANNER_PREFERENCES.pomodoroBreakMinutes,

    planFailureDecision:
      preferences?.planFailureDecision ??
      DEFAULT_PLANNER_PREFERENCES.planFailureDecision,

    // IMPORTANT:
    // The backend currently doesn't return busyTimes,
    // so always provide a valid BusyTimesByDay object.
    // busyTimes: normalizeBusyTimes(preferences?.busyTimes),
  };
}

/**
 * Converts the frontend state into exactly what the
 * user-preferences API expects.
 *
 * Backend expects:
 * HH:mm
 *
 * Example:
 * "23:00"
 * "07:00"
 */
function toApiPayload(
  preferences: PlannerPreferences
): UpdatePlannerPreferencesRequest {
  return {
    minWorkHours: preferences.minWorkHours,
    maxWorkHours: preferences.maxWorkHours,

    startSleepTime: preferences.startSleepTime.slice(0, 5),
    endSleepTime: preferences.endSleepTime.slice(0, 5),

    pomodoroWorkingMinutes: preferences.pomodoroWorkingMinutes,
    pomodoroBreakMinutes: preferences.pomodoroBreakMinutes,

    planFailureDecision: preferences.planFailureDecision,
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

  // =========================
  // GET
  // =========================

  const fetchPreferences = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await userPreferencesService.getPreferences();

      if (data) {
        setPreferences(normalizePreferences(data));
        setHasPreferences(true);
      } else {
        // No preferences yet → use defaults
        setPreferences(DEFAULT_PLANNER_PREFERENCES);
        setHasPreferences(false);
      }
    } catch (error) {
      console.error(
        "Failed to fetch planner preferences:",
        error
      );

      setError("فشل تحميل تفضيلات المخطط.");

      // Still give the UI valid defaults
      setPreferences(DEFAULT_PLANNER_PREFERENCES);
      setHasPreferences(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // =========================
  // POST
  // =========================

  const createPreferences = useCallback(
    async (data: PlannerPreferences) => {
      try {
        setIsSaving(true);
        setError(null);

        const payload = toApiPayload(data);

        console.log(
          "🔥 CREATE PREFERENCES PAYLOAD:",
          JSON.stringify(payload, null, 2)
        );

        const created =
          await userPreferencesService.createPreferences(payload);

        if (created) {
          setPreferences(normalizePreferences(created));
        } else {
          setPreferences(normalizePreferences(data));
        }

        setHasPreferences(true);

        return created;
      } catch (error) {
        console.error(
          "Failed to create planner preferences:",
          error
        );

        setError("فشل حفظ تفضيلات المخطط.");
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  // =========================
  // PUT
  // =========================

  const updatePreferences = useCallback(
    async (data: PlannerPreferences) => {
      try {
        setIsSaving(true);
        setError(null);

        const payload = toApiPayload(data);

        console.log(
          "🔥 UPDATE PREFERENCES PAYLOAD:",
          JSON.stringify(payload, null, 2)
        );

        const updated =
          await userPreferencesService.updatePreferences(payload);

        console.log("Updated preferences:", updated);

        if (updated) {
          setPreferences(normalizePreferences(updated));
        } else {
          setPreferences(normalizePreferences(data));
        }

        setHasPreferences(true);

        return updated;
      } catch (error) {
        console.error(
          "Failed to update planner preferences:",
          error
        );

        setError("فشل تحديث تفضيلات المخطط.");
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  // =========================
  // DELETE
  // =========================

  const deletePreferences = useCallback(async () => {
    try {
      setIsSaving(true);
      setError(null);

      await userPreferencesService.deletePreferences();

      setPreferences(DEFAULT_PLANNER_PREFERENCES);
      setHasPreferences(false);
    } catch (error) {
      console.error(
        "Failed to delete planner preferences:",
        error
      );

      setError("فشل حذف تفضيلات المخطط.");
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, []);

  // =========================
  // INITIAL FETCH
  // =========================

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