import { StudyPlanItem } from "@/app/services/motqin";
import { ExecutionSession, ExecutionTask } from "@/app/types/execution-board.types";
import { PlannerDay, Task } from "@/app/types/planner.types";

const completedStatus = 1;

const categoryFor = (goalCategoryId: number): Task["category"] => {
  if (goalCategoryId === 2) return "revision";
  if (goalCategoryId === 3) return "other";
  return "lesson";
};

const priorityFor = (priority: number): Task["priority"] => {
  if (priority >= 2) return "high";
  if (priority === 1) return "medium";
  return "low";
};

export const studyPlanToPlannerTask = (item: StudyPlanItem): Task => ({
  id: String(item.id),
  title: item.title,
  completed: item.status === completedStatus,
  category: categoryFor(item.goalCategoryId),
  estimatedTimeMinutes: item.durationInMinutes,
  priority: priorityFor(item.priority),
  source: item.toBePlanned ? "ai" : "manual",
});

export const studyPlanToExecutionTask = (item: StudyPlanItem): ExecutionTask => ({
  id: String(item.id),
  kind: item.goalCategoryId === 2 ? "revision" : "daily",
  title: item.title,
  estimatedMinutes: item.durationInMinutes,
  completed: item.status === completedStatus,
  notes: [...item.systemNotes, ...item.userNotes].join("\n"),
});

const sessionStatus = (status: number): ExecutionSession["status"] => {
  if (status === 1) return "completed";
  if (status === 4) return "active";
  if (status === 3) return "paused";
  return "idle";
};

export const studyPlanSessions = (items: StudyPlanItem[]): ExecutionSession[] =>
  items.flatMap((item) =>
    item.studySessions.map((session) => ({
      id: String(session.id),
      taskId: String(item.id),
      title: session.description || item.title,
      sessionDurationMinutes: session.durationInMinutes,
      actualMinutes:
        session.status === 1 ? session.durationInMinutes : 0,
      status: sessionStatus(session.status),
    })),
  );

export const dateOnly = (value: Date) =>
  `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;

export const currentWeekDates = () => {
  const today = new Date();
  const sunday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
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