"use client";

import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { authService } from "../services/auth.services";

export function useCurrentUser() {
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

    // Don't even try if there's no token.
    enabled:
      typeof window !== "undefined" &&
      !!localStorage.getItem("accessToken"),
  });
}