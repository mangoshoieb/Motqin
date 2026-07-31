import { ExecutionTask } from "@/app/types/execution-board.types";

// In-memory only (resets on reload) — a mock stand-in for a real "reschedule
// task" endpoint. Postponing a task appends it here; useExecutionBoard's
// fetch merges whatever's queued for a day into that day's detail, so it
// reliably shows up whenever that day is loaded, regardless of query-cache
// timing. Swap for a real backend call once one exists.
const postponed = new Map<number, ExecutionTask[]>();

export function addPostponedTask(targetDayIndex: number, task: ExecutionTask) {
  const existing = postponed.get(targetDayIndex) ?? [];
  postponed.set(targetDayIndex, [...existing, task]);
}

export function getPostponedTasks(dayIndex: number): ExecutionTask[] {
  return postponed.get(dayIndex) ?? [];
}
