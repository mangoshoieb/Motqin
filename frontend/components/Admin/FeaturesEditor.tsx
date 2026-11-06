"use client";

import { cn } from "@/app/lib/utils";
import { FEATURE_GROUP_LABELS } from "@/app/constants/payment.constants";
import { featureLabel } from "@/app/lib/payments";
import { BundleFeature, BundleFeatureInput, FeatureAccess, FeatureCatalogueItem, FeatureType } from "@/app/types/payment.types";
import { Segmented } from "@/components/TrackingTables/ui";
import { Chip } from "./AdminHeader";

const TYPE_LABELS: Record<FeatureType, string> = {
  Usage: "استخدام شهري",
  Allowance: "عدد في نفس الوقت",
  Access: "تفعيل فقط",
};

const numberInput =
  "w-20 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-center text-sm tabular-nums outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950";

const toInt = (text: string) => {
  const n = Number(text);
  return text.trim() === "" || !Number.isFinite(n) ? null : Math.floor(n);
};

// A bundle's features as the save endpoints take them.
export const toFeatureInputs = (features: BundleFeature[]): BundleFeatureInput[] =>
  features.map((f) => ({
    feature: f.feature,
    access: f.access,
    limit: f.access === "Limited" ? f.limit : null,
    rateLimitCount: f.rateLimitCount,
    rateLimitWindowMinutes: f.rateLimitWindowMinutes,
    cooldownMinutes: f.cooldownMinutes,
  }));

// Every catalogue feature once: an Access row is on/off; Usage and
// Allowance rows are off, a number or unlimited; only Usage rows take a
// rate limit (count + window together, cooldown only with them).
export function FeaturesEditor({
  catalogue,
  value,
  onChange,
}: {
  catalogue: FeatureCatalogueItem[];
  value: BundleFeatureInput[];
  onChange: (value: BundleFeatureInput[]) => void;
}) {
  const byKey = new Map(value.map((f) => [f.feature, f]));
  const set = (key: string, patch: Partial<BundleFeatureInput>) => {
    const base = byKey.get(key) ?? { feature: key, access: "Off" as FeatureAccess, limit: null };
    const next = { ...base, ...patch };
    if (next.access !== "Limited") next.limit = null;
    if (next.access === "Off") {
      next.rateLimitCount = null;
      next.rateLimitWindowMinutes = null;
      next.cooldownMinutes = null;
    }
    onChange([...value.filter((f) => f.feature !== key), next]);
  };

  // By group, in the catalogue's order of first appearance (a group's
  // features aren't always next to each other: Mentors and Mentees).
  const byGroup = new Map<string, FeatureCatalogueItem[]>();
  catalogue.forEach((item) => byGroup.set(item.group, [...(byGroup.get(item.group) ?? []), item]));
  const groups = [...byGroup.entries()].map(([group, items]) => ({ group, items }));

  return (
    <div className="flex flex-col gap-5">
      {groups.map(({ group, items }) => (
        <div key={group}>
          <p className="mb-2 text-xs font-bold text-blue-900 dark:text-blue-300">{FEATURE_GROUP_LABELS[group] ?? group}</p>
          <div className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {items.map((item) => {
              const current = byKey.get(item.feature) ?? { feature: item.feature, access: "Off" as FeatureAccess, limit: null };
              const limited = current.access === "Limited";
              const missingLimit = limited && (!current.limit || current.limit < 1);
              return (
                <div key={item.feature} className="flex flex-col gap-2 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="min-w-44 flex-1">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{featureLabel(item.feature, item.displayName)}</p>
                      <p className="text-[11px] text-zinc-500" dir="ltr">
                        {item.feature}
                        {item.cap ? ` · cap ${item.cap}` : ""}
                      </p>
                    </div>
                    <Chip>{TYPE_LABELS[item.type]}</Chip>
                    {item.type === "Access" ? (
                      <Segmented<FeatureAccess>
                        value={current.access === "Off" ? "Off" : "Unlimited"}
                        onChange={(access) => set(item.feature, { access })}
                        options={[
                          { value: "Off", label: "مغلق" },
                          { value: "Unlimited", label: "متاح" },
                        ]}
                        className="w-40"
                      />
                    ) : (
                      <Segmented<FeatureAccess>
                        value={current.access}
                        onChange={(access) => set(item.feature, { access, limit: access === "Limited" ? current.limit ?? 1 : null })}
                        options={[
                          { value: "Off", label: "مغلق" },
                          { value: "Limited", label: "محدود" },
                          { value: "Unlimited", label: "بلا حدود" },
                        ]}
                        className="w-56"
                      />
                    )}
                    {limited && (
                      <input
                        dir="ltr"
                        inputMode="numeric"
                        value={current.limit ?? ""}
                        onChange={(e) => set(item.feature, { limit: toInt(e.target.value) })}
                        aria-label="الحد"
                        className={cn(numberInput, missingLimit && "border-rose-400")}
                      />
                    )}
                  </div>
                  {item.type === "Usage" && current.access !== "Off" && (
                    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                      <span>حد السرعة (اختياري):</span>
                      <input
                        dir="ltr"
                        inputMode="numeric"
                        value={current.rateLimitCount ?? ""}
                        onChange={(e) => set(item.feature, { rateLimitCount: toInt(e.target.value) })}
                        placeholder="عدد"
                        className={numberInput}
                      />
                      <span>كل</span>
                      <input
                        dir="ltr"
                        inputMode="numeric"
                        value={current.rateLimitWindowMinutes ?? ""}
                        onChange={(e) => set(item.feature, { rateLimitWindowMinutes: toInt(e.target.value) })}
                        placeholder="دقيقة"
                        className={numberInput}
                      />
                      <span>دقيقة، ثم انتظار</span>
                      <input
                        dir="ltr"
                        inputMode="numeric"
                        value={current.cooldownMinutes ?? ""}
                        onChange={(e) => set(item.feature, { cooldownMinutes: toInt(e.target.value) })}
                        placeholder="دقيقة"
                        className={numberInput}
                      />
                      <span>دقيقة</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// Problems the server would refuse, caught before sending.
export const featuresProblem = (catalogue: FeatureCatalogueItem[], value: BundleFeatureInput[]) => {
  const byKey = new Map(value.map((f) => [f.feature, f]));
  for (const item of catalogue) {
    const f = byKey.get(item.feature);
    if (!f) return `حدد ${featureLabel(item.feature, item.displayName)}`;
    if (f.access === "Limited" && (!f.limit || f.limit < 1)) return `حد ${featureLabel(item.feature, item.displayName)} يجب أن يكون أكبر من صفر`;
    const count = f.rateLimitCount ?? null;
    const window = f.rateLimitWindowMinutes ?? null;
    if ((count === null) !== (window === null)) return `حد السرعة لـ ${featureLabel(item.feature, item.displayName)}: اكتب العدد والمدة معًا`;
    if (f.cooldownMinutes && count === null) return `مدة الانتظار لـ ${featureLabel(item.feature, item.displayName)} تحتاج حد سرعة`;
  }
  return null;
};
