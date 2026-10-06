"use client";

import { useQuery } from "@tanstack/react-query";
import { subjectsService } from "../services/motqin";

// GET /subjects/for-user is scoped to the signed-in user's curriculum, so
// it means nothing without a session — and asking anyway returns 401, which
// the axios interceptor answers by logging out and bouncing to /sign-in.
// The navbar's breadcrumb mounts on public pages too, so the guard lives
// here rather than at each call site (same rule as useCurrentUser).
export function useGetSubjects() {
  return useQuery({
    queryKey: ["subjects"],
    queryFn: subjectsService.getForUser,
    enabled: typeof window !== "undefined" && !!localStorage.getItem("accessToken"),
  });
}
