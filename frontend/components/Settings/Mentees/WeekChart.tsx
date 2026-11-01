"use client";

import { formatUsage } from "@/app/constants/focus.constants";
import { formatDays, formatPlans, formatSessions } from "@/app/lib/mentorship";
import { DayPerformance, WeekPerformance } from "@/app/types/mentorship.types";

// Days are UTC calendar days ("2026-10-27"), so they're read and named in UTC
// — otherwise a late-evening date would slip a day.
const dayOf = (date: string) => new Date(`${date}T00:00:00Z`);
const weekdayFormat = new Intl.DateTimeFormat("ar-EG-u-nu-latn", { weekday: "short", timeZone: "UTC" });
const fullDayFormat = new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

const PLOT_HEIGHT = 140;

// One series (study minutes per day), so the title names it and there is
// no legend. Values live in the per-column tooltip and the table view; only
// the best day is labelled on the chart itself.
export const WeekChart = ({ week }: { week: WeekPerformance }) => {
  const max = Math.max(1, ...week.days.map((day) => day.productiveMinutes));
  const best = week.days.reduce<DayPerformance | null>(
    (top, day) => (day.productiveMinutes > (top?.productiveMinutes ?? 0) ? day : top),
    null,
  )?.date;

  const totals = [
    { label: "دقائق المذاكرة", value: formatUsage(week.totalProductiveMinutes) },
    { label: "خطط منجزة", value: String(week.totalCompletedPlansCount) },
    { label: "جلسات مكتملة", value: String(week.totalCompletedSessionsCount) },
    { label: "أيام نشاط", value: `${week.activeDaysCount} / ${week.days.length}` },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {totals.map(({ label, value }) => (
          <div key={label} className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{value}</p>
          </div>
        ))}
      </div>

      <figure className="flex flex-col gap-2">
        <figcaption className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          دقائق المذاكرة يومًا بيوم
        </figcaption>

        <div
          aria-hidden
          className="flex items-end gap-0.5 border-b border-zinc-200 dark:border-zinc-700"
          style={{ height: PLOT_HEIGHT + 24 }}
        >
          {week.days.map((day) => {
            const height = Math.round((day.productiveMinutes / max) * PLOT_HEIGHT);
            return (
              // The whole slot is the hover/focus target, not just the thin column.
              <div
                key={day.date}
                tabIndex={0}
                className="group relative flex h-full flex-1 flex-col items-center justify-end outline-none"
              >
                {day.date === best && (
                  <span className="mb-1 text-[11px] font-semibold tabular-nums text-zinc-600 dark:text-zinc-300">
                    {formatUsage(day.productiveMinutes)}
                  </span>
                )}
                {height > 0 && (
                  <span
                    className="w-full max-w-6 rounded-t bg-blue-600 transition-colors group-hover:bg-blue-700 group-focus-visible:bg-blue-700 dark:bg-blue-500 dark:group-hover:bg-blue-400 dark:group-focus-visible:bg-blue-400"
                    style={{ height }}
                  />
                )}

                <div className="pointer-events-none absolute bottom-full z-10 mb-1 hidden w-max max-w-[12rem] rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs shadow-lg group-hover:block group-focus-visible:block dark:border-zinc-700 dark:bg-zinc-900">
                  <p className="font-bold text-zinc-900 dark:text-zinc-100">{fullDayFormat.format(dayOf(day.date))}</p>
                  <p className="mt-1 text-zinc-600 dark:text-zinc-300">{formatUsage(day.productiveMinutes)} مذاكرة</p>
                  <p className="text-zinc-500 dark:text-zinc-400">
                    {formatPlans(day.completedPlansCount)} · {formatSessions(day.completedSessionsCount)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div aria-hidden className="flex gap-0.5">
          {week.days.map((day) => (
            <span key={day.date} className="flex-1 text-center text-[11px] text-zinc-500 dark:text-zinc-400">
              {weekdayFormat.format(dayOf(day.date))}
            </span>
          ))}
        </div>

        {/* The same numbers for screen readers. */}
        <table className="sr-only">
          <caption>دقائق المذاكرة والخطط والجلسات في آخر {formatDays(week.days.length)}</caption>
          <thead>
            <tr>
              <th>اليوم</th>
              <th>دقائق المذاكرة</th>
              <th>الخطط</th>
              <th>الجلسات</th>
            </tr>
          </thead>
          <tbody>
            {week.days.map((day) => (
              <tr key={day.date}>
                <td>{fullDayFormat.format(dayOf(day.date))}</td>
                <td>{day.productiveMinutes}</td>
                <td>{day.completedPlansCount}</td>
                <td>{day.completedSessionsCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </figure>
    </div>
  );
};
