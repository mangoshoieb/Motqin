"use client";

import { useAnimatedNumber } from "@/app/hooks/useAnimatedNumber";
import { formatMoney } from "@/app/lib/payments";

// An EGP amount that counts up or down to its new value instead of jumping.
export function AnimatedMoney({ value, suffix }: { value: number; suffix?: string }) {
  const shown = useAnimatedNumber(value, 450, 2);
  return (
    <>
      {formatMoney(shown)}
      {suffix}
    </>
  );
}
