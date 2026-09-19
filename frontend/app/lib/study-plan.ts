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

// Priority is a focus slot, not a score: 1 = the one task to do first
// (three stars), 2 = next (two stars), 3 = then (one star). Anything else
// (0 / unset) is an extra task with no stars, listed after the three.
export const priorityRank = (priority?: number) =>
  priority && priority >= 1 && priority <= 3 ? priority : Number.MAX_SAFE_INTEGER;

export const sortByPriority = <T>(items: T[], priorityOf: (item: T) => number | undefined): T[] =>
  [...items].sort((a, b) => priorityRank(priorityOf(a)) - priorityRank(priorityOf(b)));

// Lowest free slot among 1..3 for a task joining a day, or 0 when all
// three are taken.
export const nextFreePriority = (taken: (number | undefined)[]) => {
  const used = new Set(taken);
  return [1, 2, 3].find((slot) => !used.has(slot)) ?? 0;
};

// Position is priority: the first three rows take slots 1, 2, 3 and the
// rest lose their stars.
export const priorityForPosition = (index: number) => (index < 3 ? index + 1 : 0);

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

export const completedSessionHours = (items: StudyPlanItem[]) => {
  const minutes = items.reduce(
    (sum, item) =>
      sum +
      item.studySessions
        .filter((session) => session.status === StudySessionStatus.Completed)
        .reduce((total, session) => total + session.durationInMinutes, 0),
    0,
  );
  return Math.round(minutes / 6) / 10;
};

// How a day's studied hours compare with the user's daily limits (planner
// preferences). `future` for days that haven't come yet; `unknown` when
// the limits aren't available.
export type HoursStatus = "future" | "below" | "within" | "above" | "unknown";

export const hoursStatusFor = (
  hours: number,
  limits: { min: number; max: number } | null | undefined,
  isFuture: boolean,
): HoursStatus => {
  if (isFuture) return "future";
  if (!limits || limits.max <= 0) return "unknown";
  if (hours < limits.min) return "below";
  if (hours > limits.max) return "above";
  return "within";
};

export const applyStudyPlansToDay = (day: PlannerDay, items: StudyPlanItem[]): PlannerDay => {
  const tasks = sortByPriority(items.map(studyPlanToPlannerTask), (task) => task.priorityValue);
  return {
    ...day,
    date: formatPlannerDate(day.date),
    tasks,
    completedTasks: tasks.filter((task) => task.completed).length,
    totalTasks: tasks.length,
    // Hours actually studied: the day's completed focus sessions, to one
    // decimal — not the tasks' planned estimates.
    workingHours: completedSessionHours(items),
    focusSessions: items.reduce((sum, item) => sum + item.studySessions.length, 0),
  };
};