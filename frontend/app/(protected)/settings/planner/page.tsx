"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { usePlannerPreferences } from "@/app/hooks/usePlannerPreferences";
import {
  PlannerPreferences,
  UnfinishedTaskPolicy,
} from "@/app/types/planner-preferences.types";

import { SettingsField } from "@/components/Settings/SettingsField";
import { BusyTimesEditor } from "@/components/Settings/Planner/BusyTimesEditor";

const timeInputClass =
  "rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-blue-500";

const numberInputClass =
  "w-24 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-blue-500";

const UNFINISHED_POLICY_OPTIONS: {
  value: UnfinishedTaskPolicy;
  label: string;
}[] = [
  {
    value: 1,
    label: "إعادة جدولة المهمة تلقائيًا",
  },
  {
    value: 2,
    label: "السماح لي بإعادة جدولة المهمة",
  },
  {
    value: 3,
    label: "ترحيل المهمة إلى اليوم التالي حتى مع تجاوز الحد",
  },
  {
    value: 4,
    label: "السماح بترك المهمة دون إعادة جدولة",
  },
];

const PlannerSettingsPage = () => {
  const {
    preferences,
    hasPreferences,
    isLoading,
    isSaving,
    error,
    createPreferences,
    updatePreferences,
  } = usePlannerPreferences();

  const [draft, setDraft] = useState<PlannerPreferences | null>(null);

  /*
   * Sync the editable draft whenever preferences are loaded.
   *
   * This is preferable to the previous `initialized` render-state pattern
   * because the preferences now come from an async API request.
   */
  useEffect(() => {
    if (!isLoading) {
      setDraft(preferences);
    }
  }, [preferences, isLoading]);

  if (isLoading || !draft) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        جاري التحميل...
      </p>
    );
  }

  const handleSave = async () => {
    // Basic client-side validation
    if (draft.minWorkHours < 1) {
      toast.error("الحد الأدنى لساعات الدراسة يجب أن يكون ساعة واحدة على الأقل.");
      return;
    }

    if (draft.maxWorkHours < 1) {
      toast.error("الحد الأقصى لساعات الدراسة يجب أن يكون ساعة واحدة على الأقل.");
      return;
    }

    if (draft.minWorkHours > draft.maxWorkHours) {
      toast.error(
        "الحد الأدنى لساعات الدراسة لا يمكن أن يكون أكبر من الحد الأقصى."
      );
      return;
    }

    if (!draft.startSleepTime || !draft.endSleepTime) {
      toast.error("يرجى تحديد وقت النوم والاستيقاظ.");
      return;
    }

    try {
      if (hasPreferences) {
        await updatePreferences(draft);
      } else {
        await createPreferences(draft);
      }

      toast.success("تم حفظ التفضيلات");
    } catch {
      toast.error("حدث خطأ أثناء حفظ التفضيلات.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          تفضيلات المخطط
        </h1>

        {error && (
          <p className="mt-1 text-sm text-red-500">
            {error}
          </p>
        )}
      </div>

      {/* Main Preferences */}
      <div className="grid grid-cols-1 gap-6 rounded-2xl border border-zinc-200 bg-white p-6 sm:grid-cols-2 dark:border-zinc-800 dark:bg-zinc-900">
        {/* Sleep Time */}
        <SettingsField
          label="وقت النوم"
          description="يُستخدم لاستبعاد ساعات نومك عند جدولة المهام"
        >
          <div className="flex items-center gap-3">
            <input
              type="time"
              value={draft.startSleepTime}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  startSleepTime: e.target.value,
                })
              }
              className={timeInputClass}
            />

            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              إلى
            </span>

            <input
              type="time"
              value={draft.endSleepTime}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  endSleepTime: e.target.value,
                })
              }
              className={timeInputClass}
            />
          </div>
        </SettingsField>

        {/* Minimum + Maximum Study Hours */}
        <SettingsField
          label="ساعات الدراسة اليومية"
          description="حدد الحد الأدنى والحد الأقصى لساعات الدراسة اليومية"
        >
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                الحد الأدنى
              </span>

              <input
                type="number"
                min={1}
                max={14}
                value={draft.minWorkHours}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    minWorkHours: Number(e.target.value),
                  })
                }
                className={numberInputClass}
              />
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                الحد الأقصى
              </span>

              <input
                type="number"
                min={1}
                max={14}
                value={draft.maxWorkHours}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    maxWorkHours: Number(e.target.value),
                  })
                }
                className={numberInputClass}
              />
            </div>
          </div>
        </SettingsField>

        {/* Pomodoro */}
        <SettingsField
          label="مدة الجلسة والاستراحة"
          description="المدة الافتراضية للجلسة، ومدة الاستراحة نفسها"
        >
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="number"
              min={5}
              value={draft.pomodoroWorkMinutes}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  pomodoroWorkMinutes: Number(e.target.value),
                })
              }
              className={numberInputClass}
            />

            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              دقيقة جلسة، ثم
            </span>

            <input
              type="number"
              min={1}
              value={draft.pomodoroBreakMinutes}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  pomodoroBreakMinutes: Number(e.target.value),
                })
              }
              className={numberInputClass}
            />

            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              دقيقة استراحة
            </span>
          </div>
        </SettingsField>

        {/* Plan Failure */}
        <SettingsField
          label="عند عدم إنهاء مهمة"
          description="كيف يتم التعامل مع المهام غير المكتملة نهاية اليوم"
        >
          <select
            value={draft.planFailureDecision}
            onChange={(e) =>
              setDraft({
                ...draft,
                planFailureDecision: Number(
                  e.target.value
                ) as UnfinishedTaskPolicy,
              })
            }
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-blue-500"
          >
            {UNFINISHED_POLICY_OPTIONS.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </SettingsField>
      </div>

      {/* Busy Times */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-1 text-lg font-bold text-zinc-900 dark:text-zinc-100">
          الأوقات المشغولة
        </h2>

        <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
          أضف الأوقات التي لا تكون فيها متفرغًا للدراسة، لكل يوم على
          حدة — يمكنك إضافة أكثر من وقت لكل يوم.
        </p>

        <BusyTimesEditor
          value={draft.busyTimes}
          onChange={(busyTimes) =>
            setDraft({
              ...draft,
              busyTimes,
            })
          }
        />
      </div>

      {/* Save */}
      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="self-start rounded-full bg-blue-600 px-6 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSaving ? "جاري الحفظ..." : "حفظ التفضيلات"}
      </button>
    </div>
  );
};

export default PlannerSettingsPage;