"use client";

import { CheckCircle2 } from "lucide-react";
import Skeleton from "@/components/ui/Skeleton";
import { PAYMENT_METHOD_LABELS } from "@/app/constants/payment.constants";
import { formatDateTime, formatEgp } from "@/app/lib/payments";
import { usePaymentMismatches } from "@/app/hooks/useAdminPayments";
import { AdminHeader } from "@/components/Admin/AdminHeader";

// Top-ups where Paymob reported a different amount from the one asked for.
// Each was credited with what actually arrived; this is for finance to check.
export default function AdminPaymentsPage() {
  const { data: mismatches, isLoading } = usePaymentMismatches();

  return (
    <div>
      <AdminHeader
        title="مراجعة المدفوعات"
        subtitle="عمليات شحن وصل فيها من Paymob مبلغ مختلف عن المطلوب. أُضيف للمحفظة ما وصل فعلًا."
      />

      {isLoading ? (
        <Skeleton className="h-48 rounded-3xl" />
      ) : !mismatches?.length ? (
        <div className="flex flex-col items-center rounded-3xl border border-zinc-200 bg-white px-6 py-14 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <CheckCircle2 size={40} className="text-emerald-500" />
          <p className="mt-3 font-bold text-zinc-900 dark:text-zinc-100">لا توجد فروق</p>
          <p className="mt-1 text-sm text-zinc-500">كل عمليات الشحن وصل فيها المبلغ المطلوب.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-xs text-zinc-500 dark:border-zinc-800">
                <th className="px-5 py-3 text-start font-semibold">المرجع</th>
                <th className="px-3 py-3 text-start font-semibold">عملية Paymob</th>
                <th className="px-3 py-3 text-start font-semibold">المستخدم</th>
                <th className="px-3 py-3 text-end font-semibold">المطلوب</th>
                <th className="px-3 py-3 text-end font-semibold">الواصل</th>
                <th className="px-3 py-3 text-start font-semibold">الطريقة</th>
                <th className="px-3 py-3 text-end font-semibold">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {mismatches.map((m) => (
                <tr key={m.transactionId}>
                  <td className="px-5 py-3 font-mono text-xs" dir="ltr">
                    {m.reference}
                  </td>
                  <td className="px-3 py-3 font-mono text-xs" dir="ltr">
                    {m.paymobTransactionId ?? "—"}
                  </td>
                  <td className="max-w-40 truncate px-3 py-3 font-mono text-xs text-zinc-500" dir="ltr" title={m.userId}>
                    {m.userId}
                  </td>
                  <td className="px-3 py-3 text-end tabular-nums">{formatEgp(m.requestedAmount)}</td>
                  <td className="px-3 py-3 text-end font-bold tabular-nums text-rose-600">{formatEgp(m.receivedAmount)}</td>
                  <td className="px-3 py-3">{m.paymentMethod ? PAYMENT_METHOD_LABELS[m.paymentMethod] ?? m.paymentMethod : "—"}</td>
                  <td className="px-3 py-3 text-end text-xs text-zinc-500">{formatDateTime(m.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
