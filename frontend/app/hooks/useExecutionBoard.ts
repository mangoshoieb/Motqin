"use client";

import { useQuery } from "@tanstack/react-query";
import { weekData } from "@/app/data/days";
import { executionBoardData } from "@/app/data/executionBoard";
import { ExecutionDayDetail } from "@/app/types/execution-board.types";
import { PlannerDay } from "@/app/types/planner.types";

export interface ExecutionBoardData {
  day: PlannerDay;
  detail: ExecutionDayDetail;
}

// Mock for now — there is no backend endpoint yet that returns a
// day-shaped plan (see the planner review). This is the single seam to
// replace with a real fetch (e.g. GET /api/planner/execution/{dayIndex})
// once one exists; the returned shape is what the page/components consume,
// so nothing downstream should need to change.
async function fetchExecutionBoard(dayIndex: number): Promise<ExecutionBoardData | null> {
  const day = weekData.find((d) => d.index === dayIndex);
  const detail = executionBoardData.find((d) => d.dayIndex === dayIndex);
  if (!day || !detail) return null;
  return { day, detail };
}

export const useExecutionBoard = (dayIndex: number) => {
  return useQuery({
    queryKey: ["execution-board", dayIndex],
    queryFn: () => fetchExecutionBoard(dayIndex),
    enabled: Number.isFinite(dayIndex),
  });
};
