"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { quoteService } from "../services/quote.service";
import { QuoteReactionInput } from "../types/quote.types";

export function useAddQuoteReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: QuoteReactionInput) => quoteService.addReaction(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote", "today"] });
    },
  });
}

export function useRemoveQuoteReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (quoteId: number) => quoteService.removeReaction(quoteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote", "today"] });
    },
  });
}
