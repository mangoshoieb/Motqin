"use client";

import { useQuery } from "@tanstack/react-query";
import { weekData } from "@/app/data/days";
import { getPostponedTasks } from "@/app/data/postponedTasksStore";
import { studyPlansService } from "@/app/services/motqin";
import {
  currentWeekDates,
  studyPlanSessions,
  studyPlanToExecutionTask,
} from "@/app/lib/study-plan";
import { ExecutionDayDetail } from "@/app/types/execution-board.types";
import { PlannerDay } from "@/app/types/planner.types";

export interface ExecutionBoardData {
  day: PlannerDay;
  detail: ExecutionDayDetail;
}

async function fetchExecutionBoard(dayIndex: number, weekOffset: number): Promise<ExecutionBoardData | null> {
  const baseDay = weekData.find((d) => d.index === dayIndex);
  const date = currentWeekDates(weekOffset)[dayIndex - 1];
  if (!baseDay || !date) return null;

  const response = await studyPlansService.filter({
    duration: 1,
    startDate: date,
    endDate: date,
  });
  const items = response.items.filter((item) => item.date === date);
  const apiTasks = items.map(studyPlanToExecutionTask);

  const postponed = getPostponedTasks(dayIndex);
  const mergedDetail: ExecutionDayDetail = {
    dayIndex,
    dailyTasks: [
      ...apiTasks.filter((task) => task.kind === "daily"),
      ...postponed.filter((task) => task.kind === "daily"),
    ],
    revisionTasks: [
      ...apiTasks.filter((task) => task.kind === "revision"),
      ...postponed.filter((task) => task.kind === "revision"),
    ],
    sessions: studyPlanSessions(items),
    outputs: {
      tasksCompleted: apiTasks.filter((task) => task.completed).length,
      totalTasks: apiTasks.length,
      totalSessions: studyPlanSessions(items).length,
      totalStudyMinutes: 0,
      quizAccuracy: null,
    },
  };

  return { day: { ...baseDay, date }, detail: mergedDetail };
}

export const useExecutionBoard = (dayIndex: number, weekOffset = 0) => {
  return useQuery({
    queryKey: ["execution-board", dayIndex, weekOffset],
    queryFn: () => fetchExecutionBoard(dayIndex, weekOffset),
    enabled: Number.isFinite(dayIndex),
  });
};
