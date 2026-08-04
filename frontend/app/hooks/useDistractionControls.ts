"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { distractionControls as controlsMock } from "@/app/data/focus";
import {
  BlockedAppId,
  BlockingMode,
  DistractionControls,
} from "@/app/types/focus.types";

// UI only — no endpoints exist yet. Every mutation below writes to the React
// Query cache and nothing else, so changes survive tab switches but not a
// refresh. Kept as mutations rather than local component state so that wiring
// the real API later is a change to `mutationFn` and nothing else.

const FOCUS_KEYS = {
  controls: ["distraction-controls"] as const,
};

async function fetchControls(): Promise<DistractionControls> {
  return controlsMock;
}

export const useDistractionControls = () =>
  useQuery({ queryKey: FOCUS_KEYS.controls, queryFn: fetchControls });

// Shared cache writer — every mutation here is "read the controls, change one
// field, put them back", so the pattern lives in one place.
const useControlsMutation = <TInput>(
  apply: (controls: DistractionControls, input: TInput) => DistractionControls
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TInput) => input,
    onSuccess: (input) => {
      queryClient.setQueryData<DistractionControls>(FOCUS_KEYS.controls, (prev) =>
        prev ? apply(prev, input) : prev
      );
    },
  });
};

export const useToggleAppBlock = () =>
  useControlsMutation<BlockedAppId>((controls, appId) => ({
    ...controls,
    apps: controls.apps.map((app) =>
      app.appId === appId ? { ...app, blocked: !app.blocked } : app
    ),
  }));

export const useSetBlockingMode = () =>
  useControlsMutation<BlockingMode>((controls, mode) => ({ ...controls, mode }));

export const useToggleBlocking = () =>
  useControlsMutation<void>((controls) => ({
    ...controls,
    isActive: !controls.isActive,
  }));

// Adding a supervisor lands in "pending" — the mentor has to confirm by email
// before the lock means anything. Showing it as active immediately would
// promise a lock that isn't in place yet.
export const useAddSupervisor = () =>
  useControlsMutation<string>((controls, email) => ({
    ...controls,
    supervisor: {
      email,
      addedAt: new Date().toISOString(),
      status: "pending",
    },
  }));

export const useRemoveSupervisor = () =>
  useControlsMutation<void>((controls) => ({ ...controls, supervisor: null }));
