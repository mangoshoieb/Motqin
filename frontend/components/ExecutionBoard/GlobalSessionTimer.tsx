"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { studySessionsService } from "@/app/services/motqin";
import { clearSessionClock, saveSessionClock } from "@/app/lib/session-clock";
import { notifySessionFinished, startSessionRing } from "@/app/lib/session-alerts";
import { elapsedSecondsOf, useSessionTimerStore } from "@/app/lib/session-timer.store";
import { FloatingSessionTimer } from "./FloatingSessionTimer";

/**
 * Keeps the one running study session on the clock from any page: ticks
 * it, ends it on the server when its time is up (ringing for 20 seconds and
 * sending a notification), and renders the pinned countdown. Mounted once,
 * in the protected layout; the execution board reads the same store.
 */
export const GlobalSessionTimer = () => {
  const queryClient = useQueryClient();
  const session = useSessionTimerStore((s) => s.session);
  const status = useSessionTimerStore((s) => s.status);
  const finishedAt = useSessionTimerStore((s) => s.finishedAt);
  const finish = useSessionTimerStore((s) => s.finish);
  const clear = useSessionTimerStore((s) => s.clear);

  // Re-render once a second while something is on the clock. The elapsed
  // time itself is computed from the wall clock, so this only refreshes.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!session) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [session]);

  // `now` is only here to recompute once a second.
  const elapsed = session && now ? elapsedSecondsOf(useSessionTimerStore.getState()) : 0;

  // Time's up → ring + notify + end on the server. Guarded so a re-render
  // (or React strict mode) can't end the same session twice.
  const endedRef = useRef<string | null>(null);
  const stopRingRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (!session || status !== "active") return;
    if (elapsed < session.durationSeconds) {
      saveSessionClock(session.sessionId, elapsed, true);
      return;
    }
    if (endedRef.current === session.sessionId) return;
    endedRef.current = session.sessionId;

    finish();
    stopRingRef.current?.();
    stopRingRef.current = startSessionRing();
    notifySessionFinished(session.title);
    clearSessionClock(session.sessionId);

    void studySessionsService
      .end(Number(session.sessionId))
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["study-plans"] });
        queryClient.invalidateQueries({ queryKey: ["execution-board"] });
      })
      .catch(() => toast.error("تعذر إنهاء الجلسة على الخادم"));
  }, [session, status, elapsed, finish, queryClient, now]);

  // Stop the ring when the box is dismissed or the timer is replaced/unmounted.
  useEffect(() => {
    if (!session || status !== "finished") stopRingRef.current?.();
  }, [session, status]);
  useEffect(() => () => stopRingRef.current?.(), []);

  if (!session) return null;

  // Pausing from another page: the server splits the session (the rest of
  // the time becomes a new session), so the clock here simply stops; the
  // board shows the new session the next time it's opened.
  const pause = async () => {
    const current = elapsedSecondsOf(useSessionTimerStore.getState());
    saveSessionClock(session.sessionId, current, false);
    clear();
    try {
      await studySessionsService.pause(Number(session.sessionId));
      queryClient.invalidateQueries({ queryKey: ["study-plans"] });
      queryClient.invalidateQueries({ queryKey: ["execution-board"] });
    } catch {
      toast.error("تعذر إيقاف الجلسة مؤقتًا");
    }
  };

  return (
    <FloatingSessionTimer
      title={session.title}
      taskTitle={session.taskTitle}
      durationSeconds={session.durationSeconds}
      elapsedSeconds={elapsed}
      finished={status === "finished"}
      finishedForSeconds={finishedAt ? Math.floor((now - finishedAt) / 1000) : 0}
      boardHref={`/planner/execution/${session.dayIndex}?week=${session.weekOffset}`}
      onPause={() => void pause()}
      onDismiss={() => {
        stopRingRef.current?.();
        clear();
      }}
    />
  );
};
