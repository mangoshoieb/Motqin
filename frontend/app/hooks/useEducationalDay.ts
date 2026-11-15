"use client";

import { useQuery } from "@tanstack/react-query";
import { quoteService } from "../services/quote.service";
import { useAuth } from "@/app/(public)/context/auth.context";

export const EDUCATIONAL_DAY_QUERY_KEY = ["quote", "educational-day"] as const;

// "Day N of the school year" shown with today's quote, from the student's
// stage and grade calendar (GET /quotes/academic-day). Changes once a day —
// the hub's ReceiveNewDay invalidates it at midnight — so it's cached
// generously.
export function useEducationalDay() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: EDUCATIONAL_DAY_QUERY_KEY,
    queryFn: quoteService.getEducationalDay,
    enabled: isAuthenticated,
    staleTime: 60 * 60 * 1000,
  });
}
