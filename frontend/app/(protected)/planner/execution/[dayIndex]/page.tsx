"use client";

import { useEffect, useMemo, useState } from "react";
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
import { studyPlansService } from "@/app/services/motqin";
import { currentWeekDates } from "@/app/lib/study-plan";

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
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ExecutionTask | null>(null);

  const sortByPriority = (items: ExecutionTask[]) =>
    [...items].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

  // Seed local state once the (mock, for now) data resolves. Adjusting
  // state during render instead of in an effect, per React's rules on
  // deriving state from props/query results.
  const [initializedFor, setInitializedFor] = useState<ExecutionBoardData | null | undefined>(undefined);
  if (data && data !== initializedFor) {
    setInitializedFor(data);
    setTasks(sortByPriority([...data.detail.dailyTasks, ...data.detail.revisionTasks]));
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

    void studyPlansService.update(Number(id), { status: completed ? 1 : 3 })
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
      const prioritized = next.map((task, index) => ({
        ...task,
        priority: index === 0 ? 3 : index === 1 ? 2 : index === 2 ? 1 : 0,
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

  const saveTaskFromDialog = (nextTask: ExecutionTask) => {
    setTasks((previous) => sortByPriority(previous.some((task) => task.id === nextTask.id)
      ? previous.map((task) => (task.id === nextTask.id ? nextTask : task))
      : [...previous, nextTask]));
    setEditingTask(null);
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
          onDeleteSession={deleteSession}
          onStartRevision={startRevision}
          onPostpone={postponeTask}
          onNotesChange={updateTaskNotes}
          onEdit={setEditingTask}
          onDelete={deleteTask}
          onDropTask={reorderTasks}
        />

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
