"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Infinity as InfinityIcon, Lock, MinusCircle, Plus } from "lucide-react";
import { cn } from "@/app/lib/utils";
import Skeleton from "@/components/ui/Skeleton";
import { useAuth } from "@/app/(public)/context/auth.context";
import { useAuthKind } from "@/app/hooks/useAuthKind";
import { useBundle, useBundles, useMySubscription, useSubscriptionHistory } from "@/app/hooks/usePayments";
import { FEATURE_GROUP_LABELS, SUBSCRIPTION_STATUS_META } from "@/app/constants/payment.constants";
import { audienceForUser, featureLabel, formatDay, formatEgp, formatMoney, keptGroupsParam } from "@/app/lib/payments";
import { Quota, UserSubscription } from "@/app/types/payment.types";
import { BundleName, KeptGroups, PlanSummaryCard, SettingsTitle } from "@/components/Payments/BillingBits";
import { primaryButton } from "@/components/TrackingTables/ui";

// باقتي وحدودها: one row per feature with what's used and when it resets,
// the main features taken off the plan (with a way to add them back), and
// every plan the user had.
export default function LimitsPage() {
  const { user } = useAuth();
  const authKind = useAuthKind();
  const registered = authKind === "user";
  const { data: me, isLoading } = useMySubscription(authKind !== "none");
  const { data: history } = useSubscriptionHistory(registered);
  const paidId = me?.current.kind === "Paid" ? me.current.bundleId : null;
  const { data: currentBundle } = useBundle(paidId);
  // The features of the current plan's audience (the account's own on Free),
  // read from that audience's Free plan.
  const { data: audienceBundles } = useBundles(currentBundle?.audience ?? audienceForUser(user));
  const [showAll, setShowAll] = useState(false);

  if (isLoading || !me) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  const { current } = me;
  const ownKeys = new Set(audienceBundles?.find((b) => b.kind === "Free")?.features.map((f) => f.feature) ?? []);
  const quotas = me.quotas.filter((q) => showAll || ownKeys.size === 0 || ownKeys.has(q.feature));

  // Group by main feature; a group whose features are all included: false
  // was taken off the plan.
  const byGroup = new Map<string, Quota[]>();
  quotas.forEach((q) => byGroup.set(q.group, [...(byGroup.get(q.group) ?? []), q]));
  const groups = [...byGroup.entries()];
  const removed = groups.filter(([, items]) => items.every((q) => q.included === false));
  const kept = groups
    .filter(([, items]) => !items.every((q) => q.included === false))
    .map(([group, items]) => [group, items.filter((q) => q.access !== "Off")] as const)
    .filter(([, items]) => items.length > 0);
  const locked = quotas.filter((q) => q.access === "Off" && q.included !== false);

  // Adding a main feature back: the same plan with it kept (an Upgrade).
  const addBackHref = (group: string) => {
    const keptNow = current.groups ?? [];
    const groupsParam = currentBundle ? keptGroupsParam(currentBundle, [...keptNow, group]) : [...keptNow, group];
    return `/subscription/checkout?bundleId=${current.bundleId}${groupsParam ? `&groups=${groupsParam.join(",")}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <SettingsTitle title="باقتي وحدودها" subtitle="ما استخدمته من كل ميزة ومتى يتجدد." />

      <PlanSummaryCard me={me} />

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">الحدود</h2>
          {ownKeys.size > 0 && me.quotas.length > ownKeys.size && (
            <button type="button" onClick={() => setShowAll((v) => !v)} className="text-sm font-semibold text-blue-600 hover:underline">
              {showAll ? "حدود حسابي فقط" : "عرض كل الحدود"}
            </button>
          )}
        </div>
        <div className="flex flex-col gap-6">
          {kept.map(([group, items]) => (
            <div key={group}>
              <p className="mb-2 text-xs font-bold text-blue-900 dark:text-blue-300">{FEATURE_GROUP_LABELS[group] ?? group}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {items.map((q) => (
                  <QuotaRow key={q.feature} quota={q} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {locked.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <span className="flex items-center gap-1.5 text-xs font-bold text-zinc-500">
              <Lock size={13} /> غير متاح في باقتك:
            </span>
            {locked.map((q) => (
              <span key={q.feature} className="rounded-lg bg-zinc-100 px-2.5 py-1 text-xs text-zinc-500 dark:bg-zinc-800">
                {featureLabel(q.feature, q.displayName)}
              </span>
            ))}
            <Link href="/subscription" className="ms-auto text-sm font-semibold text-blue-600 hover:underline">
              اعرض العروض
            </Link>
          </div>
        )}
      </section>

      {removed.length > 0 && (
        <section className="rounded-2xl border border-amber-200 bg-white p-6 dark:border-amber-900/50 dark:bg-zinc-900">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">ميزات حذفتها</h2>
          <p className="mt-1 text-sm text-zinc-500">حذفت هذه المميزات من باقتك ليقل سعرها، وبقي لك نصف حدود الباقة المجانية منها.</p>
          <div className="mt-4 flex flex-col gap-4">
            {removed.map(([group, items]) => (
              <div key={group} className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
                <div className="flex flex-wrap items-center gap-3">
                  <MinusCircle size={18} className="text-amber-600" />
                  <p className="flex-1 font-bold text-zinc-900 dark:text-zinc-100">{FEATURE_GROUP_LABELS[group] ?? group}</p>
                  {current.kind === "Paid" && (
                    <Link href={addBackHref(group)} className={cn(primaryButton, "py-2")}>
                      <Plus size={16} /> أضفها
                    </Link>
                  )}
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {items.map((q) => (
                    <QuotaRow key={q.feature} quota={q} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {registered && (history?.length ?? 0) > 0 && (
        <section className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="border-b border-zinc-100 px-6 py-4 text-lg font-bold text-zinc-900 dark:border-zinc-800 dark:text-zinc-100">
            سجل الاشتراكات
          </h2>
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {history!.map((row) => (
              <HistoryRow key={row.id} row={row} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function QuotaRow({ quota: q }: { quota: Quota }) {
  const label = featureLabel(q.feature, q.displayName);
  const unlimited = q.access === "Unlimited" || q.remaining === null;

  if (q.access === "Off") {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 dark:bg-zinc-900">
        <Lock size={16} className="text-zinc-400" />
        <span className="flex-1 text-sm font-semibold text-zinc-500">{label}</span>
        <span className="text-xs text-zinc-400">غير متاح</span>
      </div>
    );
  }

  if (q.type === "Access") {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-zinc-50 px-4 py-3 dark:bg-zinc-800/50">
        <Check size={18} className="text-emerald-600" />
        <span className="flex-1 text-sm font-semibold text-zinc-800 dark:text-zinc-200">{label}</span>
        <span className="text-xs font-bold text-emerald-600">متاح</span>
      </div>
    );
  }

  const limit = q.limit ?? 0;
  const ratio = unlimited || limit === 0 ? 0 : Math.min(1, q.used / limit);
  return (
    <div className="rounded-2xl bg-zinc-50 px-4 py-3 dark:bg-zinc-800/50">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{label}</span>
        {unlimited ? (
          <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
            <InfinityIcon size={14} /> غير محدود
          </span>
        ) : (
          <span dir="ltr" className="text-xs font-bold tabular-nums text-zinc-700 dark:text-zinc-300">
            {formatMoney(q.used)} / {formatMoney(limit)}
          </span>
        )}
      </div>
      {!unlimited && (
        <>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
            <div
              className={cn("h-full rounded-full", ratio >= 1 ? "bg-rose-500" : ratio >= 0.8 ? "bg-amber-500" : "bg-blue-600")}
              style={{ width: `${ratio * 100}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-zinc-500">
            متبقي {formatMoney(q.remaining ?? 0)}
            {q.type === "Usage" && (q.lifetime ? " · من التجربة المجانية" : q.resetsAt ? ` · يتجدد في ${formatDay(q.resetsAt)}` : "")}
            {q.type === "Allowance" && " · في نفس الوقت"}
          </p>
        </>
      )}
    </div>
  );
}

function HistoryRow({ row }: { row: UserSubscription }) {
  const status = SUBSCRIPTION_STATUS_META[row.status] ?? SUBSCRIPTION_STATUS_META.Expired;
  return (
    <li className="flex flex-wrap items-center gap-3 px-6 py-3.5 text-sm">
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-zinc-900 dark:text-zinc-100">
          <BundleName bundleId={row.bundleId} kind={row.kind} title={row.bundleTitle} />
        </p>
        <p className="text-xs text-zinc-500">
          {row.endDate ? `${formatDay(row.startDate)} — ${formatDay(row.endDate)}` : `منذ ${formatDay(row.startDate)}`}
          {row.replacedReason === "Upgrade" && " · استُبدلت بترقية"}
        </p>
        <KeptGroups groups={row.groups} className="mt-1" />
      </div>
      {row.kind === "Paid" && (
        <span className="tabular-nums text-zinc-600 dark:text-zinc-300">
          {formatEgp(row.pricePaid)}
          {row.couponCode && <span className="text-xs text-zinc-400"> · {row.couponCode}</span>}
        </span>
      )}
      <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-bold", status.className)}>{status.label}</span>
    </li>
  );
}
