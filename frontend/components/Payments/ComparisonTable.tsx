"use client";

import { Check, Minus } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { FEATURE_GROUP_LABELS, TIER_META, type TermMonths } from "@/app/constants/payment.constants";
import {
  featureLabel,
  featureNote,
  featureValueText,
  formatMoney,
  rateLimitText,
  type PlanTier,
} from "@/app/lib/payments";
import { Bundle, BundleFeature } from "@/app/types/payment.types";

function ValueCell({ feature }: { feature: BundleFeature | undefined }) {
  if (!feature || feature.access === "Off") return <Minus size={16} className="mx-auto text-zinc-300 dark:text-zinc-600" />;
  if (feature.type === "Access") return <Check size={18} className="mx-auto text-emerald-600 dark:text-emerald-400" />;
  const rate = rateLimitText(feature);
  return (
    <>
      <span className="font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
        {featureValueText(feature.type, feature.access, feature.limit)}
      </span>
      {rate && <span className="mt-0.5 block text-[11px] leading-4 text-amber-700 dark:text-amber-400">{rate}</span>}
    </>
  );
}

// Every feature of the audience, Free beside the three plans. Limits are the
// same for every term, so the chosen term only changes the prices on top.
export function ComparisonTable({
  free,
  tiers,
  term,
}: {
  free: Bundle | null;
  tiers: PlanTier[];
  term: TermMonths;
}) {
  const columns = tiers.map((t) => ({ tier: t.tier, bundle: t.terms[term] ?? t.terms[1] }));
  const reference = columns[0]?.bundle ?? free;
  if (!reference) return null;

  // Rows in the order the server lists them, under their group.
  const byGroup = new Map<string, string[]>();
  reference.features.forEach((f) => byGroup.set(f.group, [...(byGroup.get(f.group) ?? []), f.feature]));
  const groups = [...byGroup.entries()].map(([group, keys]) => ({ group, keys }));

  const pick = (bundle: Bundle | null | undefined, key: string) => bundle?.features.find((f) => f.feature === key);

  return (
    <div className="overflow-x-auto rounded-3xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800">
            <th className="w-[34%] px-5 py-4 text-start font-semibold text-zinc-500">الميزة</th>
            <th className="bg-zinc-50 px-4 py-4 text-center dark:bg-zinc-950/40">
              <span className="block font-bold text-zinc-900 dark:text-zinc-100">مجانية</span>
              <span className="text-xs font-normal text-zinc-500">للجميع</span>
            </th>
            {columns.map(({ tier, bundle }) => (
              <th key={tier} className="px-4 py-4 text-center">
                <span className="block font-bold text-zinc-900 dark:text-zinc-100">{TIER_META[tier]?.name ?? tier}</span>
                {bundle && (
                  <span className="text-xs font-normal text-zinc-500">
                    {formatMoney(Math.round(bundle.price / term))} ج.م شهريًا
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map(({ group, keys }) => (
            <GroupRows key={group} group={group} keys={keys} free={free} columns={columns} pick={pick} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GroupRows({
  group,
  keys,
  free,
  columns,
  pick,
}: {
  group: string;
  keys: string[];
  free: Bundle | null;
  columns: { tier: string; bundle: Bundle | undefined }[];
  pick: (bundle: Bundle | null | undefined, key: string) => BundleFeature | undefined;
}) {
  return (
    <>
      <tr>
        <td colSpan={columns.length + 2} className="bg-zinc-50/70 px-5 py-2 text-xs font-bold text-blue-900 dark:bg-zinc-950/30 dark:text-blue-300">
          {FEATURE_GROUP_LABELS[group] ?? group}
        </td>
      </tr>
      {keys.map((key) => {
        const any = pick(columns[0]?.bundle, key);
        const note = featureNote(key);
        return (
          <tr key={key} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
            <td className="px-5 py-3 align-top">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">{featureLabel(key, any?.displayName)}</span>
              {note && <span className="mt-0.5 block text-xs text-zinc-500">{note}</span>}
            </td>
            <td className={cn("bg-zinc-50 px-4 py-3 text-center align-top dark:bg-zinc-950/40")}>
              <ValueCell feature={pick(free, key)} />
            </td>
            {columns.map(({ tier, bundle }) => (
              <td key={tier} className="px-4 py-3 text-center align-top">
                <ValueCell feature={pick(bundle, key)} />
              </td>
            ))}
          </tr>
        );
      })}
    </>
  );
}
