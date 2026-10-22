"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { repetitionIntervalsService } from "@/app/services/repetition-intervals.service";
import { RepetitionIntervals } from "@/app/types/repetition-intervals.types";

export const REPETITION_INTERVALS_KEY = ["repetition-intervals"] as const;

export const useRepetitionIntervals = () =>
  useQuery({ queryKey: REPETITION_INTERVALS_KEY, queryFn: repetitionIntervalsService.get });

// Each write updates the cached copy as soon as the server accepts it (none
// of these endpoints is documented to answer with the new state), then
// refetches to pick up whatever the server normalized.
const useIntervalsMutation = <V>(
  mutationFn: (variables: V) => Promise<void>,
  apply: (current: RepetitionIntervals, variables: V) => RepetitionIntervals,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (_, variables) => {
      queryClient.setQueryData<RepetitionIntervals>(REPETITION_INTERVALS_KEY, (current) =>
        current ? apply(current, variables) : current,
      );
      queryClient.invalidateQueries({ queryKey: REPETITION_INTERVALS_KEY });
    },
  });
};

export const useSetDefaultIntervals = () =>
  useIntervalsMutation(
    (intervals: number[]) => repetitionIntervalsService.setDefault(intervals),
    (current, intervals) => ({ ...current, defaultIntervals: intervals }),
  );

export const useClearDefaultIntervals = () =>
  useIntervalsMutation(
    () => repetitionIntervalsService.clearDefault(),
    (current) => ({ ...current, defaultIntervals: null }),
  );

export const useSetSubjectIntervals = () =>
  useIntervalsMutation(
    ({ subjectId, intervals }: { subjectId: number; subjectName: string; intervals: number[] }) =>
      repetitionIntervalsService.setForSubject(subjectId, intervals),
    (current, { subjectId, subjectName, intervals }) => ({
      ...current,
      subjects: current.subjects.some((s) => s.subjectId === subjectId)
        ? current.subjects.map((s) => (s.subjectId === subjectId ? { ...s, intervals } : s))
        : [...current.subjects, { subjectId, subjectName, intervals }],
    }),
  );

export const useClearSubjectIntervals = () =>
  useIntervalsMutation(
    (subjectId: number) => repetitionIntervalsService.clearForSubject(subjectId),
    (current, subjectId) => ({
      ...current,
      subjects: current.subjects.filter((s) => s.subjectId !== subjectId),
    }),
  );
