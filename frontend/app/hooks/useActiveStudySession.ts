"use client";

import { useQuery } from "@tanstack/react-query";
import { ActiveStudySessionDto, studySessionsService } from "@/app/services/motqin";
import { parseServerDate } from "@/app/lib/session-clock";
import { RunningSession } from "@/app/lib/session-timer.store";

export const ACTIVE_STUDY_SESSION_KEY = ["study-session", "active"] as const;

// What the server says is running right now — a session, or the break after
// one. The source of truth for every timer after a crash, a closed tab or a
// second device: checked on load, every minute, and when the tab regains
// focus.
export const useActiveStudySession = () =>
  useQuery({
    queryKey: ACTIVE_STUDY_SESSION_KEY,
    queryFn: studySessionsService.getActive,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    // Scoped to the signed-in user; asking without a session is a 401.
    enabled: typeof window !== "undefined" && !!localStorage.getItem("accessToken"),
  });

export const ADDITIONAL_TIME_KEY = ["study-session", "additional-time"] as const;

// The extra-minutes ("bonus") timer after a session ends. The server decides
// whether it shows and from how many seconds, so it survives reloads, a
// closed app and other devices; asked on every open, on focus, and whenever
// a session starts, ends or a break begins.
export const useAdditionalTime = () =>
  useQuery({
    queryKey: ADDITIONAL_TIME_KEY,
    queryFn: studySessionsService.getAdditionalTime,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    enabled: typeof window !== "undefined" && !!localStorage.getItem("accessToken"),
  });

// Seconds the server reported, plus however long ago it reported them.
export const secondsNow = (seconds: number | null | undefined, fetchedAt: number) =>
  Math.max(0, (seconds ?? 0) + Math.floor((Date.now() - fetchedAt) / 1000));

const sundayOf = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());

// The app-wide clock's view of a session the server is running, for one this
// tab never started. The board day is the day it started on (Sunday-based
// weeks, the same numbering the execution board's URL uses).
export const runningSessionFromActive = (active: ActiveStudySessionDto): RunningSession => {
  const { session } = active;
  const started = new Date(parseServerDate(session.startTime) ?? Date.now());
  const weekOffset = Math.round(
    (sundayOf(started).getTime() - sundayOf(new Date()).getTime()) / (7 * 24 * 60 * 60 * 1000),
  );
  return {
    sessionId: String(session.id),
    taskId: String(session.studyPlanId),
    title: session.description || "جلسة مذاكرة",
    durationSeconds: session.durationInMinutes * 60,
    dayIndex: started.getDay() + 1,
    weekOffset,
  };
};
