"use client";

import { cn } from "@/app/lib/utils";
import { formatNumber } from "@/app/lib/tracking-table";
import { usePerformanceFlags } from "@/app/hooks/useLookups";
import { DistributionBin, Standing } from "@/app/types/tracking-table.types";
import { STANDING_ORDER, STANDING_STYLE } from "./format";

const Tooltip = ({ children }: { children: React.ReactNode }) => (
  <span className="pointer-events-none absolute bottom-full start-1/2 z-20 mb-2 hidden w-max max-w-[12rem] -translate-x-1/2 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 shadow-lg group-hover:block group-focus-visible:block rtl:translate-x-1/2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
    {children}
  </span>
);

/**
 * How many students sit above, inside and below the "average" band, as one
 * stacked bar plus a legend that doubles as direct labels. Picking a part
 * (bar or legend) filters the student table to it.
 */
export function StandingBar({
  counts,
  active,
  onPick,
}: {
  counts: Record<Standing, number>;
  active?: Standing | null;
  onPick?: (standing: Standing) => void;
}) {
  const { standings } = usePerformanceFlags();
  const label = (key: Standing) => standings.find((s) => s.key === key)?.nameAr ?? key;
  const total = STANDING_ORDER.reduce((sum, key) => sum + counts[key], 0);

  if (total === 0) return <p className="text-xs text-zinc-500">لا توجد درجات بعد.</p>;

  return (
    <div className="flex flex-col gap-2">
      {/* 2px surface gaps between parts; only the two outer ends are rounded. */}
      <div className="flex h-3 gap-0.5">
        {STANDING_ORDER.filter((key) => counts[key] > 0).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onPick?.(key)}
            disabled={!onPick}
            aria-label={`${label(key)}: ${formatNumber(counts[key])} طالب`}
            style={{ width: `${(counts[key] / total) * 100}%` }}
            className={cn(
              "group relative h-full outline-none first:rounded-s last:rounded-e focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-zinc-900 dark:focus-visible:ring-white",
              STANDING_STYLE[key].bar,
              active && active !== key && "opacity-35",
            )}
          >
            <Tooltip>
              {label(key)}: {formatNumber(counts[key])} طالب
            </Tooltip>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {STANDING_ORDER.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onPick?.(key)}
            disabled={!onPick}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-1 text-xs text-zinc-600 transition dark:text-zinc-300",
              onPick && "hover:bg-zinc-100 dark:hover:bg-zinc-800",
              active === key && "bg-zinc-100 font-bold text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100",
            )}
          >
            <span className={cn("size-2.5 rounded-sm", STANDING_STYLE[key].bar)} />
            {label(key)} <span className="font-bold tabular-nums">{formatNumber(counts[key])}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const PLOT_HEIGHT = 72;

/**
 * Students per score range (0-49 … 85-100), one column each. The failing
 * range is red and says so in words under the axis. Counts are in each
 * column's tooltip and the table view; only the fullest range is labelled.
 */
export function DistributionChart({ bins }: { bins: DistributionBin[] }) {
  const max = Math.max(1, ...bins.map((b) => b.count));
  const fullest = bins.reduce<DistributionBin | null>((top, b) => (b.count > (top?.count ?? 0) ? b : top), null);

  return (
    <figure className="flex flex-col gap-1">
      <figcaption className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">توزيع الدرجات</figcaption>
      <div aria-hidden className="flex items-end gap-0.5 border-b border-zinc-200 dark:border-zinc-700" style={{ height: PLOT_HEIGHT + 18 }}>
        {bins.map((bin) => {
          const height = Math.round((bin.count / max) * PLOT_HEIGHT);
          const failing = bin.range.startsWith("0");
          return (
            <div key={bin.range} tabIndex={0} className="group relative flex h-full flex-1 flex-col items-center justify-end outline-none">
              {bin === fullest && (
                <span className="mb-0.5 text-[11px] font-semibold tabular-nums text-zinc-600 dark:text-zinc-300">
                  {formatNumber(bin.count)}
                </span>
              )}
              {height > 0 && (
                <span
                  className={cn(
                    "w-full max-w-6 rounded-t",
                    failing ? "bg-red-600 dark:bg-red-500" : "bg-blue-600 dark:bg-blue-500",
                  )}
                  style={{ height }}
                />
              )}
              <Tooltip>
                <span dir="ltr">{bin.range}%</span>: {formatNumber(bin.count)} طالب
              </Tooltip>
            </div>
          );
        })}
      </div>
      <div aria-hidden className="flex gap-0.5">
        {bins.map((bin) => (
          <span key={bin.range} className="flex flex-1 flex-col items-center text-[10px] leading-tight text-zinc-500">
            <span dir="ltr">{bin.range}</span>
            {bin.range.startsWith("0") && <span className="font-semibold text-red-700 dark:text-red-400">راسب</span>}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>عدد الطلاب في كل نطاق درجات</caption>
        <tbody>
          {bins.map((bin) => (
            <tr key={bin.range}>
              <th>{bin.range}%</th>
              <td>{bin.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
