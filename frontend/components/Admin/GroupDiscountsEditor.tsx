"use client";

import { cn } from "@/app/lib/utils";
import {
  AUDIENCE_GROUPS,
  FEATURE_GROUP_LABELS,
  GROUP_DISCOUNT_MAX,
  GROUP_DISCOUNT_MIN,
} from "@/app/constants/payment.constants";
import { BundleAudience } from "@/app/types/payment.types";

// Main feature → the % typed for it; a main feature not in the map is sold
// with the plan.
export type DiscountDraft = Record<string, string>;

export const draftFromDiscounts = (discounts: Record<string, number> | undefined): DiscountDraft =>
  Object.fromEntries(Object.entries(discounts ?? {}).map(([group, percent]) => [group, String(percent)]));

export const discountsFromDraft = (draft: DiscountDraft) =>
  Object.fromEntries(Object.entries(draft).map(([group, percent]) => [group, Number(percent)]));

// The server's rules: none, or at least two; each 5–90%; and keeping only
// the cheapest one can't take more than 90% off.
export const discountsProblem = (draft: DiscountDraft) => {
  const values = Object.entries(draft);
  if (values.length === 0) return null;
  if (values.length === 1) return "اختر ميزتين رئيسيتين على الأقل، أو لا شيء لتُباع الباقة كاملة";
  for (const [group, text] of values) {
    const n = Number(text);
    if (!Number.isInteger(n) || n < GROUP_DISCOUNT_MIN || n > GROUP_DISCOUNT_MAX) {
      return `خصم ${FEATURE_GROUP_LABELS[group] ?? group} من ${GROUP_DISCOUNT_MIN} إلى ${GROUP_DISCOUNT_MAX}٪`;
    }
  }
  const sorted = values.map(([, text]) => Number(text)).sort((a, b) => a - b);
  const allButSmallest = sorted.slice(1).reduce((sum, n) => sum + n, 0);
  if (allButSmallest > GROUP_DISCOUNT_MAX) {
    return `الإبقاء على ميزة واحدة فقط سيخصم ${allButSmallest}٪، والحد الأقصى ${GROUP_DISCOUNT_MAX}٪`;
  }
  return null;
};

// "اشتراكك على كيفك" for one paid plan: which main features students may
// take off, and what each takes off the price.
export function GroupDiscountsEditor({
  audience,
  value,
  onChange,
}: {
  audience: BundleAudience;
  value: DiscountDraft;
  onChange: (value: DiscountDraft) => void;
}) {
  const groups = AUDIENCE_GROUPS[audience];
  const toggle = (group: string, on: boolean) => {
    const next = { ...value };
    if (on) next[group] = next[group] ?? "10";
    else delete next[group];
    onChange(next);
  };
  const problem = discountsProblem(value);

  return (
    <div className="rounded-2xl border border-violet-200 bg-violet-50/50 p-4 dark:border-violet-900/50 dark:bg-violet-950/20">
      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">اشتراكك على كيفك</p>
      <p className="mt-0.5 text-xs text-zinc-500">
        المميزات الرئيسية التي يستطيع الطالب حذفها وكم تخصم من السعر. لا شيء = تُباع الباقة كاملة. يصل التعديل للمشترين الجدد فقط.
      </p>
      {groups.length < 2 ? (
        <p className="mt-3 text-xs text-zinc-500">باقات هذه الفئة تُباع كاملة.</p>
      ) : (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {groups.map((group) => {
            const on = group in value;
            return (
              <div
                key={group}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-3 py-2",
                  on ? "border-violet-300 bg-white dark:border-violet-800 dark:bg-zinc-900" : "border-zinc-200 dark:border-zinc-700",
                )}
              >
                <label className="flex flex-1 items-center gap-2 text-sm">
                  <input type="checkbox" checked={on} onChange={(e) => toggle(group, e.target.checked)} />
                  {FEATURE_GROUP_LABELS[group] ?? group}
                </label>
                {on && (
                  <span className="flex items-center gap-1 text-sm">
                    <input
                      dir="ltr"
                      inputMode="numeric"
                      value={value[group]}
                      onChange={(e) => onChange({ ...value, [group]: e.target.value })}
                      aria-label={`خصم ${FEATURE_GROUP_LABELS[group] ?? group}`}
                      className="w-14 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-center tabular-nums outline-none focus:border-violet-500 dark:border-zinc-700 dark:bg-zinc-950"
                    />
                    ٪
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
      {problem && <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">{problem}</p>}
    </div>
  );
}
