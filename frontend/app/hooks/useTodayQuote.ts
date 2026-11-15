"use client";

import { useQuery } from "@tanstack/react-query";
import { quoteService } from "../services/quote.service";
import { useAuth } from "@/app/(public)/context/auth.context";

export const QUOTE_TODAY_QUERY_KEY = ["quote", "today"] as const;

export function useTodayQuote() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: QUOTE_TODAY_QUERY_KEY,
    queryFn: quoteService.getTodayQuote,
    enabled: isAuthenticated,
    // The hub (and its midnight ReceiveNewDay) only connects while there's a
    // quote; on a day without one, refetching on focus picks up a quote
    // scheduled later.
    refetchOnWindowFocus: true,
  });
}
