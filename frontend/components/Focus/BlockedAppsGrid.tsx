"use client";

import { Ban, Check, Smartphone } from "lucide-react";
import { cn } from "@/app/lib/utils";
import {
  APP_BY_ID,
  formatTimes,
  formatUsage,
} from "@/app/constants/focus.constants";
import { useToggleAppBlock } from "@/app/hooks/useDistractionControls";
import { AppUsage } from "@/app/types/focus.types";

interface BlockedAppsGridProps {
  apps: AppUsage[];
}

export const BlockedAppsGrid = ({ apps }: BlockedAppsGridProps) => {
  const { mutate: toggleApp } = useToggleAppBlock();

  const blockedCount = apps.filter((a) => a.blocked).length;
  // Sorted by time spent so the worst offender is the first thing seen —
  // the whole point is to make the student's own usage the argument.
  const sorted = [...apps].sort((a, b) => b.minutesToday - a.minutesToday);
  const totalMinutes = apps.reduce((sum, a) => sum + a.minutesToday, 0);

  return (
    <section
      className="rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6"
      dir="rtl"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Smartphone className="text-blue-600 dark:text-blue-400" size={22} />
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              حجب التطبيقات
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              استخدامك اليوم {formatUsage(totalMinutes)} · {blockedCount} من {apps.length}{" "}
              محجوبة
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {sorted.map((app) => (
          <AppCard key={app.appId} usage={app} onToggle={() => toggleApp(app.appId)} />
        ))}
      </div>

      <p className="mt-4 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
        أرقام الاستخدام تصل من تطبيق متقن على هاتفك — المتصفح لا يستطيع قياسها بنفسه.
      </p>
    </section>
  );
};

const AppCard = ({ usage, onToggle }: { usage: AppUsage; onToggle: () => void }) => {
  const app = APP_BY_ID[usage.appId];
  const { Icon } = app;

  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl border p-4 transition",
        usage.blocked
          ? "border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/20"
          : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/40"
      )}
    >
      <span
        className={cn(
          "flex size-12 items-center justify-center rounded-2xl bg-white shadow-sm transition dark:bg-zinc-900",
          usage.blocked && "grayscale"
        )}
      >
        {/* Brand colour carries recognition; falls back to a light variant in
            dark mode for the two brands whose colour is black. */}
        <Icon size={26} style={{ color: app.color }} className="dark:hidden" />
        <Icon
          size={26}
          style={{ color: app.darkColor ?? app.color }}
          className="hidden dark:block"
        />
      </span>

      <p className="mt-2.5 text-center text-sm font-bold text-zinc-900 dark:text-zinc-100">
        {app.name}
      </p>

      <p className="mt-1 text-center text-[11px] text-zinc-500 dark:text-zinc-400">
        {formatUsage(usage.minutesToday)} · فُتح {formatTimes(usage.openCount)}
      </p>

      <button
        type="button"
        onClick={onToggle}
        aria-pressed={usage.blocked}
        className={cn(
          "mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold text-white transition",
          usage.blocked
            ? "bg-red-600 hover:bg-red-700"
            : "bg-emerald-600 hover:bg-emerald-700"
        )}
      >
        {usage.blocked ? <Ban size={15} /> : <Check size={15} />}
        {usage.blocked ? "محجوب" : "مسموح"}
      </button>
    </div>
  );
};
