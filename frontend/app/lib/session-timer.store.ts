import { create } from "zustand";
import { persist } from "zustand/middleware";

// The one study session on the clock, app-wide. The execution board starts
// it; GlobalSessionTimer (mounted in the protected layout) keeps it ticking
// on every page, ends it on the server when its time is up, and shows the
// floating countdown. Persisted so a reload picks the clock back up.
//
// The clock is wall-clock based (elapsed = elapsedAtStart + time since
// startedAt) rather than incremented per tick, so it stays right when the
// browser throttles background timers or the tab was closed for a while.

export interface RunningSession {
  sessionId: string;
  taskId: string;
  title: string;
  taskTitle?: string;
  durationSeconds: number;
  // Where the session lives, for the "go to the board" link.
  dayIndex: number;
  weekOffset: number;
}

export type SessionTimerStatus = "active" | "finished";

interface SessionTimerState {
  session: RunningSession | null;
  status: SessionTimerStatus;
  elapsedAtStart: number; // seconds already on the clock when it was (re)started
  startedAt: number; // epoch ms
  // Epoch ms the clock ran out; drives the 20-second ring and the
  // "finished" look of the floating box until it's dismissed.
  finishedAt: number | null;

  start: (session: RunningSession, elapsedSeconds: number) => void;
  finish: () => void;
  clear: () => void;
}

export const useSessionTimerStore = create<SessionTimerState>()(
  persist(
    (set) => ({
      session: null,
      status: "active",
      elapsedAtStart: 0,
      startedAt: 0,
      finishedAt: null,

      start: (session, elapsedSeconds) =>
        set({ session, status: "active", elapsedAtStart: elapsedSeconds, startedAt: Date.now(), finishedAt: null }),
      finish: () => set({ status: "finished", finishedAt: Date.now() }),
      clear: () => set({ session: null, status: "active", elapsedAtStart: 0, startedAt: 0, finishedAt: null }),
    }),
    { name: "motqin:session-timer" },
  ),
);

/** Seconds on the clock right now (capped at the session's length). */
export const elapsedSecondsOf = (state: Pick<SessionTimerState, "session" | "status" | "elapsedAtStart" | "startedAt">) => {
  if (!state.session) return 0;
  if (state.status === "finished") return state.session.durationSeconds;
  const elapsed = state.elapsedAtStart + Math.floor((Date.now() - state.startedAt) / 1000);
  return Math.min(state.session.durationSeconds, Math.max(0, elapsed));
};
