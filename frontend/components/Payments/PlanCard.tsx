"use client";

import Link from "next/link";
import { Check, X } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { useAnimatedNumber } from "@/app/hooks/useAnimatedNumber";
import {
  CARD_FEATURES,
  HIGHLIGHTED_TIERS,
  PER_UNIT_FEATURE,
  TERM_EVERY,
  TIER_META,
  type TermMonths,
} from "@/app/constants/payment.constants";
import {
  featureLabel,
  featureValueText,
  findFeature,
  formatMoney,
  isFeatureOn,
  savingPercent,
} from "@/app/lib/payments";
import { Bundle, BundleAudience } from "@/app/types/payment.types";

// One plan at the chosen term: the price per month in big type, what the
// whole term costs, and the features that set the tiers apart.
export function PlanCard({
  tier,
  bundle,
  monthly,
  term,
  audience,
  isCurrent,
  buyDisabled,
}: {
  tier: string;
  bundle: Bundle;
  monthly: Bundle | undefined; // the same tier's 1-month plan, for the saving
  term: TermMonths;
  audience: BundleAudience;
  isCurrent: boolean;
  buyDisabled: boolean;
}) {
  const meta = TIER_META[tier];
  const highlighted = HIGHLIGHTED_TIERS.includes(tier);
  const perMonth = Math.round(bundle.price / term);
  const animatedPrice = useAnimatedNumber(perMonth);
  const saving = savingPercent(bundle.price, monthly?.price, term);
  const perUnit = PER_UNIT_FEATURE[audience];
  const unitLimit = perUnit ? findFeature(bundle, perUnit.feature)?.limit : null;

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-3xl border p-8 transition",
        highlighted
          ? "border-blue-900 bg-blue-950 text-white shadow-xl md:scale-[1.03] dark:border-blue-800 dark:bg-blue-900"
          : "border-zinc-200 bg-white text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100",
        isCurrent && !highlighted && "ring-2 ring-emerald-500",
      )}
    >
      {highlighted && (
        <span className="absolute -top-3 right-6 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-zinc-900">
          الأكثر طلباً
        </span>
      )}
      {isCurrent && (
        <span
          className={cn(
            "absolute -top-3 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white",
            highlighted ? "right-32" : "right-6",
          )}
        >
          باقتك الحالية
        </span>
      )}
      {saving > 0 && (
        <span className="absolute -top-3 left-6 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white">
          وفّر {saving}٪
        </span>
      )}

      <h3 className="text-xl font-bold">{meta?.name ?? bundle.title}</h3>
      <p className={cn("mt-1 min-h-10 text-sm", highlighted ? "text-blue-200" : "text-zinc-500 dark:text-zinc-400")}>
        {meta?.tagline ?? bundle.description}
      </p>

      <div className="mt-6">
        {saving > 0 && monthly && (
          <span className={cn("block text-sm line-through", highlighted ? "text-blue-300" : "text-zinc-400 dark:text-zinc-500")}>
            {formatMoney(monthly.price)} ج.م
          </span>
        )}
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-extrabold tabular-nums">{formatMoney(animatedPrice)}</span>
          <span className="text-sm">ج.م / شهرياً</span>
        </div>
        <p className={cn("mt-1 text-xs", highlighted ? "text-blue-200" : "text-zinc-500 dark:text-zinc-400")}>
          يُدفع {formatMoney(bundle.price)} ج.م {TERM_EVERY[term]}
        </p>
        {perUnit && unitLimit ? (
          <p className={cn("mt-1 text-xs", highlighted ? "text-blue-200" : "text-zinc-500 dark:text-zinc-400")}>
            ≈ {formatMoney(Math.round((perMonth / unitLimit) * 10) / 10)} ج.م {perUnit.label}
          </p>
        ) : null}
      </div>

      {buyDisabled ? (
        <span
          className={cn(
            "mt-6 w-full cursor-not-allowed rounded-full py-3 text-center font-semibold opacity-50",
            highlighted ? "bg-white text-blue-950" : "border border-blue-600 text-blue-600",
          )}
        >
          اختر الخطة
        </span>
      ) : (
        <Link
          href={`/subscription/checkout?bundleId=${bundle.id}`}
          className={cn(
            "mt-6 w-full rounded-full py-3 text-center font-semibold transition",
            highlighted
              ? "bg-white text-blue-950 hover:bg-blue-50"
              : "border border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40",
          )}
        >
          {isCurrent ? "جدّد الخطة" : "اختر الخطة"}
        </Link>
      )}

      <ul className="mt-6 flex flex-col gap-5 text-sm">
        {CARD_FEATURES[audience].map((key) => {
          const feature = findFeature(bundle, key);
          if (!feature) return null;
          const on = isFeatureOn(feature);
          return (
            <li key={key} className={cn("flex items-start gap-2", !on && "opacity-50")}>
              {on ? (
                <Check
                  className={cn("mt-0.5 size-4 shrink-0", highlighted ? "text-emerald-300" : "text-emerald-600 dark:text-emerald-400")}
                />
              ) : (
                <X className="mt-0.5 size-4 shrink-0" />
              )}
              <span>
                {featureLabel(key, feature.displayName)}
                {feature.type !== "Access" && (
                  <span className={cn("font-bold", highlighted ? "text-white" : "text-zinc-900 dark:text-zinc-100")}>
                    {" "}
                    · {featureValueText(feature.type, feature.access, feature.limit)}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
