"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useExecutionBoard, ExecutionBoardData } from "@/app/hooks/useExecutionBoard";
import { useBreakMinutes } from "@/app/hooks/useBreakMinutes";
import { weekData } from "@/app/data/days";
import { addPostponedTask } from "@/app/data/postponedTasksStore";
import { BreakTimer, ExecutionSession, ExecutionTask } from "@/app/types/execution-board.types";
import { ExecutionBoardHeader } from "@/components/ExecutionBoard/ExecutionBoardHeader";
import { ExecutionTaskList } from "@/components/ExecutionBoard/ExecutionTaskList";
import { AddTaskDialog } from "@/components/ExecutionBoard/AddTaskDialog";
import { ConfirmDialog } from "@/components/ExecutionBoard/ConfirmDialog";
import { AddCompletedSessionDialog } from "@/components/ExecutionBoard/AddCompletedSessionDialog";
import { StudyPlanDuration, studyPlansService, studySessionsService } from "@/app/services/motqin";
import {
  currentWeekDates,
  nextFreePriority as nextFreePrioritySlot,
  priorityForPosition,
  sortByPriority as sortTasksByPriority,
  sortSessionsByOrder,
  studySessionToExecutionSession,
} from "@/app/lib/study-plan";
import { clearSessionClock, saveSessionClock } from "@/app/lib/session-clock";
import { primeSessionAlerts } from "@/app/lib/session-alerts";
import { toastApiError } from "@/app/lib/api-error";
import { elapsedSecondsOf, useSessionTimerStore } from "@/app/lib/session-timer.store";
import { API_ROUTES } from "@/app/constants/planner.constants";

const ExecutionBoardPage = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const dayIndex = Number(params.dayIndex);
  const parsedWeek = Number(searchParams.get("week") ?? "0");
  // Any earlier week (the planner board pages back through them), this
  // week, or next week — never further ahead than that.
  const weekOffset = Number.isFinite(parsedWeek) ? Math.min(1, Math.trunc(parsedWeek)) : 0;

  const { data, isLoading } = useExecutionBoard(dayIndex, weekOffset);
  // Session and break lengths, from the user's saved planner preferences.
  const { sessionMinutes, breakMinutes } = useBreakMinutes();

  const [tasks, setTasks] = useState<ExecutionTask[]>([]);
  const [sessions, setSessions] = useState<ExecutionSession[]>([]);
  // `?addTask=1` (from the week board's "إضافة مهمة") opens the dialog on
  // arrival; the param is dropped from the URL so a refresh doesn't reopen it.
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(searchParams.get("addTask") === "1");
  useEffect(() => {
    if (searchParams.get("addTask") === "1") {
      router.replace(`/planner/execution/${dayIndex}?week=${weekOffset}`);
    }
    // Only on mount — the param is consumed once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [editingTask, setEditingTask] = useState<ExecutionTask | null>(null);
  const [sessionPendingDelete, setSessionPendingDelete] = useState<ExecutionSession | null>(null);
  // The task whose "add a finished session" dialog is open (null = closed).
  const [completedSessionTask, setCompletedSessionTask] = useState<ExecutionTask | null>(null);
  // Only one break runs at a time; it counts up and turns into "overrun"
  // once it passes the preference's break length.
  const [breakTimer, setBreakTimer] = useState<BreakTimer | null>(null);

  // Priority slots (1 = ★★★, 2 = ★★, 3 = ★, else no stars) — the same
  // helpers drive the week board so both views order tasks identically.
  const sortByPriority = (items: ExecutionTask[]) =>
    sortTasksByPriority(items, (task) => task.priority);
  const nextFreePriority = (items: ExecutionTask[]) =>
    nextFreePrioritySlot(items.map((task) => task.priority));

  // Seed local state once the (mock, for now) data resolves. Adjusting
  // state during render instead of in an effect, per React's rules on
  // deriving state from props/query results.
  const [initializedFor, setInitializedFor] = useState<ExecutionBoardData | null | undefined>(undefined);
  if (data && data !== initializedFor) {
    setInitializedFor(data);
    setTasks(sortByPriority([...data.detail.dailyTasks, ...data.detail.revisionTasks]));
    // A refetch (e.g. after a pause) replaces the list, but the overtime
    // counter is local-only — carry it over for sessions that are still there.
    setSessions((previous) =>
      data.detail.sessions.map((session) => {
        const local = previous.find((s) => s.id === session.id);
        return local?.overtimeRunning
          ? { ...session, overtimeRunning: true, overtimeSeconds: local.overtimeSeconds }
          : session;
      }),
    );
  }

  // Pulls the day's tasks and sessions back from the server (the pause
  // endpoint splits a session in two, so the list changes underneath us),
  // then marks the task complete once every one of its sessions is — unless
  // the server already did.
  const refetchBoard = async (taskId?: string) => {
    const boardKey = ["execution-board", dayIndex, weekOffset];
    await queryClient.refetchQueries({ queryKey: boardKey });
    const fresh = queryClient.getQueryData<ExecutionBoardData | null>(boardKey);
    if (!fresh || !taskId) return;

    const task = fresh.detail.dailyTasks.find((t) => t.id === taskId);
    const taskSessions = fresh.detail.sessions.filter((s) => s.taskId === taskId);
    const allDone = taskSessions.length > 0 && taskSessions.every((s) => s.status === "completed");
    if (!task || task.completed || !allDone) return;

    try {
      await studyPlansService.toggleStatus(Number(taskId));
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, completed: true } : t)));
      queryClient.invalidateQueries({ queryKey: ["study-plans"] });
      toast.success("اكتملت المهمة");
    } catch {
      toast.error("تعذر حفظ حالة المهمة");
    }
  };

  // The ticker below runs off an interval that is set up once, so it reads
  // the sessions through a ref instead of a stale closure.
  const sessionsRef = useRef<ExecutionSession[]>([]);
  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);
  const tasksRef = useRef<ExecutionTask[]>([]);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  const setSessionStatus = (sessionId: string, status: ExecutionSession["status"]) =>
    setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, status } : s)));

  // Non-zero while a start/pause round-trip is in flight. The rows and the
  // app-wide clock are allowed to disagree until it settles, so the
  // reconciliation below must keep its hands off.
  const sessionRequests = useRef(0);

  // What the app-wide clock needs to know about a session to run it. Reads
  // the tasks through their ref, so it stays stable for the ticker below.
  const runningSessionFor = useCallback(
    (session: ExecutionSession) => ({
      sessionId: session.id,
      taskId: session.taskId,
      title: session.title,
      taskTitle: tasksRef.current.find((t) => t.id === session.taskId)?.title,
      durationSeconds: session.sessionDurationMinutes * 60,
      dayIndex,
      weekOffset,
    }),
    [dayIndex, weekOffset],
  );

  // The clock ran out (GlobalSessionTimer noticed, rang, and sent /end):
  // show the session as completed here and start its overtime counter,
  // which keeps running until the student saves or dismisses it.
  const markSessionTimedOut = useCallback((sessionId: string) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              status: "completed",
              elapsedSeconds: s.sessionDurationMinutes * 60,
              actualMinutes: s.sessionDurationMinutes,
              overtimeRunning: true,
              overtimeSeconds: 0,
            }
          : s,
      ),
    );
    clearSessionClock(sessionId);
  }, []);

  // The clock is persisted, so it outlives the page — and it can outlive the
  // session it was timing too: paused from another device, split in two by a
  // pause, or ended. Whenever the server's own view of this day says that
  // session isn't running, the clock goes; otherwise the floating box counts
  // down against rows that sit at 00:00 with a play button.
  useEffect(() => {
    // Nothing to compare against until the day's own data is in: on the
    // first render `sessions` is empty simply because it hasn't loaded.
    if (isLoading || !data || sessionRequests.current > 0) return;

    const clock = useSessionTimerStore.getState();
    const running = clock.session;
    if (!running || clock.status === "finished") return;
    // Only this board's own day — the clock may be timing another day.
    if (running.dayIndex !== dayIndex || running.weekOffset !== weekOffset) return;
    if (sessions.some((s) => s.id === running.sessionId && s.status === "active")) return;

    console.warn("[SESSION CLOCK] dropping a clock the server isn't running", running.sessionId);
    // The stored record stays: it holds the seconds this session actually
    // worked, and it is what a later restore reads instead of falling back
    // to guessing from the server's startTime.
    clock.clear();
  }, [sessions, data, isLoading, dayIndex, weekOffset]);

  // Once a second: the break clock, overtime counters, and the running
  // session's elapsed time — which is read from the app-wide timer store
  // (GlobalSessionTimer keeps it going on every page, so the row here just
  // mirrors it).
  useEffect(() => {
    const interval = setInterval(() => {
      // The break clock, if one is running.
      setBreakTimer((prev) => (prev ? { ...prev, elapsedSeconds: prev.elapsedSeconds + 1 } : prev));

      // Overtime counters run independently of the (single) active session.
      if (sessionsRef.current.some((s) => s.overtimeRunning)) {
        setSessions((prev) =>
          prev.map((s) =>
            s.overtimeRunning ? { ...s, overtimeSeconds: (s.overtimeSeconds ?? 0) + 1 } : s,
          ),
        );
      }

      const active = sessionsRef.current.find((s) => s.status === "active");
      if (!active) return;

      const clock = useSessionTimerStore.getState();
      if (clock.session?.sessionId !== active.id) {
        // The server says it's running but nothing here is timing it (a
        // reload on another device, a cleared store): adopt it, from
        // wherever its clock was, so it keeps going.
        if (!clock.session) {
          // Reads only refs and the route's day, so the interval's closure
          // holding an older copy of this helper is harmless.
          clock.start(runningSessionFor(active), active.elapsedSeconds ?? active.actualMinutes * 60);
        }
        return;
      }

      if (clock.status === "finished") {
        markSessionTimedOut(active.id);
        return;
      }

      const elapsed = elapsedSecondsOf(clock);
      setSessions((prev) =>
        prev.map((s) =>
          s.id === active.id && s.elapsedSeconds !== elapsed
            ? { ...s, elapsedSeconds: elapsed, actualMinutes: Math.floor(elapsed / 60) }
            : s,
        ),
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [markSessionTimedOut, runningSessionFor, dayIndex, weekOffset]);

  // Each task's sessions, in orderInPlan order (see sortSessionsByOrder).
  const sessionsByTaskId = useMemo(() => {
    const map = new Map<string, ExecutionSession[]>();
    for (const s of sessions) {
      const list = map.get(s.taskId) ?? [];
      list.push(s);
      map.set(s.taskId, list);
    }
    for (const [taskId, list] of map) map.set(taskId, sortSessionsByOrder(list));
    return map;
  }, [sessions]);

  const toggleTaskComplete = (id: string) => {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;

    const completed = !task.completed;
    setTasks((prev) => prev.map((item) => (item.id === id ? { ...item, completed } : item)));

    void studyPlansService.toggleStatus(Number(id))
      .then(() => queryClient.invalidateQueries({ queryKey: ["study-plans"] }))
      .catch(() => {
        setTasks((prev) => prev.map((item) => (item.id === id ? { ...item, completed: task.completed } : item)));
        toast.error("تعذر حفظ حالة المهمة");
      });
  };

  const updateTaskNotes = (id: string, notes: string) => {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;

    setTasks((prev) => prev.map((item) => (item.id === id ? { ...item, notes } : item)));

    void studyPlansService.update(Number(id), {
      userNotes: notes.trim() ? [notes.trim()] : [],
    })
      .then(() => queryClient.invalidateQueries({ queryKey: ["study-plans"] }))
      .catch(() => {
        setTasks((prev) => prev.map((item) => (item.id === id ? { ...item, notes: task.notes } : item)));
        toast.error("تعذر حفظ ملاحظة المهمة");
      });
  };

  // Only one session runs app-wide, so starting one pauses whatever else was
  // running — on the server too, not just in local state. This is what makes
  // resuming a session match how a person actually studies.
  const startSession = async (sessionId: string) => {
    const running = sessionsRef.current.find((s) => s.status === "active" && s.id !== sessionId);
    const previous = sessionsRef.current.find((s) => s.id === sessionId)?.status ?? "idle";

    setSessionStatus(sessionId, "active");
    if (running) setSessionStatus(running.id, "paused");

    const starting = sessionsRef.current.find((s) => s.id === sessionId);
    const startingElapsed = starting?.elapsedSeconds ?? (starting?.actualMinutes ?? 0) * 60;
    saveSessionClock(sessionId, startingElapsed, true);
    if (running) saveSessionClock(running.id, running.elapsedSeconds ?? running.actualMinutes * 60, false);

    // From here on the app-wide clock (GlobalSessionTimer) times it.
    if (starting) {
      useSessionTimerStore.getState().start(runningSessionFor(starting), startingElapsed);
    }

    sessionRequests.current += 1;
    try {
      if (running) {
        console.log("[SESSION PAUSE] (auto, before start) request →", {
          method: "PUT",
          url: API_ROUTES.STUDY_SESSIONS.PAUSE(Number(running.id)),
          body: null,
        });
        const paused = await studySessionsService.pause(Number(running.id));
        console.log("[SESSION PAUSE] (auto, before start) response ←", paused);
        await refetchBoard(running.taskId);
        // The refetch re-seeded the list; put the one we're starting back to
        // active so the ticker picks it up.
        setSessionStatus(sessionId, "active");
      }
      console.log("[SESSION START] request →", {
        method: "PUT",
        url: API_ROUTES.STUDY_SESSIONS.START(Number(sessionId)),
        body: null,
        previousStatus: previous,
      });
      const started = await studySessionsService.start(Number(sessionId));
      console.log("[SESSION START] response ←", started);
      queryClient.invalidateQueries({ queryKey: ["study-plans"] });
    } catch (error) {
      setSessionStatus(sessionId, previous);
      if (running) setSessionStatus(running.id, "active");
      useSessionTimerStore.getState().clear();
      toastApiError("تعذر بدء الجلسة", error);
    } finally {
      sessionRequests.current -= 1;
    }
  };

  const pauseSession = async (sessionId: string) => {
    const pausing = sessionsRef.current.find((s) => s.id === sessionId);
    const elapsed = pausing?.elapsedSeconds ?? (pausing?.actualMinutes ?? 0) * 60;
    // Whether this session is the one on the app-wide clock decides what
    // has to be put back if the server refuses the pause.
    const onGlobalClock = useSessionTimerStore.getState().session?.sessionId === sessionId;

    setSessionStatus(sessionId, "paused");
    if (pausing) saveSessionClock(sessionId, elapsed, false);
    if (onGlobalClock) useSessionTimerStore.getState().clear();

    sessionRequests.current += 1;
    try {
      console.log("[SESSION PAUSE] request →", {
        method: "PUT",
        url: API_ROUTES.STUDY_SESSIONS.PAUSE(Number(sessionId)),
        body: null,
      });
      const paused = await studySessionsService.pause(Number(sessionId));
      console.log("[SESSION PAUSE] response ←", paused);
      queryClient.invalidateQueries({ queryKey: ["study-plans"] });
      // The server closed the worked part and opened a new session for the
      // remaining time — show that, and complete the task if nothing is left.
      await refetchBoard(pausing?.taskId);
    } catch (error) {
      toastApiError("تعذر إيقاف الجلسة مؤقتًا", error);

      // The request failed, but that doesn't mean the session is still
      // running — it may already have been paused or ended server-side, in
      // which case reverting to "active" is what makes it look unstoppable.
      // Ask the server and follow whatever it says.
      const fresh = await queryClient
        .refetchQueries({ queryKey: ["execution-board", dayIndex, weekOffset] })
        .then(() =>
          queryClient.getQueryData<ExecutionBoardData | null>([
            "execution-board",
            dayIndex,
            weekOffset,
          ]),
        )
        .catch(() => null);
      const serverSession = fresh?.detail.sessions.find((s) => s.id === sessionId);
      if (serverSession && serverSession.status !== "active") return;

      // Still running there, so put the whole UI back that way — row, stored
      // clock and floating box together. Leaving the clock cleared here is
      // what made the box vanish while the row kept ticking.
      setSessionStatus(sessionId, "active");
      saveSessionClock(sessionId, elapsed, true);
      if (onGlobalClock && pausing) {
        useSessionTimerStore.getState().start(runningSessionFor(pausing), elapsed);
      }
    } finally {
      sessionRequests.current -= 1;
    }
  };

  // Adds the session and leaves it idle: the user opens the card to rename
  // it or set its duration, then presses play to actually start it. It's
  // named after its task and lasts the preferred session length
  // (pomodoroWorkingMinutes), so the list reads well without editing.
  const addSessionForTask = async (task: ExecutionTask) => {
    const description = task.title;

    try {
      const created = await studySessionsService.create({
        studyPlanId: Number(task.id),
        date: data?.day.date ?? currentWeekDates(weekOffset)[dayIndex - 1],
        description,
        durationInMinutes: sessionMinutes,
        goalCategoryId: task.goalCategoryId,
      });

      const session = studySessionToExecutionSession(created, task.id, description);
      setSessions((prev) => [
        ...prev,
        {
          ...session,
          // The backend numbers it; if the response didn't say, it goes last.
          orderInPlan:
            session.orderInPlan ??
            Math.max(0, ...prev.filter((s) => s.taskId === task.id).map((s) => s.orderInPlan ?? 0)) + 1,
          sessionDurationMinutes: session.sessionDurationMinutes || sessionMinutes,
          actualMinutes: 0,
          elapsedSeconds: 0,
          status: "idle",
        },
      ]);
      queryClient.invalidateQueries({ queryKey: ["study-plans"] });
    } catch {
      toast.error("تعذر إنشاء الجلسة");
    }
  };

  // Credits the overtime to the session on the server, then hides the counter.
  const saveOvertime = async (sessionId: string) => {
    const target = sessions.find((s) => s.id === sessionId);
    if (!target?.overtimeRunning) return;

    const minutesToAdd = Math.max(1, Math.round((target.overtimeSeconds ?? 0) / 60));

    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, overtimeRunning: false } : s)),
    );

    try {
      await studySessionsService.addTime(Number(sessionId), minutesToAdd);
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                overtimeSeconds: 0,
                sessionDurationMinutes: s.sessionDurationMinutes + minutesToAdd,
                actualMinutes: s.actualMinutes + minutesToAdd,
                elapsedSeconds: (s.elapsedSeconds ?? s.actualMinutes * 60) + minutesToAdd * 60,
              }
            : s,
        ),
      );
      queryClient.invalidateQueries({ queryKey: ["study-plans"] });
      toast.success(`تمت إضافة ${minutesToAdd} دقيقة إلى الجلسة`);
    } catch {
      // Resume the counter so nothing the user worked is lost.
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, overtimeRunning: true } : s)),
      );
      toast.error("تعذر حفظ الوقت الإضافي");
    }
  };

  const dismissOvertime = (sessionId: string) =>
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId ? { ...s, overtimeRunning: false, overtimeSeconds: 0 } : s,
      ),
    );

  // Start a break after `sessionId`, optionally with time already on the
  // clock. A running session is paused first — you can't do both.
  const startBreak = (sessionId: string, initialSeconds = 0) => {
    const running = sessionsRef.current.find((s) => s.status === "active");
    if (running) void pauseSession(running.id);
    setBreakTimer({ afterSessionId: sessionId, elapsedSeconds: initialSeconds });
  };

  // Finishing a break records it against the session it followed — the
  // backend keeps that on the session itself (isBreakCompleted). The
  // endpoint is a toggle, so a break already on the record is left alone
  // rather than being flipped back off.
  const stopBreak = async () => {
    const finishing = breakTimer;
    setBreakTimer(null);
    if (!finishing) return;

    const session = sessionsRef.current.find((s) => s.id === finishing.afterSessionId);
    if (!session || session.breakCompleted) return;

    setSessions((prev) =>
      prev.map((s) => (s.id === session.id ? { ...s, breakCompleted: true } : s)),
    );

    try {
      const updated = await studySessionsService.toggleBreak(Number(session.id));
      setSessions((prev) =>
        prev.map((s) =>
          s.id === session.id ? { ...s, breakCompleted: updated?.isBreakCompleted ?? true } : s,
        ),
      );
      queryClient.invalidateQueries({ queryKey: ["execution-board"] });
    } catch (error) {
      setSessions((prev) =>
        prev.map((s) => (s.id === session.id ? { ...s, breakCompleted: false } : s)),
      );
      toastApiError("تعذر تسجيل الاستراحة", error);
    }
  };

  // Spend the bonus as rest instead of saving it: the break clock starts
  // from where the bonus left off (3:20 of bonus → break already at 3:20).
  const spendOvertimeAsBreak = (sessionId: string) => {
    const target = sessionsRef.current.find((s) => s.id === sessionId);
    if (!target?.overtimeRunning) return;
    dismissOvertime(sessionId);
    startBreak(sessionId, target.overtimeSeconds ?? 0);
  };

  const toggleSession = (sessionId: string) => {
    const target = sessions.find((s) => s.id === sessionId);
    if (!target || target.status === "completed") return;

    // Sound and notifications can only be enabled from a user gesture, so
    // this click is where they get unlocked.
    if (target.status !== "active") primeSessionAlerts();
    void (target.status === "active" ? pauseSession(sessionId) : startSession(sessionId));
  };



  // Each field in the expanded card saves on blur, so only what actually
  // changed goes in the PUT.
  const updateSession = (
    sessionId: string,
    changes: { title?: string; durationMinutes?: number; notes?: string },
  ) => {
    const target = sessions.find((s) => s.id === sessionId);
    if (!target) return;

    const title = changes.title?.trim();
    const nextTitle = title && title !== target.title ? title : undefined;
    const nextDuration =
      changes.durationMinutes && changes.durationMinutes > 0 &&
      changes.durationMinutes !== target.sessionDurationMinutes
        ? changes.durationMinutes
        : undefined;
    // Notes, unlike the title, may legitimately be cleared.
    const notes = changes.notes?.trim();
    const nextNotes = notes !== undefined && notes !== (target.notes ?? "").trim() ? notes : undefined;

    if (nextTitle === undefined && nextDuration === undefined && nextNotes === undefined) return;

    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              title: nextTitle ?? s.title,
              sessionDurationMinutes: nextDuration ?? s.sessionDurationMinutes,
              notes: nextNotes ?? s.notes,
            }
          : s,
      ),
    );

    void studySessionsService.update(Number(sessionId), {
      ...(nextTitle !== undefined ? { description: nextTitle } : {}),
      ...(nextDuration !== undefined ? { durationInMinutes: nextDuration } : {}),
      ...(nextNotes !== undefined ? { notes: nextNotes ? [nextNotes] : [] } : {}),
    })
      .then(() => queryClient.invalidateQueries({ queryKey: ["study-plans"] }))
      .catch(() => {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === sessionId
              ? {
                  ...s,
                  title: target.title,
                  sessionDurationMinutes: target.sessionDurationMinutes,
                  notes: target.notes,
                }
              : s,
          ),
        );
        toast.error("تعذر حفظ تعديلات الجلسة");
      });
  };

  const deleteSession = (sessionId: string) => {
    const index = sessions.findIndex((s) => s.id === sessionId);
    const target = sessions[index];
    if (!target) return;

    setSessionPendingDelete(null);

    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    clearSessionClock(sessionId);

    void studySessionsService.remove(Number(sessionId))
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["study-plans"] });
        toast.success("تم حذف الجلسة");
      })
      .catch(() => {
        setSessions((prev) => {
          const next = [...prev];
          next.splice(index, 0, target);
          return next;
        });
        toast.error("تعذر حذف الجلسة");
      });
  };

  const startRevision = (task: ExecutionTask) => {
    if (!task.quizLink) return;
    const { subjectIdSlug, lessonId, category } = task.quizLink;
    router.push(`/subjects/${subjectIdSlug}/${lessonId}/quiz?category=${encodeURIComponent(category)}`);
  };

  const isLastDay = dayIndex >= weekData.length;

  const postponeTask = (task: ExecutionTask) => {
    if (isLastDay) {
      toast.error("لا يوجد يوم تالٍ في هذا الأسبوع لإرسال المهمة إليه");
      return;
    }
    const targetDayIndex = dayIndex + 1;
    const targetDate = currentWeekDates(weekOffset)[targetDayIndex - 1];

    // Tomorrow may already have tasks in the focus slots — the moved task
    // takes the first free one there (or none), the way adding a task
    // does, instead of carrying today's slot along and duplicating stars.
    const movedWithFreeSlot = async () => {
      const tomorrow = await studyPlansService.filter({
        duration: StudyPlanDuration.CustomRange,
        startDate: targetDate,
        endDate: targetDate,
      });
      const priority = nextFreePrioritySlot(
        tomorrow.items.filter((item) => item.date === targetDate).map((item) => item.priority),
      );
      return studyPlansService.update(Number(task.id), { date: targetDate, priority });
    };

    void movedWithFreeSlot().then(async () => {
      // Today closes the gap the task left: the remaining tasks move up by
      // position, exactly as reordering would number them.
      const remaining = sortByPriority(tasks.filter((t) => t.id !== task.id)).map((t, index) => ({
        ...t,
        priority: priorityForPosition(index),
      }));
      setTasks(remaining);
      setSessions((prev) => prev.filter((s) => s.taskId !== task.id));
      toast.success("تم إرسال المهمة إلى الغد");
      await Promise.all(
        remaining
          .filter((t) => t.priority !== tasks.find((item) => item.id === t.id)?.priority)
          .map((t) => studyPlansService.update(Number(t.id), { priority: t.priority })),
      ).catch(() => toast.error("تعذر إعادة ترتيب أولويات اليوم"));
      queryClient.invalidateQueries({ queryKey: ["study-plans"] });
      queryClient.invalidateQueries({ queryKey: ["execution-board", targetDayIndex] });
    }).catch(() => {
      // Keep the task visible when the server rejects the move.
      addPostponedTask(targetDayIndex, { ...task, completed: false });
      toast.error("تعذر إرسال المهمة إلى الغد");
    });
  };

  const deleteTask = (task: ExecutionTask) => {
    if (!window.confirm("هل تريد حذف هذه المهمة؟")) return;
    void studyPlansService.remove(Number(task.id)).then(() => {
      setTasks((prev) => prev.filter((item) => item.id !== task.id));
      setSessions((prev) => prev.filter((session) => session.taskId !== task.id));
      queryClient.invalidateQueries({ queryKey: ["study-plans"] });
      toast.success("تم حذف المهمة");
    }).catch(() => toast.error("تعذر حذف المهمة"));
  };

  const reorderTasks = (draggedId: string, targetId: string) => {
    setTasks((previous) => {
      const next = [...previous];
      const from = next.findIndex((task) => task.id === draggedId);
      const to = next.findIndex((task) => task.id === targetId);
      if (from < 0 || to < 0) return previous;
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      // Position is priority: the first three rows take slots 1, 2, 3 and
      // the rest lose their stars.
      const prioritized = next.map((task, index) => ({
        ...task,
        priority: priorityForPosition(index),
      }));
      void Promise.all(
        prioritized
          .filter((task) => task.priority !== previous.find((item) => item.id === task.id)?.priority)
          .map((task) => studyPlansService.update(Number(task.id), { priority: task.priority })),
      ).then(() => queryClient.invalidateQueries({ queryKey: ["study-plans"] }))
        .catch(() => toast.error("تعذر حفظ ترتيب الأولويات"));
      return prioritized;
    });
  };

  const saveTaskFromDialog = (nextTask: ExecutionTask, createdSessions: ExecutionSession[]) => {
    const existing = tasks.find((task) => task.id === nextTask.id);

    if (existing) {
      // Edits keep whatever priority the backend already has for the task.
      setTasks((previous) =>
        sortByPriority(previous.map((task) => (task.id === nextTask.id ? { ...nextTask, priority: existing.priority } : task))),
      );
      // A duration change makes the server rebuild the task's sessions —
      // swap ours for the ones it returned so the clocks match.
      if (createdSessions.length > 0) {
        setSessions((previous) => [
          ...previous.filter((s) => s.taskId !== nextTask.id),
          ...createdSessions,
        ]);
      }
      setEditingTask(null);
      return;
    }

    // A new task takes the first free focus slot, and that goes to the
    // backend right away so a reload shows the same stars.
    const priority = nextFreePriority(tasks);
    const created = { ...nextTask, priority };
    setTasks((previous) => sortByPriority([...previous, created]));
    // The backend already generated this task's sessions — show them now
    // rather than after the next refetch.
    if (createdSessions.length > 0) {
      setSessions((previous) => [
        ...previous.filter((s) => s.taskId !== created.id),
        ...createdSessions,
      ]);
    }
    setEditingTask(null);

    if (priority > 0) {
      void studyPlansService.update(Number(created.id), { priority })
        .then(() => queryClient.invalidateQueries({ queryKey: ["study-plans"] }))
        .catch(() => toast.error("تعذر حفظ أولوية المهمة"));
    }
  };

  if (isLoading) {
    return (
      <div dir="rtl" className="p-10 text-zinc-500 dark:text-zinc-400">
        جاري تحميل لوحة التنفيذ...
      </div>
    );
  }

  if (!data) {
    return (
      <div dir="rtl" className="min-h-screen flex flex-col items-center justify-center gap-4 p-10 text-center">
        <p className="text-zinc-500 dark:text-zinc-400">لم يتم العثور على هذا اليوم</p>
        <Link href="/planner" className="text-blue-600 dark:text-blue-400 font-medium">
          العودة إلى المخطط
        </Link>
      </div>
    );
  }

  const tasksCompleted = tasks.filter((t) => t.completed).length;
  const totalStudyMinutes = sessions.reduce((sum, s) => sum + s.actualMinutes, 0);

  return (
    <div dir="rtl" className="min-h-screen bg-zinc-100 dark:bg-zinc-950 px-4 py-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        <ExecutionBoardHeader
          dayName={data.day.dayName}
          date={data.day.date}
          outputs={{
            tasksCompleted,
            totalTasks: tasks.length,
            totalSessions: sessions.length,
            totalStudyMinutes,
            quizAccuracy: data.detail.outputs.quizAccuracy,
          }}
        />

        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">مهام اليوم</h2>
          <button
            type="button"
            onClick={() => setIsAddTaskOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <span className="text-xl leading-none">+</span>
            إضافة مهمة
          </button>
        </div>

        <ExecutionTaskList
          title=""
          tasks={tasks}
          sessionsByTaskId={sessionsByTaskId}
          breakMinutes={breakMinutes}
          onToggleComplete={toggleTaskComplete}
          onAddSession={addSessionForTask}
          onAddCompletedSession={setCompletedSessionTask}
          onToggleSession={toggleSession}
          onSaveOvertime={(sessionId) => void saveOvertime(sessionId)}
          onDismissOvertime={dismissOvertime}
          onSpendOvertimeAsBreak={spendOvertimeAsBreak}
          breakTimer={breakTimer}
          onStartBreak={startBreak}
          onStopBreak={() => void stopBreak()}
          onUpdateSession={updateSession}
          onDeleteSession={(sessionId) =>
            setSessionPendingDelete(sessions.find((s) => s.id === sessionId) ?? null)
          }
          onStartRevision={startRevision}
          onPostpone={postponeTask}
          onNotesChange={updateTaskNotes}
          onEdit={setEditingTask}
          onDelete={deleteTask}
          onDropTask={reorderTasks}
        />

        {sessionPendingDelete && (
          <ConfirmDialog
            title="هل تريد حذف هذه الجلسة؟"
            description={`سيتم حذف "${sessionPendingDelete.title}" نهائيًا.`}
            confirmLabel="حذف"
            onConfirm={() => deleteSession(sessionPendingDelete.id)}
            onClose={() => setSessionPendingDelete(null)}
          />
        )}

        {completedSessionTask && (
          <AddCompletedSessionDialog
            task={completedSessionTask}
            boardDate={data.day.date}
            defaultMinutes={sessionMinutes}
            onCreated={() => void refetchBoard(completedSessionTask.id)}
            onClose={() => setCompletedSessionTask(null)}
          />
        )}

        {(isAddTaskOpen || editingTask) && (
          <AddTaskDialog
            date={data.day.date}
            task={editingTask ?? undefined}
            onClose={() => { setIsAddTaskOpen(false); setEditingTask(null); }}
            onCreated={saveTaskFromDialog}
          />
        )}

        <div className="hidden">
          {tasks.length}
        </div>

      </div>
    </div>
  );
};

export default ExecutionBoardPage;
