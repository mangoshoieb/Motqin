"use client";

import Link from "next/link";
import { Check, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { AnimatedMoney } from "./AnimatedMoney";
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
  fromPrice,
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
  currentGroups,
  buyDisabled,
}: {
  tier: string;
  bundle: Bundle;
  monthly: Bundle | undefined; // the same tier's 1-month plan, for the saving
  term: TermMonths;
  audience: BundleAudience;
  isCurrent: boolean;
  // The main features the current plan kept: renewing keeps them.
  currentGroups?: string[] | null;
  buyDisabled: boolean;
}) {
  const meta = TIER_META[tier];
  const highlighted = HIGHLIGHTED_TIERS.includes(tier);
  const perMonth = Math.round(bundle.price / term);
  const saving = savingPercent(bundle.price, monthly?.price, term);
  const perUnit = PER_UNIT_FEATURE[audience];
  const unitLimit = perUnit ? findFeature(bundle, perUnit.feature)?.limit : null;
  // "اشتراكك على كيفك": the lowest price the plan builder can reach.
  const from = buyDisabled ? null : fromPrice(bundle);

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

      <div className="mt-6">
        {saving > 0 && monthly && (
          <span className={cn("block text-sm line-through", highlighted ? "text-blue-300" : "text-zinc-400 dark:text-zinc-500")}>
<AnimatedMoney value={monthly.price} suffix=" ج.م" />
          </span>
        )}
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-extrabold tabular-nums"><AnimatedMoney value={perMonth} /></span>
          <span className="text-sm">ج.م / شهرياً</span>
        </div>
        <p className={cn("mt-1 text-xs", highlighted ? "text-blue-200" : "text-zinc-500 dark:text-zinc-400")}>
          يُدفع <AnimatedMoney value={bundle.price} /> ج.م {TERM_EVERY[term]}
        </p>
        {perUnit && unitLimit ? (
          <p className={cn("mt-1 text-xs", highlighted ? "text-blue-200" : "text-zinc-500 dark:text-zinc-400")}>
            ≈ <AnimatedMoney value={Math.round((perMonth / unitLimit) * 10) / 10} /> ج.م {perUnit.label}
          </p>
        ) : null}
        {from !== null && (
          <p
            className={cn(
              "mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold",
              highlighted ? "bg-white/15 text-white" : "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
            )}
          >
            <SlidersHorizontal size={13} /> اشتراكك على كيفك · تبدأ من <AnimatedMoney value={Math.ceil(from / term)} /> ج.م شهريًا
          </p>
        )}
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
          href={`/subscription/checkout?bundleId=${bundle.id}${isCurrent && currentGroups?.length ? `&groups=${currentGroups.join(",")}` : ""}`}
          className={cn(
            "mt-6 w-full rounded-full py-3 text-center font-semibold transition",
            highlighted
              ? "bg-white text-blue-950 hover:bg-blue-50"
              : "border border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40",
          )}
        >
          {isCurrent ? "جدّد الخطة" : "اشترك"}
        </Link>
      )}
      {/* The plan's full list; for a customisable plan, the plan builder. */}
      <Link
        href={`/subscription/plans/${bundle.id}`}
        className={cn(
          "mt-2 w-full rounded-full py-2 text-center text-sm font-semibold transition",
          highlighted ? "text-blue-100 hover:bg-white/10" : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
        )}
      >
        {from !== null ? "خصّص باقتك" : "التفاصيل"}
      </Link>

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
