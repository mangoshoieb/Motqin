"use client";

import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { authService } from "../services/auth.services";

// Pages you land on specifically because you're not authenticated yet (or
// are mid-signup). There's no Nav/avatar rendered on any of these, so
// there's nothing to check "who am I" for — and checking anyway was what
// caused the GET /users/me -> 401 -> refresh-token loop on /sign-in.
const AUTH_ONLY_PATHS = [
  "/sign-in",
  "/sign-up",
  "/complete-profile",
  "/verify-phone",
  "/forgetPassword",
];

export function useCurrentUser() {
  const pathname = usePathname();
  const isAuthOnlyRoute = AUTH_ONLY_PATHS.some((path) =>
    pathname?.startsWith(path)
  );
  
  return useQuery({
    queryKey: ["current-user"],
    queryFn: authService.getCurrentUser,
    // Retry transient failures (network blips, backend restarting, 5xx).
    // Don't retry a real 401/403 — the axios interceptor already tried to
    // refresh the token before the error got here, so a 401 at this point
    // means refreshTokens() itself is handling logout already.
    retry: (failureCount, error) => {
      const httpStatus = axios.isAxiosError(error)
        ? error.response?.status
        : undefined;
      if (httpStatus === 401 || httpStatus === 403) return false;
      return failureCount < 2;
    },
    retryDelay: (attempt) => attempt * 500,

    // Don't even try if there's no token, or if we're on a page whose whole
    // point is that auth state doesn't matter yet.
    enabled:
      !isAuthOnlyRoute &&
      typeof window !== "undefined" &&
      !!localStorage.getItem("accessToken"),
  });
}