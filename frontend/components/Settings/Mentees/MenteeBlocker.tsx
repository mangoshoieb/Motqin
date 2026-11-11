"use client";

import { Check, Clock, ListChecks, Lock, LockOpen, Minus } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { useWeekDays } from "@/app/hooks/useLookups";
import { KNOWN_APPS, WEEK_DAYS_FALLBACK } from "@/app/constants/distraction-blocker.constants";
import {
  crossesMidnight,
  formatClock,
  formatTimeOfDay,
  parseUtc,
} from "@/app/lib/distraction-blocker";
import { MenteeDetail } from "@/app/types/mentorship.types";

type Blocker = NonNullable<MenteeDetail["blocker"]>;

const SettingLine = ({ label, on }: { label: string; on: boolean }) => (
  <li className="flex items-center justify-between gap-3 py-2 text-sm">
    <span className="text-zinc-700 dark:text-zinc-300">{label}</span>
    <span
      className={cn(
        "flex items-center gap-1 text-xs font-bold",
        on ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400 dark:text-zinc-500",
      )}
    >
      {on ? <Check size={14} /> : <Minus size={14} />}
      {on ? "مفعّل" : "متوقف"}
    </span>
  </li>
);

// The student's blocker as the mentor may see it: read-only.
export const MenteeBlocker = ({ blocker }: { blocker: Blocker }) => {
  const { data: weekDaysData } = useWeekDays();
  const weekDays = weekDaysData?.length ? weekDaysData : WEEK_DAYS_FALLBACK;
  const { settings, schedules, lock } = blocker;
  // The server reports locked: false while a code's 15 minutes run; the
  // detail is polled, so this stays current without a clock here.
  const unlockedUntil = parseUtc(lock.unlockedUntil);
  const unlocked = !lock.locked && unlockedUntil !== null;

  return (
    <div className="flex flex-col gap-5">
      {settings.lockedByMentor && (
        <p
          className={cn(
            "flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold",
            unlocked
              ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"
              : "bg-violet-50 text-violet-800 dark:bg-violet-950/30 dark:text-violet-200",
          )}
        >
          {unlocked ? <LockOpen size={14} /> : <Lock size={14} />}
          {unlocked
            ? `الإعدادات مفتوحة للتعديل حتى ${formatClock(unlockedUntil)}`
            : "الإعدادات مقفلة، وتغييرها يحتاج رمزًا من حامل القفل"}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <h3 className="mb-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">الإعدادات</h3>
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            <SettingLine label="الحجب أثناء جلسات المذاكرة" on={settings.blockDuringStudySessions} />
            {settings.blockDuringStudySessions && (
              <SettingLine label="رفع الحجب في الاستراحات" on={settings.unblockDuringBreaks} />
            )}
            <SettingLine label="بدء حجب الخطة تلقائيًا" on={settings.autoStartPlanBlock} />
          </ul>

          <h3 className="mb-2 mt-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            المواقع المحجوبة ({settings.blockedWebsites.length})
          </h3>
          {settings.blockedWebsites.length === 0 ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">لا شيء.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {settings.blockedWebsites.map((site) => (
                <span
                  key={site}
                  dir="ltr"
                  className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs text-red-800 dark:bg-red-950/30 dark:text-red-200"
                >
                  {site}
                </span>
              ))}
            </div>
          )}

          <h3 className="mb-2 mt-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            التطبيقات المسموحة ({settings.allowedApps.length})
          </h3>
          {settings.allowedApps.length === 0 ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">كل التطبيقات تُحجب أثناء الحجب.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {settings.allowedApps.map((appId) => (
                <span
                  key={appId}
                  dir={KNOWN_APPS[appId] ? undefined : "ltr"}
                  className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  {KNOWN_APPS[appId]?.name ?? appId}
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            جداول الحجب ({schedules.length})
          </h3>
          {schedules.length === 0 ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">لا توجد جداول.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {schedules.map((schedule) => {
                const isPlan = schedule.blockUntilPlanCompleted;
                return (
                  <li
                    key={schedule.id}
                    className={cn(
                      "flex flex-col gap-2 rounded-xl border border-zinc-200 px-3 py-2.5 dark:border-zinc-800",
                      !schedule.isEnabled && "border-dashed opacity-60",
                    )}
                  >
                    <p className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {isPlan ? <ListChecks size={15} /> : <Clock size={15} />}
                      {isPlan
                        ? "حتى إنهاء خطة اليوم"
                        : `${formatTimeOfDay(schedule.startTime)} — ${formatTimeOfDay(schedule.endTime)}`}
                      {!isPlan && crossesMidnight(schedule.startTime, schedule.endTime) && (
                        <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">(لليوم التالي)</span>
                      )}
                      {!schedule.isEnabled && (
                        <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[10px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                          متوقف
                        </span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {weekDays.map((day) => (
                        <span
                          key={day.value}
                          className={cn(
                            "rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                            schedule.days.includes(day.value)
                              ? "bg-blue-600 dark:bg-blue-700 text-white"
                              : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500",
                          )}
                        >
                          {day.nameAr}
                        </span>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
