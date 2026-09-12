import { TaskPriority } from "./planner.types";

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

  // The user's own goal this item contributes to (GET /users/goals). Sent to
  // the study-plan APIs as `goalCategoryId`.
  goalCategoryId: number | null;
  goalCategoryTitle?: string;

  // Free-form guidance for the AI planner, sent as `userNotes`.
  notes: string;

  estimatedHours: number;
  breakdownCount: number;
  priority: TaskPriority;
  rolloverToNextWeek: boolean;

  subTasks: GoalSubTask[];
}
