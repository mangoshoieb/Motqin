"use client";

import { Suspense, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BadgePercent, CreditCard, LayoutGrid, Wallet, type LucideIcon } from "lucide-react";
import { cn } from "@/app/lib/utils";
import Skeleton from "@/components/ui/Skeleton";
import { useAuth } from "@/app/(public)/context/auth.context";
import { useAuthKind } from "@/app/hooks/useAuthKind";
import { useMyPartnerReport } from "@/app/hooks/usePayments";
import { isTeacherAccount } from "@/app/lib/payments";
import { PlansSection } from "@/components/Payments/PlansSection";
import { MySubscriptionSection } from "@/components/Payments/MySubscriptionSection";
import { WalletSection } from "@/components/Payments/WalletSection";
import { PartnerReportView, rangeDates, type SalesRange } from "@/components/Payments/PartnerReportView";

type Tab = "plans" | "mine" | "wallet" | "sales";

const TABS: { value: Tab; label: string; Icon: LucideIcon }[] = [
  { value: "plans", label: "الباقات", Icon: LayoutGrid },
  { value: "mine", label: "اشتراكي", Icon: CreditCard },
  { value: "wallet", label: "المحفظة", Icon: Wallet },
  { value: "sales", label: "مبيعاتي", Icon: BadgePercent },
];

const HEADINGS: Record<Tab, { title: string; subtitle: string }> = {
  plans: {
    title: "اختر خطة الاشتراك المناسبة لك",
    subtitle: "جلسات المذاكرة والمراجعة بلا حدود في كل الخطط، والفرق في الذكاء الاصطناعي والمزايا المتقدمة",
  },
  mine: { title: "اشتراكي", subtitle: "باقتك الحالية وما تبقى من حدودها" },
  wallet: { title: "المحفظة", subtitle: "اشحن رصيدك وادفع منه الباقات" },
  sales: { title: "مبيعاتي", subtitle: "مبيعاتك بكوبوناتك وباقاتك والعمولة المستحقة لك" },
};

const SubscriptionContent = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const registered = useAuthKind() === "user";
  const [range, setRange] = useState<SalesRange>("month");
  const { from, to } = rangeDates(range);

  // The sales tab is for teacher accounts linked to a partner; anyone else
  // gets not_a_partner and doesn't see it.
  const teacher = registered && isTeacherAccount(user);
  const { data: partner, isLoading: partnerLoading, isFetching: partnerFetching } = useMyPartnerReport(from, to, teacher);
  const tabs = TABS.filter((t) => t.value !== "sales" || !!partner);

  const requested = (searchParams.get("tab") as Tab) ?? "plans";
  const tab: Tab = tabs.some((t) => t.value === requested) ? requested : requested === "sales" && partnerLoading ? "sales" : "plans";
  const heading = HEADINGS[tab];

  const setTab = (next: Tab) => router.replace(next === "plans" ? pathname : `${pathname}?tab=${next}`, { scroll: false });

  return (
    <div dir="rtl" className="min-h-screen bg-zinc-100 px-6 py-12 sm:px-10 dark:bg-zinc-950">
      <nav className="mx-auto mb-10 flex w-fit max-w-full gap-1 overflow-x-auto rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
        {tabs.map(({ value, label, Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition",
              tab === value
                ? "bg-blue-950 text-white dark:bg-blue-100 dark:text-blue-950"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
            )}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </nav>

      <div className="mx-auto mb-10 max-w-5xl text-center">
        <h1 className="text-3xl font-extrabold text-blue-950 sm:text-4xl dark:text-blue-100">{heading.title}</h1>
        <p className="mt-3 text-zinc-500 dark:text-zinc-400">{heading.subtitle}</p>
      </div>

      {tab === "plans" && <PlansSection />}
      {tab === "mine" && <MySubscriptionSection registered={registered} />}
      {tab === "wallet" && <WalletSection registered={registered} />}
      {tab === "sales" && (
        <div className="mx-auto max-w-5xl">
          {partner ? (
            <PartnerReportView report={partner} range={range} onRangeChange={setRange} loading={partnerFetching} />
          ) : (
            <Skeleton className="h-96 rounded-3xl" />
          )}
        </div>
      )}
    </div>
  );
};

const SubscriptionPage = () => (
  <Suspense fallback={null}>
    <SubscriptionContent />
  </Suspense>
);

export default SubscriptionPage;
