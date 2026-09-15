// Response shapes for GET /api/quotes/today, /api/quotes/{id}/reactions and
// /api/quotes/my-stats aren't documented in swagger yet (no schema on the
// response, backend team confirmed the endpoints are still being finished).
// Field names below are a best guess based on the DTOs that ARE documented
// (ScheduleQuoteDto, CreateCommentDto, QuoteReactionDto) — adjust once the
// real payloads are confirmed.

// Backend enum values 1-5, meaning not documented yet — labels in
// quote.constants.ts are a placeholder until confirmed.
export type ReactionType = 1 | 2 | 3 | 4 | 5;

// Matches CommentRenderDto (also what the SignalR hub broadcasts).
export interface QuoteComment {
  id: number;
  quoteId: number;
  content: string;
  parentCommentId: number | null;
  createdAt: string;
  userId?: string;
  userName?: string;
  // Not sent yet — picked up automatically once the backend adds them.
  userFullName?: string | null;
  userPhotoUrl?: string | null;
  isDeletedByAdmin?: boolean;
  replies?: QuoteComment[];
}

// GET /quotes/today → data. `quoteId` is filled in by the service from `id`
// so the rest of the app has one name for it.
export interface DailyQuote {
  id: number;
  quoteId: number;
  content: string;
  author: string | null;
  publishDate: string;
  viewsCount?: number;
  commentsCount?: number;
  reactionsCount?: number;
  comments?: QuoteComment[];
  // The current user's reaction, or null/0 when they haven't reacted.
  userReactionType?: ReactionType | null;
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

// One row of GET /quotes/{quoteId}/reactions → data.reactions
export interface QuoteReactionUser {
  id?: number;
  quoteId?: number;
  userId: string;
  reactionType: ReactionType;
  createdAt?: string;
}

// GET /admin/quotes/educational-day → data
export interface EducationalDay {
  stage: number;
  dayNum: number; // 1-based day of the school year
}

export interface QuoteMyStats {
  totalReactions?: number;
  totalComments?: number;
}
