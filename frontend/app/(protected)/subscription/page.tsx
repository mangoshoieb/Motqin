"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Settings2, Wallet } from "lucide-react";
import { useAuthKind } from "@/app/hooks/useAuthKind";
import { useWallet } from "@/app/hooks/usePayments";
import { formatEgp } from "@/app/lib/payments";
import { PlansSection } from "@/components/Payments/PlansSection";

// Old ?tab= links: those parts live in Settings now.
const MOVED_TABS: Record<string, string> = {
  mine: "/settings/billing/limits",
  wallet: "/settings/billing",
  sales: "/settings/sales",
};

// العروض: every plan for this account, the term switch and the comparison.
// It's where every "see offers" button in the app lands; the wallet, the
// plan's limits and the history are in Settings › الاشتراك والمحفظة.
const OffersContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = useAuthKind() === "user";
  const { data: wallet } = useWallet(registered);
  const moved = MOVED_TABS[searchParams.get("tab") ?? ""];

  useEffect(() => {
    if (moved) router.replace(moved);
  }, [moved, router]);

  return (
    <div dir="rtl" className="min-h-screen bg-zinc-100 px-6 py-10 sm:px-10 dark:bg-zinc-950">
      <div className="mx-auto mb-6 flex max-w-6xl justify-end gap-2">
        {registered && wallet && (
          <Link
            href="/settings/billing"
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm ring-1 ring-zinc-200 transition hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-zinc-800"
          >
            <Wallet size={16} className="text-blue-600" />
            رصيدك <span className="tabular-nums">{formatEgp(wallet.balance)}</span>
          </Link>
        )}
        <Link
          href="/settings/billing/limits"
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm ring-1 ring-zinc-200 transition hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-zinc-800"
        >
          <Settings2 size={16} className="text-blue-600" /> باقتي وحدودها
        </Link>
      </div>

      <div className="mx-auto mb-10 max-w-5xl text-center">
        <h1 className="text-3xl font-extrabold text-blue-950 sm:text-4xl dark:text-blue-100">اشتراكك على كيفك</h1>
      </div>

      <PlansSection />
    </div>
  );
};

const SubscriptionPage = () => (
  <Suspense fallback={null}>
    <OffersContent />
  </Suspense>
);

export default SubscriptionPage;
