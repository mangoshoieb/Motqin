"use client";

import { Check } from "lucide-react";

import { cn } from "@/app/lib/utils";

export type PlannerStep = 1 | 2 | 3;

export const plannerSteps: { step: PlannerStep; label: string; hint: string }[] = [
  { step: 1, label: "التفضيلات", hint: "نومك وساعات دراستك" },
  { step: 2, label: "الأوقات المشغولة", hint: "ارتباطات الأسبوع القادم" },
  { step: 3, label: "الأهداف", hint: "ما تريد إنجازه" },
];

interface PlannerStepperProps {
  /** The stage the user is on now. */
  current: PlannerStep;
  /** Stages already finished — shown with a check and clickable to go back. */
  completed?: PlannerStep[];
  /** Called when a finished stage is clicked; without it nothing is clickable. */
  onStepClick?: (step: PlannerStep) => void;
}

/**
 * The three stages of planning with AI: preferences → busy times → goals.
 * Shown above every stage so the user always knows where they are and what's
 * left.
 */
export default function PlannerStepper({
  current,
  completed = [],
  onStepClick,
}: PlannerStepperProps) {
  return (
    <ol
      dir="rtl"
      className="mt-6 flex items-start gap-1 rounded-2xl border border-zinc-200 bg-white px-4 py-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:gap-2 sm:px-6"
    >
      {plannerSteps.map(({ step, label, hint }, index) => {
        const isDone = completed.includes(step);
        const isCurrent = step === current;
        const canGoBack = isDone && Boolean(onStepClick);

        return (
          <li key={step} className="flex flex-1 items-start gap-1 sm:gap-2">
            <button
              type="button"
              disabled={!canGoBack}
              aria-current={isCurrent ? "step" : undefined}
              onClick={canGoBack ? () => onStepClick?.(step) : undefined}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-xl px-1 py-1 text-center transition",
                canGoBack ? "cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/60" : "cursor-default",
              )}
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition",
                  isDone && "bg-gradient-to-l from-indigo-600 to-blue-400 text-white shadow-md shadow-indigo-500/25",
                  isCurrent &&
                    "bg-white text-blue-700 ring-2 ring-blue-600 ring-offset-2 ring-offset-white dark:bg-zinc-900 dark:text-blue-400 dark:ring-offset-zinc-900",
                  !isDone && !isCurrent && "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500",
                )}
              >
                {isDone ? <Check size={17} strokeWidth={3} /> : step}
              </span>

              <span className="flex min-w-0 flex-col">
                <span
                  className={cn(
                    "truncate text-xs font-bold sm:text-sm",
                    isCurrent
                      ? "text-zinc-900 dark:text-zinc-100"
                      : isDone
                        ? "text-blue-700 dark:text-blue-400"
                        : "text-zinc-400 dark:text-zinc-500",
                  )}
                >
                  {label}
                </span>
                <span className="hidden truncate text-[11px] text-zinc-400 dark:text-zinc-500 sm:block">
                  {hint}
                </span>
              </span>
            </button>

            {/* Connector to the next stage — filled once this one is done. */}
            {index < plannerSteps.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "mt-[18px] h-0.5 w-6 shrink-0 rounded-full transition sm:w-12",
                  isDone
                    ? "bg-gradient-to-l from-indigo-600 to-blue-400"
                    : "bg-zinc-200 dark:bg-zinc-800",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
