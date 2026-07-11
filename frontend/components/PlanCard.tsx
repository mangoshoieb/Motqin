"use client";

import { Check } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { useAnimatedNumber } from "@/app/hooks/useAnimatedNumber";
import type { SubscriptionPlan } from "@/app/data/subscriptionPlans";

interface PlanCardProps {
  plan: SubscriptionPlan;
  periodMonths: number;
  discountRate: number; // 0..1
}

export const PlanCard = ({ plan, periodMonths, discountRate }: PlanCardProps) => {
  const finalMonthly = Math.round(plan.monthlyPrice * (1 - discountRate));
  const animatedPrice = useAnimatedNumber(finalMonthly);
  const hasDiscount = discountRate > 0;
  const totalForPeriod = finalMonthly * periodMonths;

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-3xl p-8 border transition",
        plan.highlighted
          ? "bg-blue-950 text-white border-blue-900 shadow-xl md:scale-[1.03] dark:bg-blue-900 dark:border-blue-800"
          : "bg-white text-zinc-900 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-800"
      )}
    >
      {plan.badge && (
        <span className="absolute -top-3 right-6 px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-zinc-900">
          {plan.badge}
        </span>
      )}

      {hasDiscount && (
        <span className="absolute -top-3 left-6 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white">
          خصم {Math.round(discountRate * 100)}٪
        </span>
      )}

      <h3 className="text-xl font-bold">{plan.name}</h3>
      <p
        className={cn(
          "text-sm mt-1",
          plan.highlighted ? "text-blue-200" : "text-zinc-500 dark:text-zinc-400"
        )}
      >
        {plan.tagline}
      </p>

      <div className="mt-6">
        {hasDiscount && (
          <span
            className={cn(
              "block text-sm line-through",
              plan.highlighted ? "text-blue-300" : "text-zinc-400 dark:text-zinc-500"
            )}
          >
            {plan.monthlyPrice} ج.م
          </span>
        )}

        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-extrabold tabular-nums">{animatedPrice}</span>
          <span className="text-sm">ج.م / شهرياً</span>
        </div>

        <p
          className={cn(
            "text-xs mt-1",
            plan.highlighted ? "text-blue-200" : "text-zinc-500 dark:text-zinc-400"
          )}
        >
          يُدفع {totalForPeriod} ج.م كل {periodMonths === 1 ? "شهر" : `${periodMonths} أشهر`}
        </p>
      </div>

      <button
        type="button"
        className={cn(
          "mt-6 w-full py-3 rounded-full font-semibold transition",
          plan.highlighted
            ? "bg-white text-blue-950 hover:bg-blue-50"
            : "border border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
        )}
      >
        اختر الخطة
      </button>

      <ul className="mt-6 flex flex-col gap-5 text-sm">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <Check
              className={cn(
                "size-4 mt-0.5 shrink-0",
                plan.highlighted ? "text-emerald-300" : "text-emerald-600 dark:text-emerald-400"
              )}
            />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
