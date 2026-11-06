"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, CalendarClock, Check, Infinity as InfinityIcon, Lock, Sparkles } from "lucide-react";
import { cn } from "@/app/lib/utils";
import Skeleton from "@/components/ui/Skeleton";
import { useAuth } from "@/app/(public)/context/auth.context";
import { useBundle, useBundles, useMySubscription, useSubscriptionHistory } from "@/app/hooks/usePayments";
import { FEATURE_GROUP_LABELS, SUBSCRIPTION_STATUS_META } from "@/app/constants/payment.constants";
import {
  audienceForUser,
  bundleName,
  featureLabel,
  formatDay,
  formatEgp,
  formatMoney,
  toUtcDate,
} from "@/app/lib/payments";
import { BundleKind, Quota, UserSubscription } from "@/app/types/payment.types";
import { primaryButton, secondaryButton } from "@/components/TrackingTables/ui";

// The plan's Arabic name, looked up by id (the subscription only carries
// the catalogue's English title).
export function BundleName({ bundleId, kind, title }: { bundleId: number; kind: BundleKind; title: string }) {
  const paid = kind === "Paid";
  const { data: bundle } = useBundle(paid ? bundleId : null);
  if (!paid) return <>{bundleName({ kind, title, code: null, durationDays: 0 })}</>;
  return <>{bundle ? bundleName(bundle) : title}</>;
}

const daysLeft = (iso: string | null) => {
  const end = toUtcDate(iso);
  return end ? Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86_400_000)) : null;
};

export function MySubscriptionSection({ registered }: { registered: boolean }) {
  const { user } = useAuth();
  const { data: me, isLoading } = useMySubscription();
  const { data: history } = useSubscriptionHistory(registered);
  const paidId = me?.current.kind === "Paid" ? me.current.bundleId : null;
  const { data: currentBundle } = useBundle(paidId);
  // The features of the current plan's audience (the account's own on Free),
  // read from that audience's Free plan.
  const { data: audienceBundles } = useBundles(currentBundle?.audience ?? audienceForUser(user));
  const [showAll, setShowAll] = useState(false);

  if (isLoading || !me) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        <Skeleton className="h-48 rounded-3xl" />
        <Skeleton className="h-80 rounded-3xl" />
      </div>
    );
  }

  const { current, scheduled } = me;
  const paid = current.kind === "Paid";
  const left = daysLeft(current.endDate);
  const ownKeys = new Set(audienceBundles?.find((b) => b.kind === "Free")?.features.map((f) => f.feature) ?? []);
  const quotas = me.quotas.filter((q) => showAll || ownKeys.size === 0 || ownKeys.has(q.feature));
  const on = quotas.filter((q) => q.access !== "Off");
  const locked = quotas.filter((q) => q.access === "Off");

  const groups = new Map<string, Quota[]>();
  on.forEach((q) => groups.set(q.group, [...(groups.get(q.group) ?? []), q]));

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      {/* Current plan */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-7 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-950 text-white dark:bg-blue-900">
            <Sparkles size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-zinc-500">باقتك الحالية</p>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              <BundleName bundleId={current.bundleId} kind={current.kind} title={current.bundleTitle} />
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {current.kind === "Guest"
                ? "تجربة مجانية لا تتجدد حدودها. أنشئ حسابك للحصول على الباقة المجانية الشهرية."
                : paid
                  ? `من ${formatDay(current.startDate)} إلى ${formatDay(current.endDate)}${left !== null && !current.inGrace ? ` · يتبقى ${left} يوم` : ""}`
                  : "الباقة المجانية متاحة دائمًا وتتجدد حدودها كل شهر."}
            </p>
            {paid && current.pricePaid > 0 && (
              <p className="mt-1 text-xs text-zinc-400">
                دفعت {formatEgp(current.pricePaid)}
                {current.discountAmount > 0 && ` بعد خصم ${formatEgp(current.discountAmount)}`}
                {current.couponCode && ` (كوبون ${current.couponCode})`}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {paid && !scheduled && (
              <Link href={`/subscription/checkout?bundleId=${current.bundleId}`} className={primaryButton}>
                تجديد
              </Link>
            )}
            <Link href="/subscription?tab=plans" className={secondaryButton}>
              {paid ? "تغيير الباقة" : "ترقية الباقة"}
            </Link>
          </div>
        </div>

        {current.inGrace && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-bold">انتهت باقتك، وما زالت مزاياها متاحة حتى {formatDay(current.graceEndsAt)}</p>
              <p className="mt-0.5">جدّد الآن حتى لا تتوقف مزاياك. لتغيير الباقة يجب التجديد أولاً.</p>
            </div>
            <Link href={`/subscription/checkout?bundleId=${current.bundleId}`} className={cn(primaryButton, "bg-amber-500 hover:bg-amber-600")}>
              جدّد الآن
            </Link>
          </div>
        )}

        {scheduled && (
          <div className="mt-5 flex items-center gap-3 rounded-2xl bg-blue-50 p-4 text-sm text-blue-900 dark:bg-blue-500/10 dark:text-blue-200">
            <CalendarClock size={18} className="shrink-0" />
            <p>
              <span className="font-bold">
                <BundleName bundleId={scheduled.bundleId} kind={scheduled.kind} title={scheduled.bundleTitle} />
              </span>{" "}
              تبدأ في {formatDay(scheduled.startDate)} وتنتهي في {formatDay(scheduled.endDate)}. دُفعت بالفعل.
            </p>
          </div>
        )}
      </div>

      {/* Limits */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-7 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">حدود باقتك</h2>
          {ownKeys.size > 0 && me.quotas.length > ownKeys.size && (
            <button type="button" onClick={() => setShowAll((v) => !v)} className="text-sm font-semibold text-blue-600 hover:underline">
              {showAll ? "حدود حسابي فقط" : "عرض كل الحدود"}
            </button>
          )}
        </div>
        <div className="flex flex-col gap-6">
          {[...groups.entries()].map(([group, items]) => (
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
          <div className="mt-6 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-zinc-500">
              <Lock size={13} /> غير متاح في باقتك
            </p>
            <div className="flex flex-wrap gap-1.5">
              {locked.map((q) => (
                <span key={q.feature} className="rounded-lg bg-zinc-100 px-2.5 py-1 text-xs text-zinc-500 dark:bg-zinc-800">
                  {featureLabel(q.feature, q.displayName)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* History */}
      {registered && (history?.length ?? 0) > 0 && (
        <div className="rounded-3xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="border-b border-zinc-100 px-7 py-4 text-lg font-bold text-zinc-900 dark:border-zinc-800 dark:text-zinc-100">
            سجل الاشتراكات
          </h2>
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {history!.map((row) => (
              <HistoryRow key={row.id} row={row} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function QuotaRow({ quota: q }: { quota: Quota }) {
  const label = featureLabel(q.feature, q.displayName);
  const unlimited = q.access === "Unlimited" || q.remaining === null;

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
            <InfinityIcon size={14} /> بلا حدود
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
            {q.type === "Usage" && (q.lifetime ? " · للتجربة كاملة" : q.resetsAt ? ` · يتجدد في ${formatDay(q.resetsAt)}` : "")}
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
    <li className="flex flex-wrap items-center gap-3 px-7 py-3.5 text-sm">
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-zinc-900 dark:text-zinc-100">
          <BundleName bundleId={row.bundleId} kind={row.kind} title={row.bundleTitle} />
        </p>
        <p className="text-xs text-zinc-500">
          {row.endDate ? `${formatDay(row.startDate)} — ${formatDay(row.endDate)}` : `منذ ${formatDay(row.startDate)}`}
          {row.replacedReason === "Upgrade" && " · استُبدلت بترقية"}
        </p>
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
