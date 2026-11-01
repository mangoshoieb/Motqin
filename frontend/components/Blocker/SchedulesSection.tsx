"use client";

import { useState } from "react";
import { CalendarClock, Clock, ListChecks, Lock, Moon, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/app/lib/utils";
import {
  useBlockerLock,
  useBlockSchedules,
  useDeleteSchedule,
  useUpdateSchedule,
} from "@/app/hooks/useDistractionBlocker";
import { useWeekDays } from "@/app/hooks/useLookups";
import { WEEK_DAYS_FALLBACK } from "@/app/constants/distraction-blocker.constants";
import { formatUsage } from "@/app/constants/focus.constants";
import {
  crossesMidnight,
  formatTimeOfDay,
  scheduleToInput,
  toastBlockerError,
} from "@/app/lib/distraction-blocker";
import { BlockSchedule } from "@/app/types/distraction-blocker.types";
import { Switch } from "@/components/ui/switch";
import Skeleton from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ExecutionBoard/ConfirmDialog";
import { ScheduleDialog, windowMinutes } from "./ScheduleDialog";

const LOCKED_TITLE = "مقفل من مشرفك — اطلب رمزًا لتعديله";

export const SchedulesSection = () => {
  const { data: schedules, isLoading, isError, refetch } = useBlockSchedules();
  const { isLocked } = useBlockerLock();
  const updateSchedule = useUpdateSchedule();
  const deleteSchedule = useDeleteSchedule();
  const { data: weekDaysData } = useWeekDays();
  const weekDays = weekDaysData?.length ? weekDaysData : WEEK_DAYS_FALLBACK;

  const [editing, setEditing] = useState<BlockSchedule | "new" | null>(null);
  const [deleting, setDeleting] = useState<BlockSchedule | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const toggleEnabled = async (schedule: BlockSchedule) => {
    setBusyId(schedule.id);
    try {
      const updated = await updateSchedule.mutateAsync({
        id: schedule.id,
        input: scheduleToInput(schedule, { isEnabled: !schedule.isEnabled }),
      });
      toast.success(updated.isEnabled ? "تم تشغيل الجدول" : "تم إيقاف الجدول");
    } catch (error) {
      toastBlockerError(schedule.isEnabled ? "تعذر إيقاف الجدول" : "تعذر تشغيل الجدول", error);
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    const schedule = deleting;
    setDeleting(null);
    if (!schedule) return;

    setBusyId(schedule.id);
    try {
      await deleteSchedule.mutateAsync(schedule.id);
      toast.success("تم حذف الجدول");
    } catch (error) {
      toastBlockerError("تعذر حذف الجدول", error);
    } finally {
      setBusyId(null);
    }
  };

  const addButton = (
    <button
      type="button"
      onClick={() => setEditing("new")}
      className="flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
    >
      <Plus size={16} />
      إضافة جدول
    </button>
  );

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <CalendarClock className="mt-0.5 text-blue-600 dark:text-blue-400" size={22} />
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">جداول الحجب</h2>
            <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              يحجب هاتفك التطبيقات والمواقع في هذه الأوقات من كل أسبوع، حسب ساعة الهاتف.
            </p>
          </div>
        </div>
        {schedules && schedules.length > 0 && addButton}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      ) : isError || !schedules ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">تعذر تحميل جداول الحجب</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="flex items-center gap-1.5 rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <RotateCcw size={14} />
            إعادة المحاولة
          </button>
        </div>
      ) : schedules.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-zinc-300 px-6 py-10 text-center dark:border-zinc-700">
          <p className="max-w-md text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            لا توجد جداول حجب بعد. أضف فترة ثابتة يُحجب فيها هاتفك كل أسبوع، أو أيامًا يبقى فيها محجوبًا حتى
            تنهي خطتك.
          </p>
          {addButton}
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {schedules.map((schedule) => {
            const isPlan = schedule.blockUntilPlanCompleted;
            const overnight = !isPlan && crossesMidnight(schedule.startTime, schedule.endTime);
            const busy = busyId === schedule.id;

            return (
              <li
                key={schedule.id}
                className={cn(
                  "flex flex-col gap-3 rounded-2xl border p-4 transition",
                  schedule.isEnabled
                    ? "border-zinc-200 dark:border-zinc-800"
                    : "border-dashed border-zinc-200 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-950/30",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className={cn("flex min-w-0 items-start gap-3", !schedule.isEnabled && "opacity-60")}>
                    <span
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-xl",
                        isPlan
                          ? "bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300"
                          : "bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300",
                      )}
                    >
                      {isPlan ? <ListChecks size={20} /> : <Clock size={20} />}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-zinc-900 dark:text-zinc-100">
                          {isPlan
                            ? "حتى إنهاء خطة اليوم"
                            : `${formatTimeOfDay(schedule.startTime)} — ${formatTimeOfDay(schedule.endTime)}`}
                        </p>
                        {!schedule.isEnabled && (
                          <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-[11px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                            متوقف
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {overnight && <Moon size={12} className="shrink-0" />}
                        {isPlan
                          ? "يحجب طوال اليوم، ويُرفع بعد إنهاء مهام اليوم ومراجعاته."
                          : overnight
                            ? "يمتد عبر منتصف الليل حتى صباح اليوم التالي."
                            : `${formatUsage(windowMinutes(schedule.startTime!, schedule.endTime!))} حجب.`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {isLocked && (
                      <span title={LOCKED_TITLE} className="me-1 text-amber-600 dark:text-amber-400">
                        <Lock size={15} />
                      </span>
                    )}
                    <Switch
                      checked={schedule.isEnabled}
                      onCheckedChange={() => void toggleEnabled(schedule)}
                      disabled={isLocked || busy}
                      aria-label={schedule.isEnabled ? "إيقاف الجدول" : "تشغيل الجدول"}
                      title={isLocked ? LOCKED_TITLE : undefined}
                      className="me-2 bg-zinc-300 data-[checked]:bg-blue-600 dark:bg-zinc-700 dark:data-[checked]:bg-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setEditing(schedule)}
                      disabled={isLocked || busy}
                      aria-label="تعديل الجدول"
                      title={isLocked ? LOCKED_TITLE : "تعديل"}
                      className="flex size-8 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleting(schedule)}
                      disabled={isLocked || busy}
                      aria-label="حذف الجدول"
                      title={isLocked ? LOCKED_TITLE : "حذف"}
                      className="flex size-8 items-center justify-center rounded-full text-zinc-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Walked in lookup order so the week reads from Saturday. */}
                <div className={cn("flex flex-wrap gap-1.5", !schedule.isEnabled && "opacity-60")}>
                  {weekDays.map((day) => (
                    <span
                      key={day.value}
                      className={cn(
                        "rounded-lg px-2 py-1 text-[11px] font-semibold",
                        schedule.days.includes(day.value)
                          ? isPlan
                            ? "bg-violet-600 text-white"
                            : "bg-blue-600 text-white"
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

      {editing && (
        <ScheduleDialog
          schedule={editing === "new" ? null : editing}
          schedules={schedules ?? []}
          onClose={() => setEditing(null)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="حذف جدول الحجب؟"
          description="لن يحجب هاتفك في هذه الأوقات بعد الآن. يمكنك إيقافه مؤقتًا بدل حذفه."
          confirmLabel="حذف"
          onConfirm={() => void confirmDelete()}
          onClose={() => setDeleting(null)}
        />
      )}
    </section>
  );
};
