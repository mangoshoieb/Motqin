"use client";

import { useQuery } from "@tanstack/react-query";
import { quoteService } from "../services/quote.service";
import { useAuth } from "@/app/(public)/context/auth.context";

export function useTodayQuote() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["quote", "today"],
    queryFn: quoteService.getTodayQuote,
    enabled: isAuthenticated,
  });
}
