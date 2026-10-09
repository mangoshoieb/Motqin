"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CustomSubjectPayload, subjectsService } from "../services/motqin";

export const SUBJECTS_QUERY_KEY = ["subjects"] as const;

// System (curriculum) subjects first, then the student's own — a stable
// sort, so each group keeps the order the backend sent.
const systemSubjectsFirst = (subjects: Subject[]) =>
  [...subjects].sort((a, b) => Number(!!a.isMine) - Number(!!b.isMine));

// GET /subjects/customized-user-subjects is scoped to the signed-in user, so
// it means nothing without a session — and asking anyway returns 401, which
// the axios interceptor answers by logging out and bouncing to /sign-in.
// The navbar's breadcrumb mounts on public pages too, so the guard lives
// here rather than at each call site (same rule as useCurrentUser).
export function useGetSubjects() {
  return useQuery({
    queryKey: SUBJECTS_QUERY_KEY,
    queryFn: subjectsService.getForUser,
    select: systemSubjectsFirst,
    enabled: typeof window !== "undefined" && !!localStorage.getItem("accessToken"),
  });
}

export function useCreateSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CustomSubjectPayload) => subjectsService.createCustom(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBJECTS_QUERY_KEY });
    },
  });
}

export function useUpdateSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...payload }: { id: number } & CustomSubjectPayload) =>
      subjectsService.updateCustom(id, payload),
    onSuccess: (_, { id, name }) => {
      queryClient.setQueryData<Subject[]>(SUBJECTS_QUERY_KEY, (prev) =>
        prev?.map((subject) => (subject.subjectID === id ? { ...subject, name } : subject)),
      );
      queryClient.invalidateQueries({ queryKey: SUBJECTS_QUERY_KEY });
    },
  });
}

export function useDeleteSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => subjectsService.removeCustom(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<Subject[]>(SUBJECTS_QUERY_KEY, (prev) =>
        prev?.filter((subject) => subject.subjectID !== id),
      );
      queryClient.invalidateQueries({ queryKey: SUBJECTS_QUERY_KEY });
    },
  });
}
