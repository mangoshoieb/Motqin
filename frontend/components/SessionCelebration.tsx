"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";

// Shown at the top of the summary when a session was finished (not ended
// early). "done": a check that jumps up from below and draws itself;
// "excellent" (a high score): the congratulation-badge Lottie, which has its
// images embedded and is served from /public, so it depends on no
// third-party host.
export type CelebrationVariant = "done" | "excellent";

// Dash values (2πr for r = 44, and the check path's length) that make the
// strokes start invisible and draw in. The starting offset is a class, not
// inline, so reduced motion can show the finished strokes instead.

function AnimatedCheck() {
  return (
    <div className="relative flex size-28 items-center justify-center animate-pop-up motion-reduce:animate-none">
      <span className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ring [animation-delay:0.5s] motion-reduce:hidden" />
      <svg viewBox="0 0 100 100" className="relative size-28" aria-hidden>
        <circle cx="50" cy="50" r="44" className="fill-emerald-50 dark:fill-emerald-950/50" />
        <circle
          cx="50"
          cy="50"
          r="44"
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          className="stroke-emerald-500 [stroke-dasharray:277] [stroke-dashoffset:277] animate-draw [animation-delay:0.3s] motion-reduce:animate-none motion-reduce:[stroke-dashoffset:0]"
          // Start drawing from the top rather than the right.
          transform="rotate(-90 50 50)"
        />
        <path
          d="M30 52 L44 66 L71 37"
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-emerald-600 [stroke-dasharray:60] [stroke-dashoffset:60] animate-draw [animation-delay:0.8s] motion-reduce:animate-none motion-reduce:[stroke-dashoffset:0] dark:stroke-emerald-400"
        />
      </svg>
    </div>
  );
}

function CongratulationBadge() {
  const [animation, setAnimation] = useState<object | null>(null);
  const [failed, setFailed] = useState(false);

  // ~200 KB with its images — fetched only when there's something to
  // celebrate, rather than bundled into the quiz page.
  useEffect(() => {
    let cancelled = false;
    fetch("/lottie/congratulation-badge.json")
      .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
      .then((data) => !cancelled && setAnimation(data))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) return <AnimatedCheck />;

  return (
    <div className="size-40 animate-pop-up motion-reduce:animate-none">
      {animation && <Lottie animationData={animation} loop={false} className="size-full" />}
    </div>
  );
}

export const SessionCelebration = ({ variant }: { variant: CelebrationVariant }) =>
  variant === "excellent" ? <CongratulationBadge /> : <AnimatedCheck />;
