import { TaskPriority } from "./planner.types";

export type GoalType = "study" | "revision" | "other";

export type GoalSource = "systematic" | "regular";

export interface GoalSubTask {
  id: string;
  title: string;
  dayIndex: number;
  estimatedMinutes: number;
}

export interface Goal {
  id: string;
  title: string;
  source: GoalSource;

  subjectId?: number;
  subjectName?: string;
  lessonId?: number;
  lessonName?: string;

  goalType: GoalType;
  estimatedHours: number;
  breakdownCount: number;
  priority: TaskPriority;
  rolloverToNextWeek: boolean;

  subTasks: GoalSubTask[];
}
