"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserGoal, UserGoalPayload, userGoalsService } from "../services/motqin";

export const USER_GOALS_QUERY_KEY = ["user-goals"] as const;

export function useUserGoals() {
  return useQuery({
    queryKey: USER_GOALS_QUERY_KEY,
    queryFn: userGoalsService.getAll,
    // Hide goals the backend flagged as ignored — they're kept server-side
    // but shouldn't be offered as a category for new tasks.
    select: (goals) => goals.filter((goal) => !goal.isIgnored),
  });
}

export function useCreateUserGoal(onCreated?: (goal: UserGoal) => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UserGoalPayload) => userGoalsService.create(payload),
    onSuccess: (created) => {
      // The response may or may not echo the id back; fall back to a refetch
      // either way so the list is authoritative.
      queryClient.setQueryData<UserGoal[]>(USER_GOALS_QUERY_KEY, (prev) =>
        prev && created?.id ? [...prev, created] : prev,
      );
      queryClient.invalidateQueries({ queryKey: USER_GOALS_QUERY_KEY });
      onCreated?.(created);
    },
  });
}
