"use client";

import Link from "next/link";
import { Globe, Settings2, ShieldCheck, Smartphone, Sunrise } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { useBlockerSettings } from "@/app/hooks/useDistractionBlocker";
import Skeleton from "@/components/ui/Skeleton";

// A read-only look at the settings page, so the student sees what a
// schedule will actually block without leaving this screen.
export const BlockerSummaryCard = () => {
  const { data: settings, isLoading, isError } = useBlockerSettings();

  if (isLoading) return <Skeleton className="h-40 w-full rounded-3xl" />;
  if (isError || !settings) return null;

  const websites = settings.blockedWebsites ?? [];
  const tiles = [
    {
      icon: ShieldCheck,
      label: "أثناء جلسات المذاكرة",
      value: settings.blockDuringStudySessions ? "يُحجب" : "لا يُحجب",
      detail: settings.blockDuringStudySessions
        ? settings.unblockDuringBreaks
          ? "ويُرفع في الاستراحات"
          : "حتى في الاستراحات"
        : "خارج الجداول",
      on: settings.blockDuringStudySessions,
    },
    {
      icon: Sunrise,
      label: "حجب الخطة التلقائي",
      value: settings.autoStartPlanBlock ? "مفعّل" : "متوقف",
      detail: settings.autoStartPlanBlock ? "يبدأ عند منتصف الليل" : "تبدؤه بنفسك",
      on: settings.autoStartPlanBlock,
    },
    {
      icon: Globe,
      label: "المواقع المحجوبة",
      value: String(websites.length),
      detail: websites.length ? websites.slice(0, 2).join(", ") + (websites.length > 2 ? "…" : "") : "لا شيء بعد",
      on: websites.length > 0,
      ltrDetail: websites.length > 0,
    },
    {
      icon: Smartphone,
      label: "التطبيقات المسموحة",
      value: String(settings.allowedApps?.length ?? 0),
      detail: "وكل ما عداها يُحجب",
      on: (settings.allowedApps?.length ?? 0) > 0,
    },
  ];

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Settings2 className="text-blue-600 dark:text-blue-400" size={22} />
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">ما يُحجب</h2>
        </div>
        <Link
          href="/settings/blocker"
          className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          تعديل الإعدادات
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map(({ icon: Icon, label, value, detail, on, ltrDetail }) => (
          <div key={label} className="min-w-0 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              <Icon size={14} className="shrink-0" />
              <span className="truncate">{label}</span>
            </div>
            <p
              className={cn(
                "mt-2 text-xl font-bold",
                on ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-500",
              )}
            >
              {value}
            </p>
            <p
              dir={ltrDetail ? "ltr" : undefined}
              className={cn(
                "mt-0.5 truncate text-[11px] text-zinc-500 dark:text-zinc-400",
                ltrDetail && "text-right",
              )}
            >
              {detail}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
