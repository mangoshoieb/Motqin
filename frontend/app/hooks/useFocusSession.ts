"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FocusSessionStatus, FocusSessionSummary } from "@/app/types/focus.types";

// The one part of this feature that genuinely works in a browser today. No API
// and no companion app: a countdown, plus the Page Visibility API to count how
// often the student left the tab mid-session.
//
// That leave-count is the honest limit of what a web page can observe about
// focus — it knows when its own tab was hidden, and nothing more. It cannot
// tell whether the student switched to a lecture PDF or to Instagram, so the
// UI presents it as a neutral "you left the page N times", never as an
// accusation.
//
// Time is tracked against a wall-clock deadline rather than by counting ticks.
// Browsers throttle timers in background tabs to roughly once a minute, so a
// tick-counting clock would stall precisely when the student leaves the page —
// the exact case this feature exists to measure.
export function useFocusSession(initialMinutes: number) {
  const [status, setStatus] = useState<FocusSessionStatus>("idle");
  const [durationMinutes, setDurationMinutes] = useState(initialMinutes);
  const [remainingSeconds, setRemainingSeconds] = useState(initialMinutes * 60);
  const [leaveCount, setLeaveCount] = useState(0);
  const [summary, setSummary] = useState<FocusSessionSummary | null>(null);

  const deadlineRef = useRef<number | null>(null);
  // Mirrors leaveCount so the interval callback can build a summary without
  // being torn down and rebuilt on every tab switch.
  const leaveCountRef = useRef(0);

  const finish = useCallback(
    (focusedSeconds: number) => {
      deadlineRef.current = null;
      setSummary({
        durationMinutes,
        focusedSeconds,
        leaveCount: leaveCountRef.current,
      });
      setStatus("completed");
    },
    [durationMinutes]
  );

  // Recomputes from the deadline on every tick, so returning to a throttled
  // background tab snaps straight to the correct remaining time.
  useEffect(() => {
    if (status !== "running") return;

    const tick = () => {
      if (deadlineRef.current === null) return;

      const remaining = Math.max(
        0,
        Math.round((deadlineRef.current - Date.now()) / 1000)
      );
      setRemainingSeconds(remaining);

      if (remaining === 0) finish(durationMinutes * 60);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [status, durationMinutes, finish]);

  // Count every time the tab is hidden while a session is running.
  useEffect(() => {
    if (status !== "running") return;

    const handleVisibility = () => {
      if (!document.hidden) return;
      leaveCountRef.current += 1;
      setLeaveCount(leaveCountRef.current);
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [status]);

  // Warn before a refresh or close throws the session away. Browsers show
  // their own generic wording here; the message string is ignored.
  useEffect(() => {
    if (status !== "running" && status !== "paused") return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [status]);

  const start = useCallback(() => {
    leaveCountRef.current = 0;
    deadlineRef.current = Date.now() + durationMinutes * 60 * 1000;
    setLeaveCount(0);
    setSummary(null);
    setRemainingSeconds(durationMinutes * 60);
    setStatus("running");
  }, [durationMinutes]);

  const pause = useCallback(() => {
    deadlineRef.current = null; // remainingSeconds already holds the truth
    setStatus("paused");
  }, []);

  const resume = useCallback(() => {
    deadlineRef.current = Date.now() + remainingSeconds * 1000;
    setStatus("running");
  }, [remainingSeconds]);

  // Ending early still produces a summary — the time already spent counts, and
  // hiding it would punish stopping honestly.
  const stop = useCallback(() => {
    finish(durationMinutes * 60 - remainingSeconds);
  }, [finish, durationMinutes, remainingSeconds]);

  const reset = useCallback(() => {
    deadlineRef.current = null;
    leaveCountRef.current = 0;
    setStatus("idle");
    setSummary(null);
    setLeaveCount(0);
    setRemainingSeconds(durationMinutes * 60);
  }, [durationMinutes]);

  // Changing the length only makes sense before a session starts.
  const changeDuration = useCallback(
    (minutes: number) => {
      if (status !== "idle") return;
      setDurationMinutes(minutes);
      setRemainingSeconds(minutes * 60);
    },
    [status]
  );

  const totalSeconds = durationMinutes * 60;
  const progress = totalSeconds > 0 ? (totalSeconds - remainingSeconds) / totalSeconds : 0;

  return {
    status,
    durationMinutes,
    remainingSeconds,
    leaveCount,
    progress,
    summary,
    start,
    pause,
    resume,
    stop,
    reset,
    changeDuration,
  };
}
