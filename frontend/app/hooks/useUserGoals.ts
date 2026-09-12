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

export function useUpdateUserGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...payload }: { id: number } & Partial<UserGoalPayload>) =>
      userGoalsService.update(id, payload),
    onSuccess: (updated, variables) => {
      queryClient.setQueryData<UserGoal[]>(USER_GOALS_QUERY_KEY, (prev) =>
        prev?.map((goal) => (goal.id === variables.id ? { ...goal, ...variables, ...(updated?.id ? updated : {}) } : goal)),
      );
      queryClient.invalidateQueries({ queryKey: USER_GOALS_QUERY_KEY });
    },
  });
}

export function useDeleteUserGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => userGoalsService.remove(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<UserGoal[]>(USER_GOALS_QUERY_KEY, (prev) =>
        prev?.filter((goal) => goal.id !== id),
      );
      queryClient.invalidateQueries({ queryKey: USER_GOALS_QUERY_KEY });
    },
  });
}
