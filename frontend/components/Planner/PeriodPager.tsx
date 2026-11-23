"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PeriodPagerProps {
  onPrevious: () => void;
  onNext: () => void;
  previousLabel: string;
  nextLabel: string;
  nextDisabled?: boolean;
}

// The pair of arrows beside a planner title (the week board's weeks, the
// execution board's days). RTL, so "back" points right and "forward" left.
export const PeriodPager = ({
  onPrevious,
  onNext,
  previousLabel,
  nextLabel,
  nextDisabled = false,
}: PeriodPagerProps) => (
  <div className="flex shrink-0 items-center gap-1 rounded-full border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900">
    <button
      type="button"
      onClick={onPrevious}
      title={previousLabel}
      aria-label={previousLabel}
      className="flex size-8 items-center justify-center rounded-full text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      <ChevronRight size={18} />
    </button>
    <button
      type="button"
      onClick={onNext}
      disabled={nextDisabled}
      title={nextLabel}
      aria-label={nextLabel}
      className="flex size-8 items-center justify-center rounded-full text-zinc-600 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-zinc-300 dark:hover:bg-zinc-800"
    >
      <ChevronLeft size={18} />
    </button>
  </div>
);
