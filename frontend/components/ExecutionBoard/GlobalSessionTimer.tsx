"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { StudySessionStatus, studySessionsService } from "@/app/services/motqin";
import { toastApiError } from "@/app/lib/api-error";
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

  // The clock is persisted, so a reload picks it back up — including one
  // pointing at a session the server has since paused, split or ended, which
  // would otherwise count down forever on every page. Check each restored
  // session once; a session started in this page's lifetime is ours already.
  const validatedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!session || validatedRef.current === session.sessionId) return;
    validatedRef.current = session.sessionId;
    if (Date.now() - useSessionTimerStore.getState().startedAt < 30_000) return;

    void studySessionsService
      .getById(Number(session.sessionId))
      .then((dto) => {
        if (dto.status === StudySessionStatus.InProgress) return;
        // Something else may have taken the clock while this was in flight.
        if (useSessionTimerStore.getState().session?.sessionId !== session.sessionId) return;
        console.warn("[SESSION CLOCK] restored clock is not running on the server", {
          sessionId: session.sessionId,
          status: dto.status,
        });
        clearSessionClock(session.sessionId);
        clear();
      })
      // Offline or a failed lookup is no reason to throw away a running clock.
      .catch(() => undefined);
  }, [session, clear]);

  // Since when this timer has actually been watching the current session,
  // and where its clock stood then. Ending a session is destructive — the
  // backend closes it and trims it to the time worked — so it may only
  // happen on time this timer saw pass, never on a figure reconstructed
  // from storage or from the server's own startTime.
  const watching = useRef<{ since: number; from: number } | null>(null);
  const sessionId = session?.sessionId;
  useEffect(() => {
    watching.current = sessionId
      ? { since: Date.now(), from: elapsedSecondsOf(useSessionTimerStore.getState()) }
      : null;
  }, [sessionId]);

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

    // The clock says the session is over. Believe it only if the time it
    // claims was spent has really gone by while this timer watched: a clock
    // that arrives already expired belongs to a session whose state we've
    // lost track of, and ending that would destroy the user's planned time.
    const watch = watching.current;
    const remainingWhenSeen = session.durationSeconds - (watch?.from ?? 0);
    const watchedSeconds = watch ? (Date.now() - watch.since) / 1000 : 0;
    // Either the clock was already spent when this timer picked it up, or
    // the time it says was spent has not actually gone by since.
    if (!watch || remainingWhenSeen <= 0 || watchedSeconds + 2 < remainingWhenSeen) {
      console.warn("[SESSION CLOCK] refusing to end a session that arrived expired", {
        sessionId: session.sessionId,
        elapsed,
        durationSeconds: session.durationSeconds,
        watchedSeconds: Math.round(watchedSeconds),
      });
      clearSessionClock(session.sessionId);
      clear();
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
      .catch((error) => toastApiError("تعذر إنهاء الجلسة على الخادم", error));
  }, [session, status, elapsed, finish, clear, queryClient, now]);

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
    const running = session;
    saveSessionClock(running.sessionId, current, false);
    clear();
    try {
      await studySessionsService.pause(Number(running.sessionId));
      queryClient.invalidateQueries({ queryKey: ["study-plans"] });
      queryClient.invalidateQueries({ queryKey: ["execution-board"] });
    } catch (error) {
      // The server refused, so it's still running there — put the box back
      // on the clock rather than leaving it gone with the session alive.
      saveSessionClock(running.sessionId, current, true);
      useSessionTimerStore.getState().start(running, current);
      toastApiError("تعذر إيقاف الجلسة مؤقتًا", error);
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
