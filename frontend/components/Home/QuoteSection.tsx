"use client";

import { CalendarDays, Eye, MessageCircle, Quote as QuoteIcon } from "lucide-react";
import { useEducationalDay } from "@/app/hooks/useEducationalDay";
import { useTodayQuote } from "@/app/hooks/useTodayQuote";
import { useQuoteHub } from "@/app/hooks/useQuoteHub";
import { useAuth } from "@/app/(public)/context/auth.context";
import {
  countByType,
  useAddQuoteReaction,
  useQuoteReactions,
  useRemoveQuoteReaction,
} from "@/app/hooks/useQuoteReaction";
import { reactionOptions } from "@/app/constants/quote.constants";
import { ReactionType } from "@/app/types/quote.types";
import Skeleton from "@/components/ui/Skeleton";
import QuoteComments from "./QuoteComments";

function ReactionBar({
  quoteId,
  userReaction,
  totalReactions,
  currentUserId,
}: {
  quoteId: number;
  userReaction: ReactionType | null | undefined;
  totalReactions: number;
  currentUserId?: string | null;
}) {
  // Per-type counts come from the reactions list; today's quote only carries
  // the total.
  const { data: reactions } = useQuoteReactions(quoteId);
  const counts = countByType(reactions);
  const { mutate: addReaction, isPending: isAdding } =
    useAddQuoteReaction(currentUserId);
  const { mutate: removeReaction, isPending: isRemoving } =
    useRemoveQuoteReaction(currentUserId);
  const isPending = isAdding || isRemoving;

  const countFor = (type: ReactionType) => counts.get(type) ?? 0;
  const total = reactions ? reactions.length : totalReactions;

  const handleClick = (type: ReactionType) => {
    if (isPending) return;
    if (userReaction === type) {
      removeReaction(quoteId);
    } else {
      addReaction({ quoteId, reactionType: type });
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {total > 0 && (
        <p className="text-xs text-zinc-400">
          {total === 1 ? "تفاعل واحد" : total === 2 ? "تفاعلان" : `${total} تفاعلات`}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2">
        {reactionOptions.map((option) => {
          const isActive = userReaction === option.type;
          const count = countFor(option.type);

          return (
            <button
              key={option.type}
              type="button"
              onClick={() => handleClick(option.type)}
              disabled={isPending}
              className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition disabled:opacity-50 ${
                isActive
                  ? "border-blue-600 bg-blue-600/10 text-blue-700 dark:border-blue-500 dark:bg-blue-500/10 dark:text-blue-300"
                  : "border-zinc-300 text-zinc-600 hover:border-zinc-400 dark:border-zinc-600 dark:text-zinc-300"
              }`}
            >
              <span>{option.emoji}</span>
              <span>{option.label}</span>
              {count > 0 && (
                <span
                  className={`rounded-full px-1.5 text-xs tabular-nums ${
                    isActive
                      ? "bg-blue-600/15 text-blue-700 dark:text-blue-300"
                      : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function QuoteSection() {
  const { data: quote, isLoading, isError } = useTodayQuote();
  const { data: educationalDay } = useEducationalDay();
  const { user } = useAuth();

  // Live reactions/comments for today's quote.
  useQuoteHub(quote?.quoteId, user?.id);

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center px-6 py-16 md:px-12">
      {isLoading ? (
        <div className="w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white p-8 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 md:p-10">
          <Skeleton className="mx-auto size-12 rounded-full" />
          <Skeleton className="mx-auto mt-6 h-7 w-full" />
          <Skeleton className="mx-auto mt-3 h-7 w-3/4" />
          <Skeleton className="mx-auto mt-4 h-5 w-32" />
          <div className="mt-8 flex justify-center gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-full" />
            ))}
          </div>
        </div>
      ) : isError || !quote ? (
        <div className="w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white p-10 text-center shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
          <QuoteIcon
            className="mx-auto mb-3 text-blue-300 dark:text-blue-800"
            size={32}
          />
          <p className="text-zinc-500 dark:text-zinc-400">
            لا يوجد اقتباس متاح اليوم، حاول مرة أخرى لاحقًا
          </p>
        </div>
      ) : (
        <div className="w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white p-8 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 md:p-10">
          {educationalDay?.dayNum ? (
            <span
              dir="rtl"
              className="mx-auto mb-5 flex w-fit items-center gap-1.5 rounded-full bg-blue-50 px-3.5 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
            >
              <CalendarDays size={14} />
              اليوم {educationalDay.dayNum} من العام الدراسي
            </span>
          ) : null}

          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-md shadow-blue-500/30">
            <QuoteIcon size={22} />
          </span>

          <p className="mt-6 text-center text-2xl font-bold leading-relaxed text-blue-900 dark:text-blue-100 md:text-3xl">
            {quote.content}
          </p>

          {quote.author && (
            <p className="mt-4 text-center text-sm font-semibold text-zinc-400">
              — {quote.author}
            </p>
          )}

          {(quote.viewsCount != null || quote.commentsCount != null) && (
            <div dir="rtl" className="mt-3 flex items-center justify-center gap-4 text-xs text-zinc-400">
              {quote.viewsCount != null && (
                <span className="flex items-center gap-1">
                  <Eye size={13} /> {quote.viewsCount} مشاهدة
                </span>
              )}
              {quote.commentsCount != null && (
                <span className="flex items-center gap-1">
                  <MessageCircle size={13} /> {quote.comments?.length ?? quote.commentsCount} تعليق
                </span>
              )}
            </div>
          )}

          <div className="mt-8">
            <ReactionBar
              quoteId={quote.quoteId}
              userReaction={quote.userReactionType || null}
              totalReactions={quote.reactionsCount ?? 0}
              currentUserId={user?.id}
            />
          </div>

          <QuoteComments
            quoteId={quote.quoteId}
            comments={quote.comments ?? []}
          />
        </div>
      )}
    </div>
  );
}
