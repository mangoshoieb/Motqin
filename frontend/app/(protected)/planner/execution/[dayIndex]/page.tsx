"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useExecutionBoard, ExecutionBoardData } from "@/app/hooks/useExecutionBoard";
import { weekData } from "@/app/data/days";
import { addPostponedTask } from "@/app/data/postponedTasksStore";
import { ExecutionSession, ExecutionTask } from "@/app/types/execution-board.types";
import { ExecutionBoardHeader } from "@/components/ExecutionBoard/ExecutionBoardHeader";
import { ExecutionTaskList } from "@/components/ExecutionBoard/ExecutionTaskList";
import { AddTaskDialog } from "@/components/ExecutionBoard/AddTaskDialog";
import { ConfirmDialog } from "@/components/ExecutionBoard/ConfirmDialog";
import { studyPlansService, studySessionsService } from "@/app/services/motqin";
import { currentWeekDates, studySessionToExecutionSession } from "@/app/lib/study-plan";
import { clearSessionClock, saveSessionClock } from "@/app/lib/session-clock";

const ExecutionBoardPage = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const dayIndex = Number(params.dayIndex);
  const parsedWeek = Number(searchParams.get("week") ?? "0");
  const weekOffset = Number.isFinite(parsedWeek) ? Math.max(0, Math.min(1, parsedWeek)) : 0;

  const { data, isLoading } = useExecutionBoard(dayIndex, weekOffset);

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

  // Priority is a focus slot, not a score: 1 = the one task to do first
  // (three stars), 2 = next (two stars), 3 = then (one star). Anything else
  // (0 / unset) is an extra task with no stars, listed after the three.
  const priorityRank = (task: ExecutionTask) =>
    task.priority && task.priority >= 1 && task.priority <= 3 ? task.priority : Number.MAX_SAFE_INTEGER;
  const sortByPriority = (items: ExecutionTask[]) =>
    [...items].sort((a, b) => priorityRank(a) - priorityRank(b));

  // Lowest free slot among 1..3 for a task being added, or 0 when all
  // three are taken.
  const nextFreePriority = (items: ExecutionTask[]) => {
    const taken = new Set(items.map((task) => task.priority));
    return [1, 2, 3].find((slot) => !taken.has(slot)) ?? 0;
  };

  // Seed local state once the (mock, for now) data resolves. Adjusting
  // state during render instead of in an effect, per React's rules on
  // deriving state from props/query results.
  const [initializedFor, setInitializedFor] = useState<ExecutionBoardData | null | undefined>(undefined);
  if (data && data !== initializedFor) {
    setInitializedFor(data);
    setTasks(sortByPriority([...data.detail.dailyTasks, ...data.detail.revisionTasks]));
    setSessions(data.detail.sessions);
  }

  // The ticker below runs off an interval that is set up once, so it reads
  // the sessions through a ref instead of a stale closure.
  const sessionsRef = useRef<ExecutionSession[]>([]);
  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  const setSessionStatus = (sessionId: string, status: ExecutionSession["status"]) =>
    setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, status } : s)));

  // Guards the window between the timer running out and /end coming back,
  // so a session is only ever ended once.
  const endingRef = useRef<Set<string>>(new Set());

  // `timedOut` marks a session the clock finished (as opposed to the user
  // ending it early): those keep counting overtime until the user saves it.
  const finishSession = useCallback(
    async (sessionId: string, timedOut = false) => {
      if (endingRef.current.has(sessionId)) return;
      endingRef.current.add(sessionId);

      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                status: "completed",
                ...(timedOut ? { overtimeRunning: true, overtimeSeconds: 0 } : {}),
              }
            : s,
        ),
      );
      clearSessionClock(sessionId);

      try {
        await studySessionsService.end(Number(sessionId));
        queryClient.invalidateQueries({ queryKey: ["study-plans"] });
      } catch {
        // Back to paused rather than active: leaving it running would make
        // the ticker retry /end every second.
        setSessions((prev) =>
          prev.map((s) =>
            s.id === sessionId
              ? { ...s, status: "paused", overtimeRunning: false, overtimeSeconds: 0 }
              : s,
          ),
        );
        toast.error("تعذر إنهاء الجلسة");
      } finally {
        endingRef.current.delete(sessionId);
      }
    },
    [queryClient],
  );

  // Ticks the running session in real time — a session of 25 minutes takes 25
  // minutes — and ends it on the server once its time is up. Only one session
  // is ever running, so there is at most one to tick.
  useEffect(() => {
    const interval = setInterval(() => {
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

      const totalSeconds = active.sessionDurationMinutes * 60;
      const elapsed = (active.elapsedSeconds ?? active.actualMinutes * 60) + 1;

      if (elapsed < totalSeconds) {
        saveSessionClock(active.id, elapsed, true);
        setSessions((prev) =>
          prev.map((s) =>
            s.id === active.id
              ? { ...s, elapsedSeconds: elapsed, actualMinutes: Math.floor(elapsed / 60) }
              : s,
          ),
        );
        return;
      }

      setSessions((prev) =>
        prev.map((s) =>
          s.id === active.id
            ? { ...s, elapsedSeconds: totalSeconds, actualMinutes: s.sessionDurationMinutes }
            : s,
        ),
      );
      void finishSession(active.id, true);
    }, 1000);
    return () => clearInterval(interval);
  }, [finishSession]);

  const sessionsByTaskId = useMemo(() => {
    const map = new Map<string, ExecutionSession[]>();
    for (const s of sessions) {
      const list = map.get(s.taskId) ?? [];
      list.push(s);
      map.set(s.taskId, list);
    }
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
    saveSessionClock(sessionId, starting?.elapsedSeconds ?? (starting?.actualMinutes ?? 0) * 60, true);
    if (running) saveSessionClock(running.id, running.elapsedSeconds ?? running.actualMinutes * 60, false);

    try {
      if (running) await studySessionsService.pause(Number(running.id));
      await studySessionsService.start(Number(sessionId));
      queryClient.invalidateQueries({ queryKey: ["study-plans"] });
    } catch {
      setSessionStatus(sessionId, previous);
      if (running) setSessionStatus(running.id, "active");
      toast.error("تعذر بدء الجلسة");
    }
  };

  const pauseSession = async (sessionId: string) => {
    setSessionStatus(sessionId, "paused");
    const pausing = sessionsRef.current.find((s) => s.id === sessionId);
    if (pausing) saveSessionClock(sessionId, pausing.elapsedSeconds ?? pausing.actualMinutes * 60, false);

    try {
      await studySessionsService.pause(Number(sessionId));
      queryClient.invalidateQueries({ queryKey: ["study-plans"] });
    } catch {
      setSessionStatus(sessionId, "active");
      toast.error("تعذر إيقاف الجلسة مؤقتًا");
    }
  };

  // Adds the session and leaves it idle: the user opens the card to name it
  // and set its duration, then presses play to actually start it.
  const addSessionForTask = async (task: ExecutionTask) => {
    const sessionNumber = sessions.filter((s) => s.taskId === task.id).length + 1;
    const description = `جلسة ${sessionNumber}`;

    try {
      const created = await studySessionsService.create({
        studyPlanId: Number(task.id),
        date: data?.day.date ?? currentWeekDates(weekOffset)[dayIndex - 1],
        description,
        durationInMinutes: task.estimatedMinutes,
        goalCategoryId: task.goalCategoryId,
      });

      const session = studySessionToExecutionSession(created, task.id, description);
      setSessions((prev) => [
        ...prev,
        {
          ...session,
          sessionDurationMinutes: session.sessionDurationMinutes || task.estimatedMinutes,
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

  const toggleSession = (sessionId: string) => {
    const target = sessions.find((s) => s.id === sessionId);
    if (!target || target.status === "completed") return;

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

    void studyPlansService.update(Number(task.id), { date: targetDate }).then(() => {
      queryClient.invalidateQueries({ queryKey: ["study-plans"] });
      queryClient.invalidateQueries({ queryKey: ["execution-board", targetDayIndex] });
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      setSessions((prev) => prev.filter((s) => s.taskId !== task.id));
      toast.success("تم إرسال المهمة إلى الغد");
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
        priority: index < 3 ? index + 1 : 0,
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
          onToggleComplete={toggleTaskComplete}
          onAddSession={addSessionForTask}
          onToggleSession={toggleSession}
          onEndSession={(sessionId) => void finishSession(sessionId)}
          onSaveOvertime={(sessionId) => void saveOvertime(sessionId)}
          onDismissOvertime={dismissOvertime}
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
