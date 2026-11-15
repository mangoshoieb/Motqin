"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { quoteService } from "../services/quote.service";
import {
  CreateCommentInput,
  DailyQuote,
  UpdateCommentInput,
  ReportCommentInput,
} from "../types/quote.types";
import { QUOTE_TODAY_QUERY_KEY } from "./useTodayQuote";
import { removeComments } from "../lib/quote-comments";
import { toastQuoteError } from "../lib/quote-errors";

export function useAddQuoteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCommentInput) => quoteService.addComment(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUOTE_TODAY_QUERY_KEY });
    },
    onError: (error) => toastQuoteError(error, queryClient),
  });
}

export function useUpdateQuoteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateCommentInput) => quoteService.updateComment(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUOTE_TODAY_QUERY_KEY });
    },
    onError: (error) => toastQuoteError(error, queryClient),
  });
}

export function useDeleteQuoteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => quoteService.deleteComment(id),
    onSuccess: (result, id) => {
      // Deleting a comment deletes its whole thread — drop it right away,
      // then refetch to be sure.
      const ids = result?.deletedIds?.length ? result.deletedIds : [id];
      queryClient.setQueryData<DailyQuote>(QUOTE_TODAY_QUERY_KEY, (prev) =>
        prev ? { ...prev, comments: removeComments(prev.comments ?? [], ids) } : prev,
      );
      queryClient.invalidateQueries({ queryKey: QUOTE_TODAY_QUERY_KEY });
    },
    onError: (error) => toastQuoteError(error, queryClient),
  });
}

export function useReportQuoteComment() {
  return useMutation({
    mutationFn: (input: ReportCommentInput) => quoteService.reportComment(input),
  });
}
