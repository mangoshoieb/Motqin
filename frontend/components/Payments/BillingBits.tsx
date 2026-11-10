"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CalendarClock,
  Loader2,
  ReceiptText,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/app/lib/utils";
import { toastApiError } from "@/app/lib/api-error";
import { PAYMENT_KEYS, useBundle } from "@/app/hooks/usePayments";
import {
  FEATURE_GROUP_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_META,
  TRANSACTION_TYPE_LABELS,
} from "@/app/constants/payment.constants";
import { bundleName, formatDateTime, formatDay, formatEgp, formatMoney, toUtcDate } from "@/app/lib/payments";
import { paymentService } from "@/app/services/payment.service";
import { BundleKind, MySubscription, WalletTransaction } from "@/app/types/payment.types";
import { ghostButton, primaryButton, secondaryButton } from "@/components/TrackingTables/ui";

// The plan's Arabic name, looked up by id (the subscription only carries
// the catalogue's English title).
export function BundleName({ bundleId, kind, title }: { bundleId: number; kind: BundleKind; title: string }) {
  const paid = kind === "Paid";
  const { data: bundle } = useBundle(paid ? bundleId : null);
  if (!paid) return <>{bundleName({ kind, title, code: null, durationDays: 0 })}</>;
  return <>{bundle ? bundleName(bundle) : bundleName({ kind, title, code: null, durationDays: 0 })}</>;
}

const daysLeft = (iso: string | null) => {
  const end = toUtcDate(iso);
  return end ? Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86_400_000)) : null;
};

// The main features a customised plan kept, as chips.
export function KeptGroups({ groups, className }: { groups: string[] | null | undefined; className?: string }) {
  if (!groups?.length) return null;
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5 text-xs", className)}>
      <span className="text-zinc-500">باقتك تشمل:</span>
      {groups.map((g) => (
        <span key={g} className="rounded-md bg-blue-50 px-2 py-0.5 font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
          {FEATURE_GROUP_LABELS[g] ?? g}
        </span>
      ))}
    </div>
  );
}

// The current plan, the one waiting to start, and the grace-days warning.
export function PlanSummaryCard({ me, showLimitsLink }: { me: MySubscription; showLimitsLink?: boolean }) {
  const { current, scheduled } = me;
  const paid = current.kind === "Paid";
  const left = daysLeft(current.endDate);
  // Renewing keeps the same main features.
  const renewHref = `/subscription/checkout?bundleId=${current.bundleId}${current.groups?.length ? `&groups=${current.groups.join(",")}` : ""}`;

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-950 text-white dark:bg-blue-900">
          <Sparkles size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-zinc-500">باقتك الحالية</p>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
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
          <KeptGroups groups={current.groups} className="mt-2" />
        </div>
        <div className="flex flex-wrap gap-2">
          {paid && !scheduled && (
            <Link href={renewHref} className={primaryButton}>
              تجديد
            </Link>
          )}
          {showLimitsLink && (
            <Link href="/settings/billing/limits" className={secondaryButton}>
              حدود باقتي
            </Link>
          )}
          <Link href="/subscription" className={secondaryButton}>
            {paid ? "تغيير الباقة" : "ترقية الباقة"}
          </Link>
        </div>
      </div>

      {current.inGrace && (
        <div className="mt-5 flex flex-wrap items-start gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-bold">انتهت باقتك، وما زالت مزاياها متاحة حتى {formatDay(current.graceEndsAt)}</p>
            <p className="mt-0.5">جدّد الآن حتى لا تتوقف مزاياك. لتغيير الباقة يجب التجديد أولاً.</p>
          </div>
          <Link href={renewHref} className={cn(primaryButton, "bg-amber-500 hover:bg-amber-600")}>
            جدّد الآن
          </Link>
        </div>
      )}

      {scheduled && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl bg-blue-50 p-4 text-sm text-blue-900 dark:bg-blue-500/10 dark:text-blue-200">
          <CalendarClock size={18} className="mt-0.5 shrink-0" />
          <div>
            <p>
              <span className="font-bold">
                <BundleName bundleId={scheduled.bundleId} kind={scheduled.kind} title={scheduled.bundleTitle} />
              </span>{" "}
              تبدأ في {formatDay(scheduled.startDate)} وتنتهي في {formatDay(scheduled.endDate)}. دُفعت بالفعل.
            </p>
            <KeptGroups groups={scheduled.groups} className="mt-1.5" />
          </div>
        </div>
      )}
    </section>
  );
}

// One wallet line. A top-up still pending (say, after closing the app) can
// be checked again by its reference.
export function TransactionRow({ transaction: t }: { transaction: WalletTransaction }) {
  const queryClient = useQueryClient();
  const [checking, setChecking] = useState(false);
  const incoming = t.amount > 0;
  const status = PAYMENT_STATUS_META[t.status] ?? PAYMENT_STATUS_META.Pending;

  const check = async () => {
    if (!t.reference) return;
    setChecking(true);
    try {
      const recharge = await paymentService.getRecharge(t.reference);
      if (recharge.status === "Succeeded") {
        toast.success(`تم شحن محفظتك بمبلغ ${formatEgp(recharge.receivedAmount ?? recharge.requestedAmount)}`);
      } else if (recharge.status === "Pending") {
        toast.info("جارٍ تأكيد الدفع، سنضيف المبلغ لمحفظتك فور تأكيده");
      } else {
        toast.error(recharge.status === "Expired" ? "انتهت مهلة الدفع" : "لم تتم عملية الدفع");
      }
      void queryClient.invalidateQueries({ queryKey: PAYMENT_KEYS.wallet });
    } catch (error) {
      toastApiError("تعذر التحقق من العملية", error);
    } finally {
      setChecking(false);
    }
  };

  return (
    <li className="flex items-center gap-4 px-6 py-3.5">
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          incoming ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800",
        )}
      >
        {incoming ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-zinc-900 dark:text-zinc-100">
          {TRANSACTION_TYPE_LABELS[t.type] ?? t.type}
          {t.paymentMethod && (
            <span className="font-normal text-zinc-500"> · {PAYMENT_METHOD_LABELS[t.paymentMethod] ?? t.paymentMethod}</span>
          )}
        </p>
        <p className="text-xs text-zinc-500">{formatDateTime(t.createdAt)}</p>
      </div>
      {t.status !== "Succeeded" && (
        <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-bold", status.className)}>{status.label}</span>
      )}
      {t.status === "Succeeded" && (
        <Link href={`/subscription/receipt/${t.id}`} className={ghostButton}>
          <ReceiptText size={14} /> إيصال
        </Link>
      )}
      {t.type === "Deposit" && t.status === "Pending" && t.reference && (
        <button type="button" onClick={() => void check()} disabled={checking} className={ghostButton}>
          {checking ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />} تحقق
        </button>
      )}
      <span
        dir="ltr"
        className={cn(
          "w-24 shrink-0 text-start font-bold tabular-nums",
          incoming ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-900 dark:text-zinc-100",
          t.status !== "Succeeded" && "opacity-50",
        )}
      >
        {incoming ? "+" : t.amount < 0 ? "−" : ""}
        {formatMoney(Math.abs(t.amount))}
      </span>
    </li>
  );
}

// Page title row inside Settings.
export function SettingsTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{title}</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>
    </div>
  );
}
