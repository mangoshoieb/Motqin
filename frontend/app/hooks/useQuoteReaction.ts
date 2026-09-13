"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { quoteService } from "../services/quote.service";
import {
  DailyQuote,
  QuoteReactionInput,
  QuoteReactionUser,
  ReactionType,
} from "../types/quote.types";
import { QUOTE_TODAY_QUERY_KEY } from "./useTodayQuote";

export const quoteReactionsKey = (quoteId: number) => ["quote", quoteId, "reactions"] as const;

// Every reaction on the quote, one row per user. Per-type counts are derived
// from this — GET /quotes/today only carries the total.
export function useQuoteReactions(quoteId: number | null | undefined) {
  return useQuery({
    queryKey: quoteReactionsKey(quoteId ?? 0),
    queryFn: () => quoteService.getQuoteReactions(quoteId as number),
    enabled: !!quoteId,
  });
}

export const countByType = (reactions: QuoteReactionUser[] | undefined) => {
  const counts = new Map<ReactionType, number>();
  for (const reaction of reactions ?? []) {
    counts.set(reaction.reactionType, (counts.get(reaction.reactionType) ?? 0) + 1);
  }
  return counts;
};

// ---- cache helpers shared with the SignalR hook --------------------------

/** Upsert `userId`'s reaction in the reactions list (a user has at most one). */
export const applyReaction = (
  list: QuoteReactionUser[] | undefined,
  quoteId: number,
  userId: string,
  reactionType: ReactionType,
): QuoteReactionUser[] => {
  const others = (list ?? []).filter((r) => r.userId !== userId);
  return [...others, { quoteId, userId, reactionType, createdAt: new Date().toISOString() }];
};

export const removeUserReaction = (list: QuoteReactionUser[] | undefined, userId: string) =>
  (list ?? []).filter((r) => r.userId !== userId);

export function useAddQuoteReaction(currentUserId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: QuoteReactionInput) => quoteService.addReaction(input),
    // Flip the UI right away; the refetch in onSettled makes it authoritative.
    onMutate: async ({ quoteId, reactionType }) => {
      const key = quoteReactionsKey(quoteId);
      await Promise.all([
        queryClient.cancelQueries({ queryKey: key }),
        queryClient.cancelQueries({ queryKey: QUOTE_TODAY_QUERY_KEY }),
      ]);
      const previousReactions = queryClient.getQueryData<QuoteReactionUser[]>(key);
      const previousToday = queryClient.getQueryData<DailyQuote>(QUOTE_TODAY_QUERY_KEY);

      if (currentUserId) {
        queryClient.setQueryData<QuoteReactionUser[]>(key, (prev) =>
          applyReaction(prev, quoteId, currentUserId, reactionType),
        );
      }
      queryClient.setQueryData<DailyQuote>(QUOTE_TODAY_QUERY_KEY, (prev) =>
        prev
          ? {
              ...prev,
              userReactionType: reactionType,
              reactionsCount: (prev.reactionsCount ?? 0) + (prev.userReactionType ? 0 : 1),
            }
          : prev,
      );
      return { previousReactions, previousToday };
    },
    onError: (_error, { quoteId }, context) => {
      queryClient.setQueryData(quoteReactionsKey(quoteId), context?.previousReactions);
      queryClient.setQueryData(QUOTE_TODAY_QUERY_KEY, context?.previousToday);
    },
    onSettled: (_data, _error, { quoteId }) => {
      queryClient.invalidateQueries({ queryKey: quoteReactionsKey(quoteId) });
      queryClient.invalidateQueries({ queryKey: QUOTE_TODAY_QUERY_KEY });
    },
  });
}

export function useRemoveQuoteReaction(currentUserId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (quoteId: number) => quoteService.removeReaction(quoteId),
    onMutate: async (quoteId) => {
      const key = quoteReactionsKey(quoteId);
      await Promise.all([
        queryClient.cancelQueries({ queryKey: key }),
        queryClient.cancelQueries({ queryKey: QUOTE_TODAY_QUERY_KEY }),
      ]);
      const previousReactions = queryClient.getQueryData<QuoteReactionUser[]>(key);
      const previousToday = queryClient.getQueryData<DailyQuote>(QUOTE_TODAY_QUERY_KEY);

      if (currentUserId) {
        queryClient.setQueryData<QuoteReactionUser[]>(key, (prev) =>
          removeUserReaction(prev, currentUserId),
        );
      }
      queryClient.setQueryData<DailyQuote>(QUOTE_TODAY_QUERY_KEY, (prev) =>
        prev
          ? {
              ...prev,
              userReactionType: null,
              reactionsCount: Math.max(0, (prev.reactionsCount ?? 0) - (prev.userReactionType ? 1 : 0)),
            }
          : prev,
      );
      return { previousReactions, previousToday };
    },
    onError: (_error, quoteId, context) => {
      queryClient.setQueryData(quoteReactionsKey(quoteId), context?.previousReactions);
      queryClient.setQueryData(QUOTE_TODAY_QUERY_KEY, context?.previousToday);
    },
    onSettled: (_data, _error, quoteId) => {
      queryClient.invalidateQueries({ queryKey: quoteReactionsKey(quoteId) });
      queryClient.invalidateQueries({ queryKey: QUOTE_TODAY_QUERY_KEY });
    },
  });
}
