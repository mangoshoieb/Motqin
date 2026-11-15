"use client";

import { useQuery } from "@tanstack/react-query";
import { homeService } from "../services/home.service";
import { useAuth } from "@/app/(public)/context/auth.context";

export const HOME_FEATURE_STATS_QUERY_KEY = ["home", "feature-stats"] as const;

// The student's own numbers on the home page's feature pieces. Signed-in
// accounts only — guests and visitors see the pieces without numbers.
export function useHomeFeatureStats() {
  const { isAuthenticated, isGuest } = useAuth();

  return useQuery({
    queryKey: HOME_FEATURE_STATS_QUERY_KEY,
    queryFn: homeService.getFeatureStats,
    enabled: isAuthenticated && !isGuest,
    staleTime: 60 * 1000,
  });
}
