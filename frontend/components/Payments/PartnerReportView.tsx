"use client";

import { BadgePercent, Coins, Receipt, Users } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { arabicPlanTitle, formatDateTime, formatEgp, formatMoney } from "@/app/lib/payments";
import { PartnerReport, SalesLine } from "@/app/types/payment.types";
import { Segmented } from "@/components/TrackingTables/ui";

export type SalesRange = "month" | "lastMonth" | "quarter" | "all";

const RANGE_OPTIONS: { value: SalesRange; label: string }[] = [
  { value: "month", label: "هذا الشهر" },
  { value: "lastMonth", label: "الشهر الماضي" },
  { value: "quarter", label: "آخر 3 أشهر" },
  { value: "all", label: "كل الوقت" },
];

// from is inclusive, to exclusive, at local midnight.
export const rangeDates = (range: SalesRange): { from: string; to: string } => {
  const now = new Date();
  const monthStart = (offset: number) => new Date(now.getFullYear(), now.getMonth() + offset, 1).toISOString();
  switch (range) {
    case "month":
      return { from: monthStart(0), to: monthStart(1) };
    case "lastMonth":
      return { from: monthStart(-1), to: monthStart(0) };
    case "quarter":
      return { from: monthStart(-2), to: monthStart(1) };
    default:
      return { from: "", to: "" };
  }
};

const monthFormat = new Intl.DateTimeFormat("ar-EG", { month: "long", year: "numeric" });
const monthName = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return y && m ? monthFormat.format(new Date(y, m - 1, 1)) : key;
};

// A partner's sales made with their coupons or their plans.
export function PartnerReportView({
  report,
  range,
  onRangeChange,
  loading,
}: {
  report: PartnerReport;
  range: SalesRange;
  onRangeChange: (range: SalesRange) => void;
  loading?: boolean;
}) {
  const maxMonth = Math.max(1, ...report.byMonth.map((m) => m.revenue));

  return (
    <div className={cn("flex flex-col gap-6 transition-opacity", loading && "opacity-60")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{report.partner.name}</h2>
          <p className="text-sm text-zinc-500">
            {report.partner.type === "Center" ? "سنتر" : "مدرس"} · عمولة {formatMoney(report.partner.commissionPercent)}٪
            {!report.partner.isActive && " · موقوف"}
          </p>
        </div>
        <Segmented value={range} onChange={onRangeChange} options={RANGE_OPTIONS} className="w-full whitespace-nowrap sm:w-[26rem]" />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat Icon={Receipt} label="المبيعات" value={formatMoney(report.sales)} />
        <Stat Icon={Users} label="الطلاب" value={formatMoney(report.students)} />
        <Stat Icon={Coins} label="الإيرادات" value={formatEgp(report.revenue)} />
        <Stat Icon={BadgePercent} label="العمولة" value={formatEgp(report.commission)} accent />
      </div>

      {report.sales === 0 ? (
        <p className="rounded-3xl border-2 border-dashed border-zinc-300 bg-white px-6 py-12 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
          لا توجد مبيعات في هذه الفترة. تظهر هنا كل عملية شراء تمت بكوبوناتك أو بباقاتك.
        </p>
      ) : (
        <>
          {report.byMonth.length > 0 && (
            <Card title="حسب الشهر">
              <ul className="flex flex-col gap-3">
                {report.byMonth.map((m) => (
                  <li key={m.name} className="grid grid-cols-[7rem_1fr_auto] items-center gap-3 text-sm">
                    <span className="text-zinc-600 dark:text-zinc-300">{monthName(m.name)}</span>
                    <span className="h-2.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <span className="block h-full rounded-full bg-blue-600" style={{ width: `${(m.revenue / maxMonth) * 100}%` }} />
                    </span>
                    <span className="tabular-nums text-zinc-900 dark:text-zinc-100">
                      {formatEgp(m.revenue)} <span className="text-xs text-zinc-500">· {m.count} عملية</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <LinesCard title="حسب الباقة" lines={report.byBundle.map((line) => ({ ...line, name: arabicPlanTitle(line.name) }))} />
            <LinesCard title="حسب الكوبون" lines={report.byCode} code />
          </div>

          <Card title="آخر المبيعات">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="text-xs text-zinc-500">
                    <th className="pb-2 text-start font-semibold">الطالب</th>
                    <th className="pb-2 text-start font-semibold">الباقة</th>
                    <th className="pb-2 text-start font-semibold">الكوبون</th>
                    <th className="pb-2 text-end font-semibold">المدفوع</th>
                    <th className="pb-2 text-end font-semibold">العمولة</th>
                    <th className="pb-2 text-end font-semibold">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {report.recent.map((sale, i) => (
                    <tr key={i}>
                      <td className="py-2.5 font-semibold text-zinc-900 dark:text-zinc-100">{sale.studentName}</td>
                      <td className="py-2.5 text-zinc-600 dark:text-zinc-300">{arabicPlanTitle(sale.bundleTitle)}</td>
                      <td className="py-2.5 font-mono text-xs" dir="ltr">
                        {sale.couponCode ?? "—"}
                      </td>
                      <td className="py-2.5 text-end tabular-nums">{formatEgp(sale.pricePaid)}</td>
                      <td className="py-2.5 text-end tabular-nums text-emerald-600">{formatEgp(sale.commission)}</td>
                      <td className="py-2.5 text-end text-xs text-zinc-500">{formatDateTime(sale.purchasedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function Stat({ Icon, label, value, accent }: { Icon: typeof Receipt; label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        accent
          ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40"
          : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900",
      )}
    >
      <Icon size={18} className={accent ? "text-emerald-600" : "text-zinc-400"} />
      <p className="mt-2 text-xl font-extrabold tabular-nums text-zinc-900 dark:text-zinc-100">{value}</p>
      <p className="text-xs text-zinc-500">{label}</p>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-4 font-bold text-zinc-900 dark:text-zinc-100">{title}</h3>
      {children}
    </div>
  );
}

function LinesCard({ title, lines, code }: { title: string; lines: SalesLine[]; code?: boolean }) {
  return (
    <Card title={title}>
      {lines.length === 0 ? (
        <p className="text-sm text-zinc-500">—</p>
      ) : (
        <ul className="divide-y divide-zinc-100 text-sm dark:divide-zinc-800">
          {lines.map((line) => (
            <li key={line.name} className="flex items-center gap-3 py-2.5">
              <span className={cn("min-w-0 flex-1 truncate font-semibold text-zinc-900 dark:text-zinc-100", code && "font-mono")} dir={code ? "ltr" : undefined}>
                {line.name}
              </span>
              <span className="text-xs text-zinc-500">{line.count} عملية</span>
              <span className="w-24 text-end tabular-nums">{formatEgp(line.revenue)}</span>
              <span className="w-20 text-end tabular-nums text-emerald-600">{formatEgp(line.commission)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
