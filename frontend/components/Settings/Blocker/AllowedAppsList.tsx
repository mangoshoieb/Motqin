"use client";

import { Smartphone, X } from "lucide-react";
import { KNOWN_APPS } from "@/app/constants/distraction-blocker.constants";

interface AllowedAppsListProps {
  apps: string[];
  onRemove: (appId: string) => void;
  disabled?: boolean;
}

// The web can't see what's installed on the phone, so apps are only added
// from the phone. Here the student can see the list and take apps off it.
export const AllowedAppsList = ({ apps, onRemove, disabled }: AllowedAppsListProps) => {
  if (apps.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        لا توجد تطبيقات مسموحة، فكل التطبيقات تُحجب أثناء الحجب.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {apps.map((appId) => {
        const known = KNOWN_APPS[appId];
        return (
          <li
            key={appId}
            className="flex items-center gap-3 rounded-xl border border-zinc-200 px-3 py-2.5 dark:border-zinc-800"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
              {known ? (
                <>
                  <known.Icon size={20} style={{ color: known.color }} className="dark:hidden" />
                  <known.Icon
                    size={20}
                    style={{ color: known.darkColor ?? known.color }}
                    className="hidden dark:block"
                  />
                </>
              ) : (
                <Smartphone size={18} className="text-zinc-500 dark:text-zinc-400" />
              )}
            </span>

            <div className="min-w-0 flex-1">
              {known && (
                <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {known.name}
                </p>
              )}
              <p
                dir="ltr"
                title={appId}
                className={
                  known
                    ? "truncate text-right text-[11px] text-zinc-500 dark:text-zinc-400"
                    : "truncate text-right text-sm font-medium text-zinc-800 dark:text-zinc-200"
                }
              >
                {appId}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onRemove(appId)}
              disabled={disabled}
              aria-label={`إزالة ${known?.name ?? appId} من المسموحة`}
              title="إزالة من المسموحة"
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-zinc-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-red-950/30 dark:hover:text-red-400"
            >
              <X size={16} />
            </button>
          </li>
        );
      })}
    </ul>
  );
};
