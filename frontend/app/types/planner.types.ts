

export type TaskCategory =
  | "revision"
  | "quiz"
  | "lesson"
  | "competition"
  | "project"
  | "other";

export type TaskPriority =
  | "low"
  | "medium"
  | "high";

export type TaskSource =
  | "manual"
  | "ai"
  | "goal";

export interface Task {
  id: string;
  title: string;
  completed: boolean;

  category: TaskCategory;

  estimatedTimeMinutes: number;

  priority: TaskPriority;

  source: TaskSource;
}

export interface Session {
  id: string;

//   taskId: string;

  title: string;

  completed: boolean;

  sessionDuration: number;

  actualMinutes: number;

  status:
    | "paused"
    | "idle"
    | "active"
    | "completed";
}