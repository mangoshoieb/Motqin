import { ReactionType } from "../types/quote.types";

export const QUOTE_API_ROUTES = {
  TODAY: "/quotes/today",
  COMMENTS: "/quotes/comments",
  COMMENT_BY_ID: (id: number) => `/quotes/comments/${id}`,
  REPORT_COMMENT: "/quotes/comments/report",
  REACTIONS: "/quotes/reactions",
  REACTION_BY_QUOTE: (quoteId: number) => `/quotes/reactions/${quoteId}`,
  QUOTE_REACTIONS: (quoteId: number) => `/quotes/${quoteId}/reactions`,
  MY_STATS: "/quotes/my-stats",
};

// reactionType -> emoji/label mapping. The backend enum (1-5) isn't labeled
// in swagger yet, so this is a placeholder pending confirmation.
export const reactionOptions: { type: ReactionType; emoji: string; label: string }[] = [
  { type: 1, emoji: "👍", label: "مفيد" },
  { type: 2, emoji: "❤️", label: "ألهمني" },
  { type: 3, emoji: "🔥", label: "بحماس" },
  { type: 4, emoji: "👏", label: "رائع" },
  { type: 5, emoji: "😢", label: "مؤثر" },
];
