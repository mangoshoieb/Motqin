"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";

// Shown at the top of the summary when a session was finished (not ended
// early). "done": a check that jumps up from below and draws itself;
// "excellent" (a high score): the congratulation-badge Lottie. Either way a
// ribbon-and-confetti burst goes off behind it. The Lottie files live in
// /public/lottie (images embedded), so they depend on no third-party host.
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

// Loads a Lottie JSON from /public only when it's about to play, rather
// than bundling it into the quiz page (the badge alone is ~200 KB).
function useLottieFile(url: string) {
  const [animation, setAnimation] = useState<object | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(url)
      .then((response) => (response.ok ? response.json() : Promise.reject(response.status)))
      .then((data) => !cancelled && setAnimation(data))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [url]);

  return { animation, failed };
}

// The burst behind the icon: wider than the icon (the file is 16:9), never
// wider than the screen, and out of the way of clicks. Decoration only, so
// a failed load just shows nothing.
function ConfettiBurst() {
  const { animation } = useLottieFile("/lottie/confetti-burst.json");

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 aspect-video w-[min(36rem,100vw)] -translate-x-1/2 -translate-y-1/2 motion-reduce:hidden"
    >
      {animation && <Lottie animationData={animation} loop={false} className="size-full" />}
    </div>
  );
}

function CongratulationBadge() {
  const { animation, failed } = useLottieFile("/lottie/congratulation-badge.json");

  if (failed) return <AnimatedCheck />;

  return (
    <div className="size-40 animate-pop-up motion-reduce:animate-none">
      {animation && <Lottie animationData={animation} loop={false} className="size-full" />}
    </div>
  );
}

export const SessionCelebration = ({ variant }: { variant: CelebrationVariant }) => (
  <div className="relative flex items-center justify-center">
    <ConfettiBurst />
    <div className="relative">
      {variant === "excellent" ? <CongratulationBadge /> : <AnimatedCheck />}
    </div>
  </div>
);
