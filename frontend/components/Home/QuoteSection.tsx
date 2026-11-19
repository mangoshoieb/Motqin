"use client";

import { CalendarDays, Eye, Heart, Quote as QuoteIcon } from "lucide-react";
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
import { AcademicDay, ReactionType } from "@/app/types/quote.types";
import Skeleton from "@/components/ui/Skeleton";
import QuoteComments from "./QuoteComments";

// Today as "YYYY-MM-DD" in Cairo, the timezone the backend counts days in.
const cairoToday = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo" }).format(new Date());

// Arabic counted noun: يوم واحد / يومان / 3–10 أيام / 11+ يومًا.
const daysLabel = (n: number) =>
  n === 1 ? "يوم واحد" : n === 2 ? "يومان" : n >= 3 && n <= 10 ? `${n} أيام` : `${n} يومًا`;

// "Day N of the school year" plus a progress bar of the year, with a tick
// at its midpoint. Hidden when there's no calendar for the student, before
// the year starts, and once it's over.
function AcademicDayProgress({ day }: { day: AcademicDay | null | undefined }) {
  if (!day || !day.dayNumber || day.endDate < cairoToday()) return null;

  const total = Math.max(day.totalDays, 1);
  const percent = Math.min(100, Math.max(0, (day.dayNumber / total) * 100));
  const pastHalf = day.dayNumber >= total / 2;

  return (
    <div dir="rtl" className="mx-auto mb-6 w-full max-w-sm">
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs font-bold">
        <span className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3.5 py-1 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
          <CalendarDays size={14} />
          اليوم {day.dayNumber} من العام الدراسي
        </span>
        <span className="text-zinc-500 dark:text-zinc-400">
          {day.daysRemaining === 0
            ? "آخر يوم في العام الدراسي"
            : `باقي ${daysLabel(day.daysRemaining)}`}
        </span>
      </div>

      <div
        role="progressbar"
        aria-label="التقدم في العام الدراسي"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={day.dayNumber}
        aria-valuetext={`مضى ${daysLabel(day.dayNumber)} من ${daysLabel(total)}`}
        className="relative mt-3 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800"
      >
        {/* Fills from the right (start of the year in RTL). */}
        <div
          className="absolute inset-y-0 start-0 rounded-full bg-gradient-to-l from-blue-400 to-blue-600 transition-[width] duration-700 dark:from-blue-600 dark:to-blue-500"
          style={{ width: `${percent}%` }}
        />
        {/* Mid-year mark. */}
        <span
          aria-hidden
          className={`absolute -top-1 left-1/2 h-4 w-1 -translate-x-1/2 rounded-full ring-2 ring-white dark:ring-zinc-900 ${
            pastHalf ? "bg-blue-700 dark:bg-blue-400" : "bg-zinc-400 dark:bg-zinc-500"
          }`}
        />
      </div>

      <div className="relative mt-1.5 flex justify-between text-[10px] text-zinc-400">
        <span>مضى {daysLabel(day.dayNumber)}</span>
        <span className="absolute left-1/2 -translate-x-1/2">منتصف العام</span>
        <span>{Math.round(percent)}%</span>
      </div>
    </div>
  );
}

function ReactionBar({
  quoteId,
  userReaction,
  currentUserId,
}: {
  quoteId: number;
  userReaction: ReactionType | null | undefined;
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
                  : "border-zinc-300 text-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-600 dark:border-zinc-600 dark:text-zinc-300"
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
  // Live total for the meta line (the list is what the hub keeps current).
  const { data: liveReactions } = useQuoteReactions(quote?.quoteId);
  const reactionTotal = liveReactions ? liveReactions.length : quote?.reactionsCount ?? 0;

  // Live reactions/comments for today's quote.
  useQuoteHub(quote?.quoteId, user?.id);

  return (
    <div className="relative flex w-full items-center justify-center px-6 py-10 md:px-12 md:py-14">
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
          <AcademicDayProgress day={educationalDay} />

          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-blue-600 dark:bg-blue-700 text-white shadow-md shadow-blue-500/30">
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

          <div
            dir="rtl"
            className="mt-3 flex items-center justify-center gap-4 text-xs text-zinc-400"
          >
            {quote.viewsCount != null && (
              <span className="flex items-center gap-1">
                <Eye size={13} /> {quote.viewsCount} مشاهدة
              </span>
            )}
            <span className="flex items-center gap-1">
              <Heart size={13} />{" "}
              {reactionTotal === 1
                ? "تفاعل واحد"
                : reactionTotal === 2
                  ? "تفاعلان"
                  : `${reactionTotal} تفاعلات`}
            </span>
          </div>

          <div className="mt-8">
            <ReactionBar
              quoteId={quote.quoteId}
              userReaction={quote.userReactionType || null}
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
