import axiosInstance from "../lib/axios";
import { QUOTE_API_ROUTES } from "../constants/quote.constants";
import {
  CreateCommentInput,
  DailyQuote,
  QuoteComment,
  QuoteMyStats,
  QuoteReactionInput,
  QuoteReactionUser,
  ReportCommentInput,
  UpdateCommentInput,
} from "../types/quote.types";

// Response schemas for the GET endpoints aren't documented in swagger yet —
// unwrap `data.data` if the backend uses the same ApiResponse<T> envelope as
// the rest of the API, falling back to the raw body otherwise.
const unwrap = <T>(data: unknown): T =>
  ((data as { data?: T })?.data ?? data) as T;

export const quoteService = {
  async getTodayQuote(): Promise<DailyQuote> {
    const { data } = await axiosInstance.get(QUOTE_API_ROUTES.TODAY);
    return unwrap<DailyQuote>(data);
  },

  async addComment(input: CreateCommentInput): Promise<QuoteComment> {
    const { data } = await axiosInstance.post(QUOTE_API_ROUTES.COMMENTS, input);
    return unwrap<QuoteComment>(data);
  },

  async updateComment({ id, content }: UpdateCommentInput): Promise<QuoteComment> {
    const { data } = await axiosInstance.put(QUOTE_API_ROUTES.COMMENT_BY_ID(id), {
      content,
    });
    return unwrap<QuoteComment>(data);
  },

  async deleteComment(id: number): Promise<void> {
    await axiosInstance.delete(QUOTE_API_ROUTES.COMMENT_BY_ID(id));
  },

  async reportComment(input: ReportCommentInput): Promise<void> {
    await axiosInstance.post(QUOTE_API_ROUTES.REPORT_COMMENT, input);
  },

  async addReaction(input: QuoteReactionInput): Promise<void> {
    await axiosInstance.post(QUOTE_API_ROUTES.REACTIONS, input);
  },

  async removeReaction(quoteId: number): Promise<void> {
    await axiosInstance.delete(QUOTE_API_ROUTES.REACTION_BY_QUOTE(quoteId));
  },

  async getQuoteReactions(quoteId: number): Promise<QuoteReactionUser[]> {
    const { data } = await axiosInstance.get(QUOTE_API_ROUTES.QUOTE_REACTIONS(quoteId));
    return unwrap<QuoteReactionUser[]>(data) ?? [];
  },

  async getMyStats(): Promise<QuoteMyStats> {
    const { data } = await axiosInstance.get(QUOTE_API_ROUTES.MY_STATS);
    return unwrap<QuoteMyStats>(data);
  },
};
