"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useExecutionBoard, ExecutionBoardData } from "@/app/hooks/useExecutionBoard";
import { ExecutionSession, ExecutionTask } from "@/app/types/execution-board.types";
import { ExecutionBoardHeader } from "@/components/ExecutionBoard/ExecutionBoardHeader";
import { ExecutionTaskList } from "@/components/ExecutionBoard/ExecutionTaskList";

const ExecutionBoardPage = () => {
  const params = useParams();
  const router = useRouter();
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
    const map = new Map<string, ExecutionSession>();
    for (const s of sessions) map.set(s.taskId, s);
    return map;
  }, [sessions]);

  const toggleTaskComplete = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const startOrToggleDailySession = (task: ExecutionTask) => {
    setSessions((prev) => {
      const existing = prev.find((s) => s.taskId === task.id);
      if (!existing) {
        return [
          ...prev,
          {
            id: crypto.randomUUID(),
            taskId: task.id,
            title: `جلسة ${task.title}`,
            sessionDurationMinutes: task.estimatedMinutes,
            actualMinutes: 0,
            status: "active",
          },
        ];
      }
      if (existing.status === "completed") return prev;
      return prev.map((s) =>
        s.id === existing.id ? { ...s, status: s.status === "active" ? "paused" : "active" } : s
      );
    });
  };

  const startRevision = (task: ExecutionTask) => {
    if (!task.quizLink) return;
    const { subjectIdSlug, lessonId, category } = task.quizLink;
    router.push(`/subjects/${subjectIdSlug}/${lessonId}/quiz?category=${encodeURIComponent(category)}`);
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
    <div dir="rtl" className="min-h-screen bg-zinc-100 dark:bg-zinc-950 px-6 py-10">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
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

        <ExecutionTaskList
          title="المهام اليومية"
          tasks={dailyTasks}
          sessionsByTaskId={sessionsByTaskId}
          onToggleComplete={toggleTaskComplete}
          onStartDaily={startOrToggleDailySession}
        />

        <ExecutionTaskList
          title="مهام المراجعة (التكرار المتباعد)"
          tasks={revisionTasks}
          sessionsByTaskId={sessionsByTaskId}
          onToggleComplete={toggleTaskComplete}
          onStartRevision={startRevision}
        />
      </div>
    </div>
  );
};

export default ExecutionBoardPage;
