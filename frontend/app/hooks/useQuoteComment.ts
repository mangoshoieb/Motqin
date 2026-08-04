"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { quoteService } from "../services/quote.service";
import { CreateCommentInput, UpdateCommentInput, ReportCommentInput } from "../types/quote.types";

export function useAddQuoteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCommentInput) => quoteService.addComment(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote", "today"] });
    },
  });
}

export function useUpdateQuoteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateCommentInput) => quoteService.updateComment(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote", "today"] });
    },
  });
}

export function useDeleteQuoteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => quoteService.deleteComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote", "today"] });
    },
  });
}

export function useReportQuoteComment() {
  return useMutation({
    mutationFn: (input: ReportCommentInput) => quoteService.reportComment(input),
  });
}
