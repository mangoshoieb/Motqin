"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PlansSection } from "@/components/Payments/PlansSection";
import { WalletSection } from "@/components/Payments/WalletSection";
import { CouponAnnouncement } from "@/components/Payments/CouponAnnouncement";

// Old ?tab= links: those parts live in Settings (the wallet is on this page).
const MOVED_TABS: Record<string, string> = {
  mine: "/settings/billing/limits",
  sales: "/settings/sales",
};

// العروض والمحفظة: the wallet first, then every plan for this account with
// the term, a coupon, and a quick way to drop main features from a plan.
// Every "see offers" button in the app lands here.
const OffersContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const moved = MOVED_TABS[searchParams.get("tab") ?? ""];
  // The applied coupon (normalised; "" = none), shared by the announcement
  // and the coupon field.
  const [coupon, setCoupon] = useState("");

  useEffect(() => {
    if (moved) router.replace(moved);
  }, [moved, router]);

  return (
    <div dir="rtl" className="min-h-screen bg-zinc-100 px-6 py-10 sm:px-10 dark:bg-zinc-950">
      <WalletSection />
      <CouponAnnouncement applied={coupon} onApply={setCoupon} />

      <div className="mx-auto mb-10 max-w-5xl text-center">
        <h1 className="text-3xl font-extrabold text-blue-950 sm:text-4xl dark:text-blue-100">اشتراكك على كيفك</h1>
      </div>

      <PlansSection coupon={coupon} onCoupon={setCoupon} />
    </div>
  );
};

const SubscriptionPage = () => (
  <Suspense fallback={null}>
    <OffersContent />
  </Suspense>
);

export default SubscriptionPage;
