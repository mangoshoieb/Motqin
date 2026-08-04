"use client";

import { Quote as QuoteIcon } from "lucide-react";
import { useTodayQuote } from "@/app/hooks/useTodayQuote";
import { useAddQuoteReaction, useRemoveQuoteReaction } from "@/app/hooks/useQuoteReaction";
import { reactionOptions } from "@/app/constants/quote.constants";
import { ReactionType } from "@/app/types/quote.types";
import Skeleton from "@/components/ui/Skeleton";
import QuoteComments from "./QuoteComments";

function ReactionBar({
  quoteId,
  userReaction,
  reactionCounts,
}: {
  quoteId: number;
  userReaction: ReactionType | null | undefined;
  reactionCounts: { reactionType: ReactionType; count: number }[];
}) {
  const { mutate: addReaction, isPending: isAdding } = useAddQuoteReaction();
  const { mutate: removeReaction, isPending: isRemoving } = useRemoveQuoteReaction();
  const isPending = isAdding || isRemoving;

  const countFor = (type: ReactionType) =>
    reactionCounts.find((r) => r.reactionType === type)?.count ?? 0;

  const handleClick = (type: ReactionType) => {
    if (isPending) return;
    if (userReaction === type) {
      removeReaction(quoteId);
    } else {
      addReaction({ quoteId, reactionType: type });
    }
  };

  return (
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
            {count > 0 && <span className="text-xs text-zinc-400">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}

export default function QuoteSection() {
  const { data: quote, isLoading, isError } = useTodayQuote();

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
          <QuoteIcon className="mx-auto mb-3 text-blue-300 dark:text-blue-800" size={32} />
          <p className="text-zinc-500 dark:text-zinc-400">
            لا يوجد اقتباس متاح اليوم، حاول مرة أخرى لاحقًا
          </p>
        </div>
      ) : (
        <div className="w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white p-8 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 md:p-10">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-md shadow-blue-500/30">
            <QuoteIcon size={22} />
          </span>

          <p className="mt-6 text-center text-2xl font-bold leading-relaxed text-blue-900 dark:text-blue-100 md:text-3xl">
            {quote.content}
            النجاح هو مجموع الجهود الصغيرة المتكررة يومًا بعد يوم
          </p>

          {quote.author && (
            <p className="mt-4 text-center text-sm font-semibold text-zinc-400">
              — {quote.author}
            </p>
          )}

          <div className="mt-8">
            <ReactionBar
              quoteId={quote.quoteId}
              userReaction={quote.userReaction}
              reactionCounts={quote.reactionCounts ?? []}
            />
          </div>

          <QuoteComments quoteId={quote.quoteId} comments={quote.comments ?? []} />
        </div>
      )}
    </div>
  );
}
