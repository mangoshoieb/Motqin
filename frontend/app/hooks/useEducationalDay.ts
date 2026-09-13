"use client";

import { useQuery } from "@tanstack/react-query";
import { quoteService } from "../services/quote.service";
import { useAuth } from "@/app/(public)/context/auth.context";

// "Day N of the school year" shown with today's quote. Changes once a day,
// so it's cached generously.
export function useEducationalDay() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["quote", "educational-day"],
    queryFn: quoteService.getEducationalDay,
    enabled: isAuthenticated,
    staleTime: 60 * 60 * 1000,
  });
}
