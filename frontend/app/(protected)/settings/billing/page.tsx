"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Plus, Sparkles } from "lucide-react";
import { cn } from "@/app/lib/utils";
import Skeleton from "@/components/ui/Skeleton";
import { useAuthKind } from "@/app/hooks/useAuthKind";
import { useMySubscription, useTransactions, useWallet } from "@/app/hooks/usePayments";
import { formatMoney } from "@/app/lib/payments";
import { PlanSummaryCard, SettingsTitle, TransactionRow } from "@/components/Payments/BillingBits";
import { TopUpDialog } from "@/components/Payments/TopUpDialog";
import { PlanReminder } from "@/components/Payments/PlanReminder";
import { SignUpToUse } from "@/components/Settings/Mentors/SignUpToUse";
import { primaryButton } from "@/components/TrackingTables/ui";

const RECENT_COUNT = 5;

// Settings › الاشتراك والمحفظة: the balance, the plan, and the last few
// wallet lines. Buying happens on the offers page.
export default function BillingOverviewPage() {
  const authKind = useAuthKind();
  const registered = authKind === "user";
  const [topUp, setTopUp] = useState(false);
  const { data: wallet, isLoading: walletLoading } = useWallet(registered);
  const { data: me } = useMySubscription(authKind !== "none");
  const { data: recent } = useTransactions(1, registered, RECENT_COUNT);

  return (
    <div className="flex flex-col gap-6">
      <SettingsTitle title="الاشتراك والمحفظة" subtitle="رصيدك وباقتك وآخر العمليات. تُدفع الباقات من رصيد المحفظة." />

      <PlanReminder limitsOnly />

      {registered ? (
        <section className="flex flex-wrap items-center gap-6 rounded-2xl bg-gradient-to-br from-blue-950 to-indigo-900 p-7 text-white shadow-lg">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-blue-200">رصيد المحفظة</p>
            {walletLoading ? (
              <Skeleton className="mt-2 h-11 w-36 bg-white/20" />
            ) : (
              <p className="mt-1 text-4xl font-extrabold tabular-nums">
                {formatMoney(wallet?.balance ?? 0)} <span className="text-base font-semibold">ج.م</span>
              </p>
            )}
            <p className="mt-2 text-xs text-blue-200">يُضاف المال فقط عند تأكيد الدفع من Paymob.</p>
          </div>
          <button
            type="button"
            onClick={() => setTopUp(true)}
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-bold text-blue-950 transition hover:bg-blue-50 dark:hover:bg-blue-500/10"
          >
            <Plus size={18} /> اشحن المحفظة
          </button>
        </section>
      ) : (
        <SignUpToUse title="المحفظة للحسابات المسجلة" message="أنشئ حسابك لتشحن المحفظة وتشترك في الباقات، وكل ما أنجزته كزائر ينتقل معك." />
      )}

      {me ? <PlanSummaryCard me={me} showLimitsLink /> : <Skeleton className="h-40 rounded-2xl" />}

      <Link
        href="/subscription"
        className="flex items-center gap-4 rounded-2xl border border-blue-200 bg-blue-50 p-5 transition hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/30 dark:hover:bg-blue-950/50"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 dark:bg-blue-700 text-white">
          <Sparkles size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-blue-950 dark:text-blue-100">العروض والباقات</p>
          <p className="text-sm text-blue-800/80 dark:text-blue-300/80">قارن الباقات، أو خصّص باقتك وادفع أقل.</p>
        </div>
        <ChevronLeft size={20} className="text-blue-700 dark:text-blue-300" />
      </Link>

      {registered && (
        <section className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
            <h2 className="font-bold text-zinc-900 dark:text-zinc-100">آخر العمليات</h2>
            <Link href="/settings/billing/transactions" className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              عرض الكل
            </Link>
          </div>
          {!recent ? (
            <div className="flex flex-col gap-2 p-6">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-11" />
              ))}
            </div>
          ) : recent.items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
              <p className="text-sm text-zinc-500">لا توجد عمليات بعد. اشحن المحفظة لتبدأ.</p>
              <button type="button" onClick={() => setTopUp(true)} className={cn(primaryButton, "py-2")}>
                <Plus size={16} /> اشحن المحفظة
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {recent.items.map((t) => (
                <TransactionRow key={t.id} transaction={t} />
              ))}
            </ul>
          )}
        </section>
      )}

      {topUp && <TopUpDialog onClose={() => setTopUp(false)} />}
    </div>
  );
}
