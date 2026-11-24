"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  FileSpreadsheet,
  Gauge,
  Infinity as InfinityIcon,
  KeyRound,
  Plus,
  Send,
  Sparkles,
  Table2,
  TrendingDown,
  UserX,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { useAuth } from "@/app/(public)/context/auth.context";
import { shortName } from "@/app/lib/user";
import { useMySubscription } from "@/app/hooks/usePayments";
import { useAssistants, useReports, useTrackingTables } from "@/app/hooks/useTrackingTables";
import { useTeacherAlerts } from "@/app/hooks/useTeacherAlerts";
import { isOwnTable } from "@/app/lib/tracking-table";
import { featureLabel, formatDay, formatMoney, toUtcDate } from "@/app/lib/payments";
import { AUDIENCE_GROUPS } from "@/app/constants/payment.constants";
import { MySubscription, Quota } from "@/app/types/payment.types";
import { ReportBatch, TrackingTableSummary } from "@/app/types/tracking-table.types";
import { TeacherAlert, TeacherAlertKind } from "@/app/types/teacher-home.types";
import { BundleName } from "@/components/Payments/BillingBits";
import { TableCard } from "@/components/TrackingTables/TableCard";
import Skeleton from "@/components/ui/Skeleton";

// A plan ending within this many days, or a limit used this much, goes on
// the attention list.
const ENDING_DAYS = 7;
const NEAR_LIMIT = 0.8;
const WEEK_MS = 7 * 86_400_000;
const RECENT_TABLES = 4;

const card =
  "rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6";

const daysUntil = (iso: string | null | undefined) => {
  const end = toUtcDate(iso);
  return end ? Math.ceil((end.getTime() - Date.now()) / 86_400_000) : null;
};

const isThisWeek = (iso: string | undefined) =>
  !!iso && Date.now() - new Date(iso).getTime() <= WEEK_MS;

// The plan limits that belong to a teacher: tracking tables and following
// students (the student-side "Mentors" limit isn't theirs).
const teacherQuotas = (quotas: Quota[]) =>
  quotas.filter(
    (q) =>
      AUDIENCE_GROUPS.Teacher.includes(q.group) &&
      q.feature !== "Mentors" &&
      q.type !== "Access" &&
      q.access !== "Off",
  );

const usedRatio = (q: Quota) =>
  q.access === "Unlimited" || q.remaining === null || !q.limit ? 0 : Math.min(1, q.used / q.limit);

// ---- Hero ---------------------------------------------------------------------

function StatTile({
  icon: Icon,
  label,
  value,
  tone,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: number | string | null;
  tone: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white/80 p-4 backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/80"
    >
      <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-2xl", tone)}>
        <Icon size={20} />
      </span>
      <div className="min-w-0">
        <div className="text-2xl font-extrabold tabular-nums text-zinc-900 dark:text-zinc-100">
          {value ?? <Skeleton className="my-0.5 h-7 w-10" />}
        </div>
        <p className="truncate text-xs font-semibold text-zinc-500 dark:text-zinc-400">{label}</p>
      </div>
    </Link>
  );
}

function Hero({
  name,
  tables,
  reports,
  reportsFailed,
  assistantsCount,
}: {
  name: string;
  tables: TrackingTableSummary[] | undefined;
  reports: ReportBatch[] | undefined;
  reportsFailed: boolean;
  assistantsCount: number | null | "error";
}) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "صباح الخير" : "مساء الخير";
  const own = tables?.filter((t) => isOwnTable(t) && !t.isDeleted);
  const students = own?.reduce((sum, t) => sum + t.rows, 0);
  const sentThisWeek = reports
    ?.filter((r) => isThisWeek(r.createdAt))
    .reduce((sum, r) => sum + (r.counts.sent ?? 0), 0);

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 sm:text-4xl">
          {greeting}، <span className="text-blue-700 dark:text-blue-400">أ. {name}</span>
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 sm:text-base">
          إليك ملخص مجموعاتك وطلابك اليوم.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          icon={Table2}
          label="جداول المتابعة"
          value={own ? own.length : null}
          tone="bg-blue-600/10 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300"
          href="/tracking-tables"
        />
        <StatTile
          icon={Users}
          label="الطلاب في كل الجداول"
          value={students ?? null}
          tone="bg-emerald-600/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"
          href="/tracking-tables"
        />
        <StatTile
          icon={Send}
          label="رسائل أُرسلت هذا الأسبوع"
          value={sentThisWeek ?? (reportsFailed ? "—" : null)}
          tone="bg-violet-600/10 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300"
          href="/tracking-tables?tab=reports"
        />
        <StatTile
          icon={UsersRound}
          label="المساعدون"
          value={assistantsCount === "error" ? "—" : assistantsCount}
          tone="bg-amber-500/10 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300"
          href="/settings/assistants"
        />
      </div>
    </section>
  );
}

// ---- Needs attention ----------------------------------------------------------

interface AttentionItem {
  id: string;
  icon: LucideIcon;
  tone: string;
  title: string;
  detail?: string;
  href: string;
  cta: string;
}

const ALERT_META: Record<TeacherAlertKind, { icon: LucideIcon; tone: string; cta: string }> = {
  grades_drop: {
    icon: TrendingDown,
    tone: "bg-rose-600/10 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300",
    cta: "افتح الجدول",
  },
  missed_exam: {
    icon: UserX,
    tone: "bg-amber-500/10 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300",
    cta: "افتح الجدول",
  },
  report_pending: {
    icon: Send,
    tone: "bg-violet-600/10 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300",
    cta: "راجع التقرير",
  },
  assistant_request: {
    icon: KeyRound,
    tone: "bg-blue-600/10 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300",
    cta: "المساعدون",
  },
};

const alertHref = (alert: TeacherAlert) =>
  alert.kind === "assistant_request"
    ? "/settings/assistants"
    : alert.kind === "report_pending"
      ? "/tracking-tables?tab=reports"
      : alert.groupId
        ? `/tracking-tables/${alert.groupId}`
        : "/tracking-tables";

// What the teacher should look at: the plan (ending, limits nearly used),
// reports that failed or were never sent, and the student alerts.
function attentionItems(
  me: MySubscription | undefined,
  reports: ReportBatch[] | undefined,
  alerts: TeacherAlert[] | undefined,
): AttentionItem[] {
  const items: AttentionItem[] = [];

  if (me?.current.kind === "Paid") {
    const days = daysUntil(me.current.endDate);
    if (me.current.inGrace) {
      items.push({
        id: "plan-grace",
        icon: AlertTriangle,
        tone: "bg-rose-600/10 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300",
        title: "انتهت باقتك",
        detail: `مزاياها متاحة حتى ${formatDay(me.current.graceEndsAt)}، جدّدها حتى لا تتوقف.`,
        href: "/subscription",
        cta: "جدّد الآن",
      });
    } else if (days !== null && days <= ENDING_DAYS) {
      items.push({
        id: "plan-ending",
        icon: CalendarClock,
        tone: "bg-amber-500/10 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300",
        title: days <= 0 ? "باقتك تنتهي اليوم" : `باقتك تنتهي خلال ${days} ${days <= 10 ? "أيام" : "يومًا"}`,
        detail: `تنتهي في ${formatDay(me.current.endDate)}، ويمكنك تجديدها بعد انتهائها`,
        href: "/subscription",
        cta: "الباقات",
      });
    }
  }

  for (const q of teacherQuotas(me?.quotas ?? [])) {
    if (q.access !== "Limited" || !q.limit || usedRatio(q) < NEAR_LIMIT) continue;
    const full = (q.remaining ?? 0) <= 0;
    items.push({
      id: `quota-${q.feature}`,
      icon: Gauge,
      tone: full
        ? "bg-rose-600/10 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300"
        : "bg-amber-500/10 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300",
      title: full
        ? `وصلت للحد في ${featureLabel(q.feature, q.displayName)}`
        : `اقتربت من الحد في ${featureLabel(q.feature, q.displayName)}`,
      detail: `استخدمت ${formatMoney(q.used)} من ${formatMoney(q.limit)}`,
      href: "/settings/billing/limits",
      cta: "حدود باقتي",
    });
  }

  for (const r of reports ?? []) {
    if (!isThisWeek(r.createdAt)) continue;
    if ((r.counts.failed ?? 0) > 0) {
      items.push({
        id: `report-failed-${r.batchId}`,
        icon: AlertTriangle,
        tone: "bg-rose-600/10 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300",
        title: `لم تصل ${r.counts.failed} رسالة من تقرير ${r.groupName}`,
        href: "/tracking-tables?tab=reports",
        cta: "التفاصيل",
      });
    } else if ((r.counts.draft ?? 0) > 0 && !(r.counts.sent ?? 0)) {
      items.push({
        id: `report-draft-${r.batchId}`,
        ...ALERT_META.report_pending,
        title: `تقرير ${r.groupName} جاهز ولم يُرسل بعد`,
        href: "/tracking-tables?tab=reports",
      });
    }
  }

  for (const alert of alerts ?? []) {
    items.push({
      id: alert.id,
      ...ALERT_META[alert.kind],
      title: alert.title,
      detail: [alert.groupName, alert.detail].filter(Boolean).join(" · ") || undefined,
      href: alertHref(alert),
    });
  }

  return items;
}

function AttentionList({ items, isLoading }: { items: AttentionItem[]; isLoading: boolean }) {
  return (
    <section className={card}>
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">يحتاج انتباهك</h2>
        {items.length > 0 && (
          <span className="rounded-full bg-rose-600/10 px-2 py-0.5 text-xs font-bold tabular-nums text-rose-700 dark:bg-rose-400/10 dark:text-rose-300">
            {items.length}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl bg-emerald-600/5 px-4 py-8 text-center dark:bg-emerald-400/5">
          <Sparkles className="text-emerald-600 dark:text-emerald-400" size={24} />
          <p className="mt-2 font-bold text-zinc-800 dark:text-zinc-200">كل شيء على ما يرام</p>
          <p className="mt-1 text-sm text-zinc-500">لا يوجد ما يحتاج انتباهك الآن.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="group flex items-center gap-3 rounded-2xl p-3 transition hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                >
                  <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", item.tone)}>
                    <Icon size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{item.title}</p>
                    {item.detail && <p className="mt-0.5 truncate text-xs text-zinc-500">{item.detail}</p>}
                  </div>
                  <span className="hidden shrink-0 items-center gap-1 text-xs font-semibold text-blue-700 group-hover:underline dark:text-blue-400 sm:flex">
                    {item.cta} <ArrowLeft size={14} />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

// ---- Recent tables ------------------------------------------------------------

function RecentTables({ tables, isLoading }: { tables: TrackingTableSummary[] | undefined; isLoading: boolean }) {
  const own = (tables ?? [])
    .filter((t) => isOwnTable(t) && !t.isDeleted)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">آخر جداولك</h2>
        {own.length > RECENT_TABLES && (
          <Link href="/tracking-tables" className="flex items-center gap-1 text-sm font-semibold text-blue-700 hover:underline dark:text-blue-400">
            كل الجداول ({own.length}) <ArrowLeft size={14} />
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-40 rounded-3xl" />
          ))}
        </div>
      ) : own.length === 0 ? (
        <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-zinc-300 bg-white px-6 py-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <span className="flex size-14 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-600/25 dark:from-blue-700 dark:to-indigo-800">
            <Table2 size={26} />
          </span>
          <p className="mt-4 font-bold text-zinc-900 dark:text-zinc-100">ابدأ أول جدول متابعة</p>
          <p className="mt-1 max-w-sm text-sm text-zinc-500">أنشئ جدولًا لكل مجموعة، أو استورد كشف الطلاب من Excel.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link
              href="/tracking-tables?dialog=import"
              className="flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <FileSpreadsheet size={16} /> استيراد من Excel
            </Link>
            <Link
              href="/tracking-tables?dialog=create"
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
            >
              <Plus size={16} /> جدول جديد
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {own.slice(0, RECENT_TABLES).map((table) => (
            <TableCard key={table.groupId} table={table} />
          ))}
        </div>
      )}
    </section>
  );
}

// ---- Bundle usage -------------------------------------------------------------

function QuotaBar({ quota: q }: { quota: Quota }) {
  const unlimited = q.access === "Unlimited" || q.remaining === null;
  const ratio = usedRatio(q);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="min-w-0 truncate font-semibold text-zinc-700 dark:text-zinc-300">
          {featureLabel(q.feature, q.displayName)}
        </span>
        {unlimited ? (
          <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <InfinityIcon size={14} /> غير محدود
          </span>
        ) : (
          <span className="shrink-0 text-xs text-zinc-500">
            متبقي <b className="tabular-nums text-zinc-900 dark:text-zinc-100">{formatMoney(q.remaining ?? 0)}</b> من{" "}
            <span className="tabular-nums">{formatMoney(q.limit ?? 0)}</span>
          </span>
        )}
      </div>
      {!unlimited && (
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-700",
              ratio >= 1
                ? "bg-rose-500 dark:bg-rose-700"
                : ratio >= NEAR_LIMIT
                  ? "bg-amber-500 dark:bg-amber-700"
                  : "bg-blue-600 dark:bg-blue-700",
            )}
            style={{ width: `${ratio * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}

// The plan and what's left of each teacher limit.
function BundleCard({ me, isLoading }: { me: MySubscription | undefined; isLoading: boolean }) {
  // Taken once: how far through the plan period we are doesn't need to
  // tick while the page is open.
  const [now] = useState(() => Date.now());

  if (isLoading || !me) {
    return (
      <section className={card}>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="mt-4 h-3 w-full" />
        <div className="mt-6 flex flex-col gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </section>
    );
  }

  const { current } = me;
  const paid = current.kind === "Paid";
  const left = paid ? daysUntil(current.endDate) : null;
  const start = toUtcDate(current.startDate)?.getTime();
  const end = toUtcDate(current.endDate)?.getTime();
  const periodRatio =
    paid && start && end && end > start ? Math.min(1, Math.max(0, (now - start) / (end - start))) : null;
  // Most used first, so what's running out is on top.
  const quotas = teacherQuotas(me.quotas).sort((a, b) => usedRatio(b) - usedRatio(a));
  const renewHref = `/subscription/checkout?bundleId=${current.bundleId}${current.groups?.length ? `&groups=${current.groups.join(",")}` : ""}`;

  return (
    <section className={card}>
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md shadow-blue-600/25 dark:from-blue-700 dark:to-indigo-800">
          <Sparkles size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-zinc-500">باقتك الحالية</p>
          <h2 className="truncate text-lg font-bold text-zinc-900 dark:text-zinc-100">
            <BundleName bundleId={current.bundleId} kind={current.kind} title={current.bundleTitle} />
          </h2>
        </div>
      </div>

      {paid ? (
        <div className="mt-4">
          <div className="flex items-baseline justify-between text-xs text-zinc-500">
            <span>
              {current.inGrace
                ? `انتهت · متاحة حتى ${formatDay(current.graceEndsAt)}`
                : left !== null
                  ? left <= 0
                    ? "تنتهي اليوم"
                    : `يتبقى ${left} ${left <= 10 ? "أيام" : "يومًا"}`
                  : null}
            </span>
            <span>تنتهي {formatDay(current.endDate)}</span>
          </div>
          {periodRatio !== null && (
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className={cn(
                  "h-full rounded-full",
                  current.inGrace || (left !== null && left <= ENDING_DAYS)
                    ? "bg-amber-500 dark:bg-amber-700"
                    : "bg-gradient-to-l from-blue-500 to-indigo-600 dark:from-blue-700 dark:to-indigo-800",
                )}
                style={{ width: `${periodRatio * 100}%` }}
              />
            </div>
          )}
        </div>
      ) : (
        <p className="mt-3 text-sm text-zinc-500">الباقة المجانية متاحة دائمًا وتتجدد حدودها كل شهر.</p>
      )}

      {quotas.length > 0 && (
        <div className="mt-5 flex flex-col gap-3.5 border-t border-zinc-100 pt-5 dark:border-zinc-800">
          {quotas.map((q) => (
            <QuotaBar key={q.feature} quota={q} />
          ))}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {paid && me.current.inGrace && (
          <Link
            href={renewHref}
            className="flex-1 rounded-xl bg-blue-600 px-4 py-2 text-center text-sm font-bold text-white transition hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
          >
            تجديد
          </Link>
        )}
        <Link
          href="/subscription"
          className={cn(
            "flex-1 rounded-xl px-4 py-2 text-center text-sm font-bold transition",
            paid
              ? "border border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              : "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800",
          )}
        >
          {paid ? "تغيير الباقة" : "ترقية الباقة"}
        </Link>
      </div>
      <Link
        href="/settings/billing/limits"
        className="mt-3 flex items-center justify-center gap-1 text-xs font-semibold text-zinc-500 hover:text-blue-700 dark:hover:text-blue-400"
      >
        كل حدود باقتي <ArrowLeft size={12} />
      </Link>
    </section>
  );
}

// ---- Quick actions ------------------------------------------------------------

const QUICK_ACTIONS: { label: string; href: string; icon: LucideIcon; tone: string }[] = [
  {
    label: "جدول جديد",
    href: "/tracking-tables?dialog=create",
    icon: Plus,
    tone: "bg-blue-600/10 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300",
  },
  {
    label: "استيراد من Excel",
    href: "/tracking-tables?dialog=import",
    icon: FileSpreadsheet,
    tone: "bg-emerald-600/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300",
  },
  {
    label: "التقارير المرسلة",
    href: "/tracking-tables?tab=reports",
    icon: Send,
    tone: "bg-violet-600/10 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300",
  },
  {
    label: "المساعدون",
    href: "/settings/assistants",
    icon: UsersRound,
    tone: "bg-amber-500/10 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300",
  },
];

function QuickActions() {
  return (
    <section className={card}>
      <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-zinc-100">إجراءات سريعة</h2>
      <div className="grid grid-cols-2 gap-2">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              href={action.href}
              className="flex flex-col items-center gap-2 rounded-2xl border border-zinc-100 p-3 text-center text-xs font-semibold text-zinc-700 transition hover:-translate-y-0.5 hover:border-zinc-200 hover:shadow-sm dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-700"
            >
              <span className={cn("flex size-10 items-center justify-center rounded-xl", action.tone)}>
                <Icon size={18} />
              </span>
              {action.label}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

// ---- Page ---------------------------------------------------------------------

// The home page for teacher accounts: their groups and students, what needs
// their attention, and what's left of their plan.
export default function TeacherHome() {
  const { user } = useAuth();
  const { data: tables, isLoading: tablesLoading } = useTrackingTables();
  const { data: reports, isLoading: reportsLoading, isError: reportsFailed } = useReports();
  const assistants = useAssistants();
  const { data: me, isLoading: planLoading } = useMySubscription();
  const { data: alerts, isLoading: alertsLoading } = useTeacherAlerts();

  const items = attentionItems(me, reports, alerts);

  return (
    <div dir="rtl" className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6">
      <Hero
        name={shortName(user?.fullName)}
        tables={tables}
        reports={reports}
        reportsFailed={reportsFailed}
        assistantsCount={assistants.isError ? "error" : assistants.data ? assistants.data.length : null}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <AttentionList items={items} isLoading={planLoading || reportsLoading || alertsLoading} />
          <RecentTables tables={tables} isLoading={tablesLoading} />
        </div>
        <div className="flex flex-col gap-6">
          <BundleCard me={me} isLoading={planLoading} />
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
