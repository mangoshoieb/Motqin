"use client";

import { useCallback, useEffect, useLayoutEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, X } from "lucide-react";
import { cn } from "@/app/lib/utils";

export interface TourStep {
  // Matches an element rendered with data-tour="<target>".
  target: string;
  title: string;
  description: string;
}

interface GuidedTourProps {
  steps: TourStep[];
  open: boolean;
  // Fired before a step is shown, so the page can reveal its target (switch
  // a tab, expand a section) — the element is measured after the change.
  onStepChange?: (step: TourStep, index: number) => void;
  // Reached the last step and pressed finish.
  onFinish: () => void;
  // Closed early (skip button, ✕, or Escape).
  onSkip: () => void;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PADDING = 10;
const CARD_WIDTH = 320;
const CARD_GAP = 14;

/**
 * First-run coach marks: dims the page, cuts a spotlight around the current
 * step's element and pins a small card next to it explaining what to fill
 * in. Steps are found by `data-tour` attribute so the tour can live outside
 * the components it points at.
 */
export default function GuidedTour({ steps, open, onStepChange, onFinish, onSkip }: GuidedTourProps) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  // Portals need document.body, which doesn't exist during SSR.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // Restart from the first step each time the tour is opened (state
  // adjusted during render, per React's derive-from-props guidance).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setIndex(0);
  }

  const step = steps[index];
  const isLast = index === steps.length - 1;

  const measure = useCallback(() => {
    if (!step) return;
    const element = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
    if (!element) {
      setRect(null);
      return;
    }
    const box = element.getBoundingClientRect();
    setRect({
      top: box.top - PADDING,
      left: box.left - PADDING,
      width: box.width + PADDING * 2,
      height: box.height + PADDING * 2,
    });
  }, [step]);

  // Let the page reveal the target, scroll it into view, then measure once
  // the scroll has settled. Re-measure on resize/scroll so the spotlight
  // follows the element.
  useLayoutEffect(() => {
    if (!open || !step) return;
    onStepChange?.(step, index);

    const element = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
    element?.scrollIntoView({ block: "center", behavior: "smooth" });

    // Measure on the next frame (so the spotlight appears with the card),
    // then again after the smooth scroll finishes.
    const frame = window.requestAnimationFrame(measure);
    const settle = window.setTimeout(measure, 450);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(settle);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onStepChange is an event callback
  }, [open, step, index, measure]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onSkip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onSkip]);

  if (!mounted) return null;

  const next = () => (isLast ? onFinish() : setIndex((current) => current + 1));

  // Card goes under the target when there's room, otherwise above it, and
  // is clamped to the viewport horizontally (RTL pages anchor it to the
  // target's right edge).
  const cardStyle = (() => {
    if (!rect) return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const below = rect.top + rect.height + CARD_GAP;
    const fitsBelow = below + 220 < viewportHeight;
    const top = fitsBelow ? below : undefined;
    const bottom = fitsBelow ? undefined : viewportHeight - rect.top + CARD_GAP;
    const rawLeft = rect.left + rect.width - CARD_WIDTH;
    const left = Math.max(16, Math.min(rawLeft, viewportWidth - CARD_WIDTH - 16));
    return { top, bottom, left, width: CARD_WIDTH };
  })();

  return createPortal(
    <AnimatePresence>
      {open && step && (
        <motion.div
          key="tour"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[70]"
          dir="rtl"
          role="dialog"
          aria-modal="true"
          aria-label={step.title}
        >
          {/* The spotlight: a transparent box whose huge shadow dims the rest
              of the page. Clicks on the dim area are swallowed so the user
              follows the tour (or skips it explicitly). */}
          {rect ? (
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 380, damping: 34 }}
              className="pointer-events-none absolute rounded-2xl ring-2 ring-blue-400/80 shadow-[0_0_0_9999px_rgba(15,23,42,0.6)] dark:ring-blue-500"
              style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
            />
          ) : (
            <div className="absolute inset-0 bg-slate-900/60" />
          )}
          <div className="absolute inset-0" onClick={(event) => event.stopPropagation()} />

          <motion.div
            key={step.target}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.05 }}
            className="absolute rounded-2xl border border-blue-100 bg-white p-5 shadow-2xl shadow-blue-900/20 dark:border-zinc-700 dark:bg-zinc-900"
            style={cardStyle}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                الخطوة {index + 1} من {steps.length}
              </span>
              <button
                type="button"
                onClick={onSkip}
                aria-label="إغلاق الشرح"
                className="-m-1 flex size-7 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
              >
                <X size={15} />
              </button>
            </div>

            <h3 className="mt-3 text-base font-bold text-zinc-900 dark:text-zinc-100">{step.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              {step.description}
            </p>

            <div className="mt-5 flex items-center justify-between gap-3">
              <div className="flex gap-1.5">
                {steps.map((item, dot) => (
                  <span
                    key={item.target}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      dot === index ? "w-5 bg-blue-600" : "w-1.5 bg-zinc-300 dark:bg-zinc-700",
                    )}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                {!isLast && (
                  <button
                    type="button"
                    onClick={onSkip}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-zinc-500 transition hover:text-zinc-800 dark:hover:text-zinc-200"
                  >
                    تخطي
                  </button>
                )}
                <button
                  type="button"
                  autoFocus
                  onClick={next}
                  className="flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-blue-700"
                >
                  {isLast ? "فهمت، لنبدأ" : "التالي"}
                  {!isLast && <ChevronLeft size={14} />}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
