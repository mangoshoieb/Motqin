import { ReactionType } from "../types/quote.types";

export const QUOTE_API_ROUTES = {
  TODAY: "/quotes/today",
  COMMENTS: "/quotes/comment",
  COMMENT_BY_ID: (id: number) => `/quotes/comment/${id}`,
  REPORT_COMMENT: "/quotes/comments/report",
  REACTIONS: "/quotes/react-to",
  REACTION_BY_QUOTE: (quoteId: number) => `/quotes/reactions/${quoteId}`,
  QUOTE_REACTIONS: (quoteId: number) => `/quotes/${quoteId}/reactions`,
  MY_STATS: "/quotes/my-stats",
  ACADEMIC_DAY: "/quotes/academic-day",
};

// Quote Front Guide error codes → Arabic toast. The server catalogue's own
// copy wins when it lists the code.
export const QUOTE_ERROR_DEFAULTS: Record<string, string> = {
  comment_required: "اكتب تعليقك أولاً",
  comment_too_long: "التعليق أطول من 300 حرف",
  parent_comment_deleted: "تم حذف هذا التعليق، لا يمكن الرد عليه",
  invalid_parent_comment: "لا يمكن الرد على هذا التعليق",
  comment_not_found: "التعليق غير موجود أو تم حذفه",
  not_comment_owner: "لا يمكنك تعديل تعليق شخص آخر",
  quote_not_found: "الاقتباس غير موجود",
  quote_not_published: "هذا الاقتباس لم يُنشر بعد",
  invalid_reaction: "نوع التفاعل غير صحيح",
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
