"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, Printer } from "lucide-react";
import { cn } from "@/app/lib/utils";
import Skeleton from "@/components/ui/Skeleton";
import { useAuth } from "@/app/(public)/context/auth.context";
import { useAuthKind } from "@/app/hooks/useAuthKind";
import { useSubscriptionHistory, useTransaction } from "@/app/hooks/usePayments";
import { PAYMENT_METHOD_LABELS, TRANSACTION_TYPE_LABELS } from "@/app/constants/payment.constants";
import { formatDateTime, formatDay, formatEgp } from "@/app/lib/payments";
import { BundleName, KeptGroups } from "@/components/Payments/BillingBits";
import { primaryButton, secondaryButton } from "@/components/TrackingTables/ui";

// A printable receipt for one completed wallet line: a top-up, or a plan
// bought from the wallet. "حفظ" is the browser's print-to-PDF.
export default function ReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const registered = useAuthKind() === "user";
  const { data: transaction, isLoading } = useTransaction(Number(id) || null, registered);
  const { data: history } = useSubscriptionHistory(registered && !!transaction?.userSubscriptionId);
  const subscription = history?.find((s) => s.id === transaction?.userSubscriptionId);

  const contact =
    user?.email && !user.email.endsWith("@motqin.internal") ? user.email : user?.phoneNumber || user?.email || "";

  return (
    <div dir="rtl" className="min-h-screen bg-zinc-100 px-4 py-10 print:bg-white print:p-0 dark:bg-zinc-950">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between gap-3 print:hidden">
          <Link
            href="/settings/billing/transactions"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-blue-950 dark:hover:text-blue-100"
          >
            <ArrowRight size={16} /> سجل المعاملات
          </Link>
          {transaction?.status === "Succeeded" && (
            <button type="button" onClick={() => window.print()} className={primaryButton}>
              <Printer size={17} /> طباعة أو حفظ PDF
            </button>
          )}
        </div>

        {isLoading ? (
          <Skeleton className="h-[32rem] rounded-3xl" />
        ) : !transaction || transaction.status !== "Succeeded" ? (
          <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <p className="font-bold text-zinc-900 dark:text-zinc-100">لا يوجد إيصال لهذه العملية</p>
            <p className="mt-1 text-sm text-zinc-500">الإيصالات متاحة للعمليات المكتملة فقط.</p>
            <Link href="/settings/billing/transactions" className={cn(secondaryButton, "mt-5")}>
              سجل المعاملات
            </Link>
          </div>
        ) : (
          <article className="rounded-3xl border border-zinc-200 bg-white p-8 text-zinc-900 print:rounded-none print:border-0 print:p-0 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 print:dark:bg-white print:dark:text-zinc-900">
            <header className="flex items-start justify-between gap-4 border-b border-zinc-200 pb-6 dark:border-zinc-800">
              <div>
                <h1 className="text-2xl font-extrabold">إيصال</h1>
                <p className="mt-1 text-sm text-zinc-500">رقم {transaction.id}</p>
                <p className="text-sm text-zinc-500">{formatDateTime(transaction.createdAt)}</p>
              </div>
              <Image src="/متقن.svg" alt="متقن" width={120} height={40} />
            </header>

            <section className="grid gap-4 border-b border-zinc-200 py-6 text-sm sm:grid-cols-2 dark:border-zinc-800">
              <div>
                <p className="text-xs text-zinc-500">العميل</p>
                <p className="font-semibold">{user?.fullName}</p>
                {contact && (
                  <p dir="ltr" className="text-right text-zinc-500">
                    {contact}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-zinc-500">طريقة الدفع</p>
                <p className="font-semibold">
                  {transaction.type === "Deposit"
                    ? `Paymob · ${PAYMENT_METHOD_LABELS[transaction.paymentMethod ?? ""] ?? transaction.paymentMethod ?? "بطاقة"}`
                    : "رصيد المحفظة"}
                </p>
                {transaction.reference && (
                  <p dir="ltr" className="break-all text-right font-mono text-xs text-zinc-500">
                    {transaction.reference}
                  </p>
                )}
              </div>
            </section>

            <section className="py-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-zinc-500">
                    <th className="pb-2 text-start font-semibold">البيان</th>
                    <th className="pb-2 text-end font-semibold">المبلغ</th>
                  </tr>
                </thead>
                <tbody className="align-top">
                  {transaction.type === "Deposit" ? (
                    <tr>
                      <td className="py-2">شحن رصيد المحفظة</td>
                      <td className="py-2 text-end tabular-nums">{formatEgp(transaction.amount)}</td>
                    </tr>
                  ) : (
                    <>
                      <tr>
                        <td className="py-2">
                          <p className="font-semibold">
                            {TRANSACTION_TYPE_LABELS[transaction.type]}:{" "}
                            {subscription ? (
                              <BundleName bundleId={subscription.bundleId} kind={subscription.kind} title={subscription.bundleTitle} />
                            ) : (
                              "باقة"
                            )}
                          </p>
                          {subscription?.startDate && (
                            <p className="text-xs text-zinc-500">
                              من {formatDay(subscription.startDate)} إلى {formatDay(subscription.endDate)}
                            </p>
                          )}
                          <KeptGroups groups={subscription?.groups} className="mt-1" />
                        </td>
                        <td className="py-2 text-end tabular-nums">
                          {formatEgp(subscription ? subscription.listPrice : Math.abs(transaction.amount))}
                        </td>
                      </tr>
                      {subscription && subscription.discountAmount > 0 && (
                        <tr>
                          <td className="py-2 text-emerald-700">
                            خصم{subscription.couponCode ? ` (كوبون ${subscription.couponCode})` : ""}
                          </td>
                          <td className="py-2 text-end tabular-nums text-emerald-700">- {formatEgp(subscription.discountAmount)}</td>
                        </tr>
                      )}
                    </>
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-zinc-900 dark:border-zinc-100 print:border-zinc-900">
                    <td className="pt-3 text-base font-bold">{transaction.type === "Deposit" ? "المبلغ المضاف" : "المدفوع"}</td>
                    <td className="pt-3 text-end text-lg font-extrabold tabular-nums">{formatEgp(Math.abs(transaction.amount))}</td>
                  </tr>
                </tfoot>
              </table>
            </section>

            <footer className="border-t border-zinc-200 pt-4 text-xs leading-5 text-zinc-500 dark:border-zinc-800">
              الأسعار بالجنيه المصري. هذا الإيصال صادر من تطبيق متقن عن عملية مكتملة في محفظتك.
            </footer>
          </article>
        )}
      </div>
    </div>
  );
}
