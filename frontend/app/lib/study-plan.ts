import {
  StudyPlanItem,
  StudyPlanItemStatus,
  StudySessionDto,
  StudySessionStatus,
} from "@/app/services/motqin";
import { ExecutionSession, ExecutionTask } from "@/app/types/execution-board.types";
import { PlannerDay, Task } from "@/app/types/planner.types";
import { elapsedSinceStart, restoreSessionClock } from "@/app/lib/session-clock";

const completedStatus: number = StudyPlanItemStatus.Completed;

// goalCategoryId now points at one of the user's own goals (GET /users/goals),
// so it says nothing about the *kind* of work — only whether the plan is tied
// to a lesson does.
const categoryFor = (item: StudyPlanItem): Task["category"] =>
  item.lessonId ? "lesson" : "other";

// Backend priority is a focus slot: 1 = do first, 2 = next, 3 = then; 0 or
// anything else is an extra task.
const priorityFor = (priority: number): Task["priority"] => {
  if (priority === 1) return "high";
  if (priority === 2) return "medium";
  return "low";
};

export const studyPlanToPlannerTask = (item: StudyPlanItem): Task => ({
  id: String(item.id),
  title: item.title,
  completed: item.status === completedStatus,
  category: categoryFor(item),
  estimatedTimeMinutes: item.durationInMinutes,
  priority: priorityFor(item.priority),
  priorityValue: item.priority,
  source: item.toBePlanned ? "ai" : "manual",
});

export const studyPlanToExecutionTask = (item: StudyPlanItem): ExecutionTask => ({
  id: String(item.id),
  kind: "daily",
  title: item.title,
  goalCategoryId: item.goalCategoryId ?? undefined,
  priority: item.priority,
  date: item.date,
  estimatedMinutes: item.durationInMinutes,
  completed: item.status === completedStatus,
  notes: item.userNotes.join("\n") || item.systemNotes.join("\n"),
});

const sessionStatus = (status: number): ExecutionSession["status"] => {
  if (status === StudySessionStatus.Completed) return "completed";
  if (status === StudySessionStatus.InProgress) return "active";
  if (status === StudySessionStatus.Paused) return "paused";
  return "idle";
};

// How far a running/paused session's clock has run. The server only tells
// us the status, so this comes from the local clock record, falling back to
// the server's startTime for a session this browser never saw run.
const elapsedSecondsFor = (session: StudySessionDto, status: ExecutionSession["status"]) => {
  const total = session.durationInMinutes * 60;
  if (status === "completed") return total;
  if (status === "idle") return 0;

  const stored = restoreSessionClock(String(session.id), status === "active");
  const elapsed = stored ?? (status === "active" ? elapsedSinceStart(session.startTime) : null) ?? 0;
  return Math.min(elapsed, total);
};

export const studySessionToExecutionSession = (
  session: StudySessionDto,
  taskId: string,
  fallbackTitle: string,
): ExecutionSession => {
  const status = sessionStatus(session.status);
  const elapsedSeconds = elapsedSecondsFor(session, status);
  return {
    id: String(session.id),
    taskId,
    title: session.description || fallbackTitle,
    sessionDurationMinutes: session.durationInMinutes,
    actualMinutes: Math.floor(elapsedSeconds / 60),
    elapsedSeconds,
    notes: session.notes?.join("\n") ?? "",
    status,
  };
};

export const studyPlanSessions = (items: StudyPlanItem[]): ExecutionSession[] =>
  items.flatMap((item) =>
    item.studySessions.map((session) =>
      studySessionToExecutionSession(session, String(item.id), item.title),
    ),
  );

export const dateOnly = (value: Date) =>
  `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;

export const currentWeekDates = (weekOffset = 0) => {
  const today = new Date();
  const sunday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - today.getDay() + weekOffset * 7,
  );
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(sunday);
    date.setDate(sunday.getDate() + index);
    return dateOnly(date);
  });
};

export const formatPlannerDate = (date: string) => {
  const value = new Date(`${date}T00:00:00`);
  return `${String(value.getDate()).padStart(2, "0")}/${String(value.getMonth() + 1).padStart(2, "0")}`;
};

export const applyStudyPlansToDay = (day: PlannerDay, items: StudyPlanItem[]): PlannerDay => {
  const tasks = items.map(studyPlanToPlannerTask);
  return {
    ...day,
    date: formatPlannerDate(day.date),
    tasks,
    completedTasks: tasks.filter((task) => task.completed).length,
    totalTasks: tasks.length,
    workingHours: Math.round(tasks.reduce((sum, task) => sum + task.estimatedTimeMinutes, 0) / 60),
    focusSessions: items.reduce((sum, item) => sum + item.studySessions.length, 0),
  };
};