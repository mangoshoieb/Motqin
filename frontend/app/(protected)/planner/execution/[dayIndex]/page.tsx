"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useExecutionBoard, ExecutionBoardData } from "@/app/hooks/useExecutionBoard";
import { weekData } from "@/app/data/days";
import { addPostponedTask } from "@/app/data/postponedTasksStore";
import { ExecutionSession, ExecutionTask } from "@/app/types/execution-board.types";
import { ExecutionBoardHeader } from "@/components/ExecutionBoard/ExecutionBoardHeader";
import { ExecutionTaskList } from "@/components/ExecutionBoard/ExecutionTaskList";
import { ExecutionNotesSummary } from "@/components/ExecutionBoard/ExecutionNotesSummary";

const ExecutionBoardPage = () => {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const dayIndex = Number(params.dayIndex);

  const { data, isLoading } = useExecutionBoard(dayIndex);

  const [tasks, setTasks] = useState<ExecutionTask[]>([]);
  const [sessions, setSessions] = useState<ExecutionSession[]>([]);

  // Seed local state once the (mock, for now) data resolves. Adjusting
  // state during render instead of in an effect, per React's rules on
  // deriving state from props/query results.
  const [initializedFor, setInitializedFor] = useState<ExecutionBoardData | null | undefined>(undefined);
  if (data && data !== initializedFor) {
    setInitializedFor(data);
    setTasks([...data.detail.dailyTasks, ...data.detail.revisionTasks]);
    setSessions(data.detail.sessions);
  }

  // Ticks any "active" daily-task session once a second (1 tick = 1
  // displayed minute, for a demo pace).
  useEffect(() => {
    const interval = setInterval(() => {
      setSessions((prev) =>
        prev.map((s) => {
          if (s.status !== "active") return s;
          const nextMinutes = s.actualMinutes + 1;
          if (nextMinutes >= s.sessionDurationMinutes) {
            return { ...s, actualMinutes: s.sessionDurationMinutes, status: "completed" };
          }
          return { ...s, actualMinutes: nextMinutes };
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const dailyTasks = tasks.filter((t) => t.kind === "daily");
  const revisionTasks = tasks.filter((t) => t.kind === "revision");

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
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const updateTaskNotes = (id: string, notes: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, notes } : t)));
  };

  // Only one session is ever "active" app-wide — starting or resuming one
  // pauses whatever else was running, matching how a person actually studies.
  const addSessionForTask = (task: ExecutionTask) => {
    setSessions((prev) => {
      const pausedOthers = prev.map((s) => (s.status === "active" ? { ...s, status: "paused" as const } : s));
      const sessionNumber = pausedOthers.filter((s) => s.taskId === task.id).length + 1;
      return [
        ...pausedOthers,
        {
          id: crypto.randomUUID(),
          taskId: task.id,
          title: `جلسة ${sessionNumber}`,
          sessionDurationMinutes: task.estimatedMinutes,
          actualMinutes: 0,
          status: "active",
        },
      ];
    });
  };

  const toggleSession = (sessionId: string) => {
    setSessions((prev) => {
      const target = prev.find((s) => s.id === sessionId);
      if (!target || target.status === "completed") return prev;
      const makeActive = target.status !== "active";
      return prev.map((s) => {
        if (s.id === sessionId) return { ...s, status: makeActive ? "active" : "paused" };
        if (makeActive && s.status === "active") return { ...s, status: "paused" };
        return s;
      });
    });
  };

  const deleteSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
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
    addPostponedTask(targetDayIndex, { ...task, completed: false });
    queryClient.invalidateQueries({ queryKey: ["execution-board", targetDayIndex] });
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    setSessions((prev) => prev.filter((s) => s.taskId !== task.id));
    toast.success("تم إرسال المهمة إلى الغد");
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ExecutionTaskList
            title="المهام اليومية"
            tasks={dailyTasks}
            sessionsByTaskId={sessionsByTaskId}
            onToggleComplete={toggleTaskComplete}
            onAddSession={addSessionForTask}
            onToggleSession={toggleSession}
            onDeleteSession={deleteSession}
            onPostpone={postponeTask}
            onNotesChange={updateTaskNotes}
          />

          <ExecutionTaskList
            title="مهام المراجعة (التكرار المتباعد)"
            tasks={revisionTasks}
            sessionsByTaskId={sessionsByTaskId}
            onToggleComplete={toggleTaskComplete}
            onStartRevision={startRevision}
            onPostpone={postponeTask}
            onNotesChange={updateTaskNotes}
          />
        </div>

        <ExecutionNotesSummary tasks={tasks} />
      </div>
    </div>
  );
};

export default ExecutionBoardPage;
