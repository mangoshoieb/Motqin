"use client";

import { useEffect, useRef, useState } from "react";

// Smoothly counts from the number on screen to `target` (ease-out) instead
// of jumping straight to it — used for prices when the billing period or the
// plan's features change. A new target mid-count starts from where the count
// is, not from the old start. `decimals` keeps piasters (137.70).
export function useAnimatedNumber(target: number, duration = 450, decimals = 0) {
  const [display, setDisplay] = useState(target);
  const frameRef = useRef<number | null>(null);
  const shownRef = useRef(target);

  useEffect(() => {
    const from = shownRef.current;
    const to = target;
    if (from === to) return;

    const factor = 10 ** decimals;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const value = progress < 1 ? Math.round((from + (to - from) * eased) * factor) / factor : to;
      shownRef.current = value;
      setDisplay(value);
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    // Frames don't run in a hidden tab: land on the real number anyway, so
    // a price is never left showing the old value.
    const settle = setTimeout(() => {
      shownRef.current = to;
      setDisplay(to);
    }, duration + 50);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      clearTimeout(settle);
    };
  }, [target, duration, decimals]);

  return display;
}
