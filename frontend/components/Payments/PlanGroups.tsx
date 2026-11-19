"use client";

import { Check, Lock, X } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { FEATURE_GROUP_LABELS } from "@/app/constants/payment.constants";
import {
  featureLabel,
  featureValueText,
  formatMoney,
  isFeatureOn,
  leftOutText,
  rateLimitText,
} from "@/app/lib/payments";
import { Bundle, BundleFeature, BundleGroup } from "@/app/types/payment.types";
import { Switch } from "@/components/ui/switch";

// The plan's groups (or its features grouped by main feature, for plans
// without groups), limited to the audience's features (ownKeys: the Free
// plan's feature list; empty = keep everything).
export const visibleGroups = (bundle: Bundle, ownKeys: Set<string>): BundleGroup[] => {
  const keep = (f: BundleFeature) => ownKeys.size === 0 || ownKeys.has(f.feature);
  const source: BundleGroup[] = bundle.groups?.length
    ? bundle.groups
    : [...new Set(bundle.features.map((f) => f.group))].map((group) => ({
        group,
        removable: false,
        discountPercent: null,
        saving: null,
        features: bundle.features.filter((f) => f.group === group),
      }));
  return source.map((g) => ({ ...g, features: g.features.filter(keep) })).filter((g) => g.features.length > 0);
};

// One main feature of a plan: its features with their limits, and — when the
// plan can drop it — a switch, its discount, and what's left without it.
export function GroupCard({
  group,
  canRemove,
  isOn,
  isLast,
  onToggle,
}: {
  group: BundleGroup;
  canRemove: boolean;
  isOn: boolean;
  isLast: boolean;
  onToggle: (on: boolean) => void;
}) {
  return (
    <section
      className={cn(
        "rounded-3xl border bg-white p-6 transition dark:bg-zinc-900",
        isOn ? "border-zinc-200 dark:border-zinc-800" : "border-dashed border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/60",
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        <h2 className={cn("flex-1 text-lg font-bold", isOn ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500")}>
          {FEATURE_GROUP_LABELS[group.group] ?? group.group}
        </h2>
        {canRemove ? (
          <>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-bold",
                isOn ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
              )}
            >
              −{group.discountPercent}٪{group.saving ? ` · وفّر ${formatMoney(group.saving)} ج.م` : ""}
            </span>
            <span title={isLast ? "اترك ميزة رئيسية واحدة على الأقل" : undefined}>
              <Switch
                checked={isOn}
                disabled={isLast}
                onCheckedChange={(next) => onToggle(next)}
                aria-label={FEATURE_GROUP_LABELS[group.group] ?? group.group}
                className="bg-zinc-300 data-[checked]:bg-blue-600 dark:bg-zinc-700 dark:data-[checked]:bg-blue-500"
              />
            </span>
          </>
        ) : (
          <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
            <Lock size={12} /> مضمّنة دائمًا
          </span>
        )}
      </div>
      {!isOn && <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">أوقفتها: يبقى لك من مزاياها ما يلي</p>}

      <ul className="mt-4 flex flex-col gap-3 text-sm">
        {group.features.map((feature) => {
          const on = isFeatureOn(feature);
          const left = leftOutText(feature);
          const rate = rateLimitText(feature);
          const value = feature.type === "Access" ? null : featureValueText(feature.type, feature.access, feature.limit);
          return (
            <li key={feature.feature} className="flex items-start gap-2">
              {(isOn ? on : feature.accessIfLeftOut && feature.accessIfLeftOut !== "Off") ? (
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <X className="mt-0.5 size-4 shrink-0 text-zinc-400" />
              )}
              <span className={cn(!on && isOn && "opacity-50")}>
                {featureLabel(feature.feature, feature.displayName)}
                {isOn ? (
                  value && <b> · {value}</b>
                ) : (
                  <>
                    {" · "}
                    <b className="text-amber-700 dark:text-amber-400">{left ?? "غير متاح"}</b>
                    {value && <span className="text-zinc-400"> بدلًا من {value}</span>}
                    {feature.type === "Access" && on && <span className="text-zinc-400"> بدلًا من متاح</span>}
                  </>
                )}
                {isOn && on && rate && <span className="block text-xs text-zinc-500">{rate}</span>}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
