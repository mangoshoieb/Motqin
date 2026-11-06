"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight, Loader2, Plus, RotateCcw, Wallet as WalletIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/app/lib/utils";
import Skeleton from "@/components/ui/Skeleton";
import { toastApiError } from "@/app/lib/api-error";
import { formatDateTime, formatEgp, formatMoney } from "@/app/lib/payments";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_META,
  TRANSACTION_TYPE_LABELS,
  WALLET_PAGE_SIZE,
} from "@/app/constants/payment.constants";
import { PAYMENT_KEYS, useTransactions, useWallet } from "@/app/hooks/usePayments";
import { paymentService } from "@/app/services/payment.service";
import { WalletTransaction } from "@/app/types/payment.types";
import { ghostButton, primaryButton } from "@/components/TrackingTables/ui";
import { TopUpDialog } from "./TopUpDialog";

export function WalletSection({ registered }: { registered: boolean }) {
  const [page, setPage] = useState(1);
  const [topUp, setTopUp] = useState(false);
  const { data: wallet, isLoading } = useWallet(registered);
  const { data: transactions, isFetching } = useTransactions(page, registered);

  if (!registered) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <WalletIcon size={36} className="mx-auto text-blue-600" />
        <h2 className="mt-3 text-lg font-bold text-zinc-900 dark:text-zinc-100">المحفظة للحسابات المسجلة</h2>
        <p className="mt-1 text-sm text-zinc-500">أنشئ حسابك لتشحن المحفظة وتشترك في الباقات، وكل ما أنجزته كزائر ينتقل معك.</p>
        <Link href="/sign-up" className={cn(primaryButton, "mt-5")}>
          إنشاء حساب
        </Link>
      </div>
    );
  }

  const pageCount = Math.max(1, Math.ceil((transactions?.total ?? 0) / WALLET_PAGE_SIZE));

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex flex-wrap items-center gap-6 rounded-3xl bg-gradient-to-br from-blue-950 to-indigo-900 p-8 text-white shadow-xl">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-blue-200">رصيد المحفظة</p>
          {isLoading ? (
            <Skeleton className="mt-2 h-12 w-40 bg-white/20" />
          ) : (
            <p className="mt-1 text-5xl font-extrabold tabular-nums">
              {formatMoney(wallet?.balance ?? 0)} <span className="text-lg font-semibold">ج.م</span>
            </p>
          )}
          <p className="mt-2 text-xs text-blue-200">تُدفع الباقات من الرصيد. يُضاف المال فقط عند تأكيد الدفع من Paymob.</p>
        </div>
        <button
          type="button"
          onClick={() => setTopUp(true)}
          className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-bold text-blue-950 transition hover:bg-blue-50"
        >
          <Plus size={18} /> شحن المحفظة
        </button>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
          <h2 className="font-bold text-zinc-900 dark:text-zinc-100">سجل المحفظة</h2>
          {isFetching && <Loader2 size={16} className="animate-spin text-zinc-400" />}
        </div>
        {!transactions ? (
          <div className="flex flex-col gap-2 p-6">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : transactions.items.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-zinc-500">لا توجد عمليات بعد. اشحن المحفظة لتبدأ.</p>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {transactions.items.map((t) => (
              <TransactionRow key={t.id} transaction={t} />
            ))}
          </ul>
        )}
        {pageCount > 1 && (
          <div className="flex items-center justify-center gap-3 border-t border-zinc-100 px-6 py-3 text-sm dark:border-zinc-800">
            <button type="button" onClick={() => setPage((p) => p - 1)} disabled={page <= 1} className={ghostButton}>
              <ChevronRight size={16} /> الأحدث
            </button>
            <span dir="ltr" className="tabular-nums text-zinc-500">
              {page} / {pageCount}
            </span>
            <button type="button" onClick={() => setPage((p) => p + 1)} disabled={page >= pageCount} className={ghostButton}>
              الأقدم <ChevronLeft size={16} />
            </button>
          </div>
        )}
      </div>

      {topUp && <TopUpDialog onClose={() => setTopUp(false)} />}
    </div>
  );
}

function TransactionRow({ transaction: t }: { transaction: WalletTransaction }) {
  const queryClient = useQueryClient();
  const [checking, setChecking] = useState(false);
  const incoming = t.amount > 0;
  const status = PAYMENT_STATUS_META[t.status] ?? PAYMENT_STATUS_META.Pending;

  // A top-up still pending (say, after closing the app): ask Paymob's
  // outcome again by its reference.
  const check = async () => {
    if (!t.reference) return;
    setChecking(true);
    try {
      const recharge = await paymentService.getRecharge(t.reference);
      if (recharge.status === "Succeeded") {
        toast.success(`تم شحن المحفظة بمبلغ ${formatEgp(recharge.receivedAmount ?? recharge.requestedAmount)}`);
      } else if (recharge.status === "Pending") {
        toast.info("ما زالت العملية قيد المعالجة، تحقق بعد قليل");
      } else {
        toast.error(recharge.status === "Expired" ? "انتهت مهلة هذه العملية دون دفع" : "لم تكتمل عملية الدفع");
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
