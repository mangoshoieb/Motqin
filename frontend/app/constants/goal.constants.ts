import { GoalType } from "../types/goal.types";
import { TaskPriority } from "../types/planner.types";

export const goalTypeOptions: { value: GoalType; label: string }[] = [
  { value: "study", label: "دراسة" },
  { value: "revision", label: "مراجعة" },
  { value: "other", label: "أخرى" },
];

export const goalPriorityOptions: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "منخفضة" },
  { value: "medium", label: "متوسطة" },
  { value: "high", label: "عالية" },
];

// Generic weekday order used when planning next week's goals — not tied to
// the current week's dated PlannerDay entries, since next week's dates
// aren't known/rendered on this page.
export const WEEKDAY_NAMES = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];
