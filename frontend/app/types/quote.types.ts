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
  // What the backend actually sends for the commenter's photo.
  profilePictureUrl?: string | null;
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

// GET /quotes/academic-day → data (null when the student's stage and grade
// have no school-year calendar).
export interface AcademicDay {
  stage: number;
  grade: number;
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // last day of the final exams
  totalDays: number;
  dayNumber: number; // today included; 0 before startDate
  daysRemaining: number; // days left after today
}

// DELETE /quotes/comment/{id} → data, and the ReceiveCommentDelete payload.
export interface CommentDeleteResult {
  commentId: number;
  quoteId: number;
  // The comment and all its replies, at any depth.
  deletedIds?: number[];
}

export interface QuoteMyStats {
  totalReactions?: number;
  totalComments?: number;
}
