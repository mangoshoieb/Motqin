"use client";

import { useState } from "react";
import Link from "next/link";
import { Gauge, Plus, ReceiptText } from "lucide-react";
import Skeleton from "@/components/ui/Skeleton";
import { useAuthKind } from "@/app/hooks/useAuthKind";
import { useWallet } from "@/app/hooks/usePayments";
import { TopUpDialog } from "./TopUpDialog";
import { AnimatedMoney } from "./AnimatedMoney";

// The wallet, first thing on the plans page: plans are paid from it, so the
// balance sits right above them. (It used to be its own Settings page.)
export function WalletSection() {
  const registered = useAuthKind() === "user";
  const [topUp, setTopUp] = useState(false);
  const { data: wallet, isLoading } = useWallet(registered);

  // Guests have no wallet; the plans below still show what they'd get.
  if (!registered) return null;

  return (
    <section className="mx-auto mb-10 flex max-w-6xl flex-wrap items-center gap-6 rounded-3xl bg-gradient-to-br from-blue-950 to-indigo-900 p-6 text-white shadow-lg sm:p-7">
      <div className="min-w-0 flex-1">
        <p className="text-sm text-blue-200">رصيد المحفظة</p>
        {isLoading ? (
          <Skeleton className="mt-2 h-11 w-36 bg-white/20" />
        ) : (
          <p className="mt-1 text-4xl font-extrabold tabular-nums">
            <AnimatedMoney value={wallet?.balance ?? 0} /> <span className="text-base font-semibold">ج.م</span>
          </p>
        )}
        <p className="mt-2 text-xs text-blue-200">تُدفع الباقات من رصيد المحفظة، ويُضاف المال فقط عند تأكيد الدفع من Paymob.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/settings/billing/transactions"
          className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-blue-100 transition hover:bg-white/10"
        >
          <ReceiptText size={16} /> سجل المعاملات
        </Link>
        <Link
          href="/settings/billing/limits"
          className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-blue-100 transition hover:bg-white/10"
        >
          <Gauge size={16} /> باقتي وحدودها
        </Link>
        <button
          type="button"
          onClick={() => setTopUp(true)}
          className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-bold text-blue-950 transition hover:bg-blue-50"
        >
          <Plus size={18} /> اشحن المحفظة
        </button>
      </div>

      {topUp && <TopUpDialog onClose={() => setTopUp(false)} />}
    </section>
  );
}
