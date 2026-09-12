export type TaskCategory =
  | "revision"
  | "quiz"
  | "lesson"
  | "competition"
  | "project"
  | "other";

export type TaskPriority = "low" | "medium" | "high";

export type TaskSource = "manual" | "ai" | "goal";

export interface Task {
  id: string;
  title: string;
  completed: boolean;

  category: TaskCategory;

  estimatedTimeMinutes: number;

  priority: TaskPriority;
  // Raw backend value: 1 = do first (★★★), 2 = next (★★), 3 = then (★);
  // anything else is an extra task with no stars.
  priorityValue?: number;

  source: TaskSource;
}

export interface Session {
  id: string;

  //   taskId: string;

  title: string;

  completed: boolean;

  sessionDuration: number;

  actualMinutes: number;

  status: "paused" | "idle" | "active" | "completed";
}

export type Mood = "مذهل" | "ممتاز" | "جيد" | "متوسط";

export interface PlannerDay {
  index: number;
  dayName: string;
  date: string;
  completedTasks: number;
  totalTasks: number;
  workingHours: number;
  focusSessions: number;
  mood: Mood;
  tasks: Task[];
  sessions: Session[];
  isToday?: boolean;
}
