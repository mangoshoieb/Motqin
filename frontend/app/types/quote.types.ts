// Response shapes for GET /api/quotes/today, /api/quotes/{id}/reactions and
// /api/quotes/my-stats aren't documented in swagger yet (no schema on the
// response, backend team confirmed the endpoints are still being finished).
// Field names below are a best guess based on the DTOs that ARE documented
// (ScheduleQuoteDto, CreateCommentDto, QuoteReactionDto) — adjust once the
// real payloads are confirmed.

// Backend enum values 1-5, meaning not documented yet — labels in
// quote.constants.ts are a placeholder until confirmed.
export type ReactionType = 1 | 2 | 3 | 4 | 5;

export interface QuoteComment {
  id: number;
  quoteId: number;
  content: string;
  parentCommentId: number | null;
  createdAt: string;
  userId?: string;
  userName?: string;
}

export interface QuoteReactionSummary {
  reactionType: ReactionType;
  count: number;
}

export interface DailyQuote {
  quoteId: number;
  content: string;
  author: string | null;
  publishDate: string;
  comments?: QuoteComment[];
  reactionCounts?: QuoteReactionSummary[];
  totalReactions?: number;
  userReaction?: ReactionType | null;
}

export interface CreateCommentInput {
  quoteId: number;
  content: string;
  parentCommentId?: number | null;
}

export interface UpdateCommentInput {
  id: number;
  content: string;
}

export interface QuoteReactionInput {
  quoteId: number;
  reactionType: ReactionType;
}

export interface ReportCommentInput {
  commentId: number;
  reason: string;
}

export interface QuoteReactionUser {
  userId: string;
  userName?: string;
  reactionType: ReactionType;
}

export interface QuoteMyStats {
  totalReactions?: number;
  totalComments?: number;
}
