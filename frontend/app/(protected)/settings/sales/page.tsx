"use client";

import { useState } from "react";
import Skeleton from "@/components/ui/Skeleton";
import { useAuth } from "@/app/(public)/context/auth.context";
import { useAuthKind } from "@/app/hooks/useAuthKind";
import { useMyPartnerReport } from "@/app/hooks/usePayments";
import { isTeacherAccount } from "@/app/lib/payments";
import { SettingsTitle } from "@/components/Payments/BillingBits";
import { PartnerReportView, rangeDates, type SalesRange } from "@/components/Payments/PartnerReportView";

// For teacher accounts linked to a partner: sales made with their coupons
// or plans, and the commission they earned.
export default function SalesPage() {
  const { user } = useAuth();
  const registered = useAuthKind() === "user";
  const [range, setRange] = useState<SalesRange>("month");
  const { from, to } = rangeDates(range);
  const teacher = registered && isTeacherAccount(user);
  const { data: report, isLoading, isFetching } = useMyPartnerReport(from, to, teacher);

  return (
    <div className="flex flex-col gap-6">
      <SettingsTitle title="مبيعاتي" subtitle="مبيعاتك بكوبوناتك وباقاتك والعمولة المستحقة لك." />
      {report ? (
        <PartnerReportView report={report} range={range} onRangeChange={setRange} loading={isFetching} />
      ) : isLoading ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : (
        <p className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
          هذا الحساب غير مرتبط بأي شريك. تواصل مع الإدارة لتصبح شريكًا وتحصل على عمولة من مبيعاتك.
        </p>
      )}
    </div>
  );
}
