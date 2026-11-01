"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { distractionBlockerService } from "@/app/services/distraction-blocker.service";
import { getBlockerError, isBlockerLocked, parseUtc } from "@/app/lib/distraction-blocker";
import {
  BlockerSettings,
  BlockerSettingsInput,
  BlockSchedule,
  BlockScheduleInput,
} from "@/app/types/distraction-blocker.types";

export const BLOCKER_KEYS = {
  settings: ["distraction-blocker", "settings"] as const,
  schedules: ["distraction-blocker", "schedules"] as const,
};

export const useBlockerSettings = () =>
  useQuery({ queryKey: BLOCKER_KEYS.settings, queryFn: distractionBlockerService.getSettings });

export const useBlockSchedules = () =>
  useQuery({ queryKey: BLOCKER_KEYS.schedules, queryFn: distractionBlockerService.listSchedules });

// A blocker_locked refusal means the cached lock state is stale (the mentor
// locked it, or the 15-minute window ran out) — refetch it so the lock UI
// shows up without a reload.
const useRefreshLockOnRefusal = () => {
  const queryClient = useQueryClient();
  return (error: unknown) => {
    if (getBlockerError(error)?.code === "blocker_locked") {
      queryClient.invalidateQueries({ queryKey: BLOCKER_KEYS.settings });
    }
  };
};

export const useUpdateBlockerSettings = () => {
  const queryClient = useQueryClient();
  const onError = useRefreshLockOnRefusal();
  return useMutation({
    mutationFn: (input: BlockerSettingsInput) => distractionBlockerService.updateSettings(input),
    onSuccess: (saved) => queryClient.setQueryData(BLOCKER_KEYS.settings, saved),
    onError,
  });
};

export const useCreateSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BlockScheduleInput) => distractionBlockerService.createSchedule(input),
    onSuccess: (created) =>
      queryClient.setQueryData<BlockSchedule[]>(BLOCKER_KEYS.schedules, (current) =>
        current ? [...current, created] : [created],
      ),
  });
};

export const useUpdateSchedule = () => {
  const queryClient = useQueryClient();
  const refreshLock = useRefreshLockOnRefusal();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: BlockScheduleInput }) =>
      distractionBlockerService.updateSchedule(id, input),
    onSuccess: (updated) =>
      queryClient.setQueryData<BlockSchedule[]>(BLOCKER_KEYS.schedules, (current) =>
        current?.map((schedule) => (schedule.id === updated.id ? updated : schedule)),
      ),
    onError: (error) => {
      refreshLock(error);
      // Back in step with the server — the schedule may have been changed
      // or deleted from the phone.
      queryClient.invalidateQueries({ queryKey: BLOCKER_KEYS.schedules });
    },
  });
};

export const useDeleteSchedule = () => {
  const queryClient = useQueryClient();
  const refreshLock = useRefreshLockOnRefusal();
  return useMutation({
    mutationFn: (id: number) => distractionBlockerService.deleteSchedule(id),
    onSuccess: (_, id) =>
      queryClient.setQueryData<BlockSchedule[]>(BLOCKER_KEYS.schedules, (current) =>
        current?.filter((schedule) => schedule.id !== id),
      ),
    onError: (error) => {
      refreshLock(error);
      queryClient.invalidateQueries({ queryKey: BLOCKER_KEYS.schedules });
    },
  });
};

export const useRequestUnlockCode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: distractionBlockerService.requestUnlockCode,
    onError: (error) => {
      // The mentor dropped the lock meanwhile.
      if (getBlockerError(error)?.code === "blocker_not_locked") {
        queryClient.invalidateQueries({ queryKey: BLOCKER_KEYS.settings });
      }
    },
  });
};

export const useVerifyUnlockCode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => distractionBlockerService.verifyUnlockCode(code),
    onSuccess: (state) => {
      queryClient.setQueryData<BlockerSettings>(BLOCKER_KEYS.settings, (current) =>
        current ? { ...current, unlockedUntil: state.unlockedUntil } : current,
      );
      queryClient.invalidateQueries({ queryKey: BLOCKER_KEYS.settings });
    },
    onError: (error) => {
      if (getBlockerError(error)?.code === "blocker_not_locked") {
        queryClient.invalidateQueries({ queryKey: BLOCKER_KEYS.settings });
      }
    },
  });
};

/**
 * The mentor lock as the UI needs it. `isLocked` flips back on by itself
 * the moment the 15-minute unlock window passes, so buttons re-lock without
 * a refetch.
 */
export function useBlockerLock() {
  const { data: settings } = useBlockerSettings();
  const [now, setNow] = useState(() => Date.now());

  const unlockedUntil = settings?.lockedByMentor ? parseUtc(settings.unlockedUntil) : null;
  const untilMs = unlockedUntil?.getTime() ?? null;

  // Re-read the clock whenever the window changes, then tick once a minute
  // while it's open (for the "باقي" countdown) and exactly at its end.
  useEffect(() => {
    const sync = () => setNow(Date.now());
    const first = setTimeout(sync, 0);
    if (untilMs === null || untilMs <= Date.now()) return () => clearTimeout(first);

    const tick = setInterval(sync, 60_000);
    const end = setTimeout(sync, untilMs - Date.now() + 500);
    return () => {
      clearTimeout(first);
      clearInterval(tick);
      clearTimeout(end);
    };
  }, [untilMs]);

  const isLocked = isBlockerLocked(settings, now);
  return {
    lockedByMentor: settings?.lockedByMentor ?? false,
    isLocked,
    // Set only while an unlock window is open.
    unlockedUntil: !isLocked && unlockedUntil && untilMs! > now ? unlockedUntil : null,
    minutesLeft: untilMs && untilMs > now ? Math.ceil((untilMs - now) / 60_000) : 0,
  };
}
