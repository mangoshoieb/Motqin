"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/app/lib/utils";
import Skeleton from "@/components/ui/Skeleton";
import { useAuthKind } from "@/app/hooks/useAuthKind";
import { useAllTransactions } from "@/app/hooks/usePayments";
import { SettingsTitle, TransactionRow } from "@/components/Payments/BillingBits";
import { SignUpToUse } from "@/components/Settings/Mentors/SignUpToUse";
import { secondaryButton } from "@/components/TrackingTables/ui";

// The whole wallet history, newest first: every top-up and every purchase.
export default function TransactionsPage() {
  const authKind = useAuthKind();
  const registered = authKind === "user";
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useAllTransactions(registered);
  const items = data?.pages.flatMap((page) => page.items) ?? [];

  if (authKind === "guest") {
    return <SignUpToUse title="سجل المعاملات" message="أنشئ حسابك لتشحن المحفظة وتشترك في الباقات." />;
  }

  return (
    <div className="flex flex-col gap-6">
      <SettingsTitle title="سجل المعاملات" subtitle="كل عمليات الشحن والاشتراك، الأحدث أولاً. الشحن المعلّق يمكن التحقق منه مرة أخرى." />

      <section className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {isLoading ? (
          <div className="flex flex-col gap-2 p-6">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-11" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-zinc-500">لا توجد عمليات بعد.</p>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {items.map((t) => (
              <TransactionRow key={t.id} transaction={t} />
            ))}
          </ul>
        )}
        {hasNextPage && (
          <div className="border-t border-zinc-100 p-4 text-center dark:border-zinc-800">
            <button
              type="button"
              onClick={() => void fetchNextPage()}
              disabled={isFetchingNextPage}
              className={cn(secondaryButton, "py-2")}
            >
              {isFetchingNextPage && <Loader2 size={16} className="animate-spin" />} عرض المزيد
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
