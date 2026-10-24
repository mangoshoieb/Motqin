"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { StudySessionStatus, studySessionsService } from "@/app/services/motqin";
import { toastApiError } from "@/app/lib/api-error";
import { clearSessionClock, saveSessionClock } from "@/app/lib/session-clock";
import { notifySessionFinished, startSessionRing } from "@/app/lib/session-alerts";
import { elapsedSecondsOf, useSessionTimerStore } from "@/app/lib/session-timer.store";
import {
  ACTIVE_STUDY_SESSION_KEY,
  runningSessionFromActive,
  secondsNow,
  useActiveStudySession,
} from "@/app/hooks/useActiveStudySession";
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

  // The server can stop a session without this tab doing anything — paused
  // or split from another device, or ended as Missed when it decided the app
  // was gone. A clock still counting then is a lie, and pausing it can only
  // fail ("Only in-progress sessions … can be paused"). So the clock follows
  // the server: drop it, refresh the board, and say what happened.
  const dropIfStopped = useCallback(
    async (sessionId: string) => {
      const dto = await studySessionsService.getById(Number(sessionId)).catch(() => null);
      // Offline or a failed lookup is no reason to throw away a running clock.
      if (!dto || dto.status === StudySessionStatus.InProgress) return false;
      // Something else may have taken the clock while this was in flight.
      if (useSessionTimerStore.getState().session?.sessionId !== sessionId) return true;
      console.warn("[SESSION CLOCK] clock is running but the server's session is not", {
        sessionId,
        status: dto.status,
      });
      clearSessionClock(sessionId);
      clear();
      queryClient.invalidateQueries({ queryKey: ["study-plans"] });
      queryClient.invalidateQueries({ queryKey: ["execution-board"] });
      toast.info(
        dto.status === StudySessionStatus.Missed
          ? "توقفت هذه الجلسة على الخادم وأصبحت فائتة — أكّدها أو احذفها من لوحة التنفيذ"
          : "هذه الجلسة لم تعد جارية على الخادم",
      );
      return true;
    },
    [clear, queryClient],
  );

  // When this tab last started, stopped or re-timed the clock itself. An
  // answer from GET /active that's older than that predates the change (a
  // start or pause still on its way), so it isn't allowed to undo it. Each
  // change also asks for a fresh answer once the server has caught up.
  const localChangeAt = useRef(0);
  useEffect(
    () =>
      useSessionTimerStore.subscribe((next, prev) => {
        if (next.session?.sessionId === prev.session?.sessionId && next.startedAt === prev.startedAt) return;
        localChangeAt.current = Date.now();
        window.setTimeout(
          () => queryClient.invalidateQueries({ queryKey: ACTIVE_STUDY_SESSION_KEY }),
          3000,
        );
      }),
    [queryClient],
  );

  // The clock follows the server (GET /study-session/active — on load, every
  // minute, and on focus). That's what brings a timer back after a crash, a
  // closed tab or a reload, on another device too, and with the server's own
  // elapsed time rather than this device's clock.
  const { data: active, dataUpdatedAt } = useActiveStudySession();
  useEffect(() => {
    if (active === undefined || dataUpdatedAt <= localChangeAt.current) return;
    const store = useSessionTimerStore.getState();
    const clock = store.session;
    // A clock that ran out is ringing / being ended — leave it be.
    if (store.status === "finished") return;

    const running = active && !active.isOnBreak ? active : null;
    if (!running) {
      // Nothing running there: the clock is stale (paused elsewhere, ended,
      // or marked Missed) — dropIfStopped confirms and says which. Not in
      // the first seconds of a start, while the server may still be on it.
      if (clock && Date.now() - store.startedAt > 15_000) void dropIfStopped(clock.sessionId);
      return;
    }

    const serverElapsed = secondsNow(running.elapsedSeconds, dataUpdatedAt);
    if (clock?.sessionId === String(running.session.id)) {
      // Same session — correct any drift from this device's clock.
      if (Math.abs(elapsedSecondsOf(store) - serverElapsed) > 3) store.start(clock, serverElapsed);
      return;
    }

    // The server is running a session this tab isn't timing (the app was
    // closed mid-session, or it was started elsewhere): pick it up. Only one
    // runs at a time, so whatever this tab was timing has stopped.
    if (clock) clearSessionClock(clock.sessionId);
    store.start(runningSessionFromActive(running), serverElapsed);
    queryClient.invalidateQueries({ queryKey: ["execution-board"] });
  }, [active, dataUpdatedAt, dropIfStopped, queryClient]);

  // Since when this timer has actually been watching the current session,
  // and where its clock stood then. Ending a session is destructive — the
  // backend closes it and trims it to the time worked — so it may only
  // happen on time this timer saw pass, never on a figure reconstructed
  // from storage or from the server's own startTime.
  // A restart of the same session (the server correcting the elapsed time)
  // starts the watch over from the corrected figure.
  const watching = useRef<{ since: number; from: number } | null>(null);
  const sessionId = session?.sessionId;
  const startedAt = useSessionTimerStore((s) => s.startedAt);
  useEffect(() => {
    watching.current = sessionId
      ? { since: Date.now(), from: elapsedSecondsOf(useSessionTimerStore.getState()) }
      : null;
  }, [sessionId, startedAt]);

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
      // A refusal doesn't mean it's still running: the server may already
      // have stopped it (e.g. as Missed). Put the box back on the clock only
      // if the server says it really is running — restoring it blindly is
      // what left a dead session ticking with every pause failing.
      useSessionTimerStore.getState().start(running, current);
      if (await dropIfStopped(running.sessionId)) return;
      saveSessionClock(running.sessionId, current, true);
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
