"use client";

import { useState } from "react";
import { toast } from "sonner";
import { usePlannerPreferences } from "@/app/hooks/usePlannerPreferences";
import { PlannerPreferences, UnfinishedTaskPolicy } from "@/app/types/planner-preferences.types";
import { SettingsField } from "@/components/Settings/SettingsField";
import { BusyTimesEditor } from "@/components/Settings/Planner/BusyTimesEditor";

const timeInputClass =
  "rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-blue-500";

const numberInputClass =
  "w-24 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-blue-500";

const UNFINISHED_POLICY_OPTIONS: { value: UnfinishedTaskPolicy; label: string }[] = [
  { value: "hybrid", label: "إيجاد وقت فارغ في نفس الأسبوع، وإلا الأسبوع القادم" },
  { value: "same-week", label: "إيجاد وقت فارغ في نفس الأسبوع فقط" },
  { value: "next-week", label: "إرسالها دائمًا إلى الأسبوع القادم" },
];

const PlannerSettingsPage = () => {
  const { preferences, savePreferences, isLoaded } = usePlannerPreferences();

  const [draft, setDraft] = useState<PlannerPreferences | null>(null);

  // Seed the editable draft once preferences load from localStorage.
  // Adjusting state during render instead of in an effect, per React's
  // rules on deriving state from props/async results.
  const [initialized, setInitialized] = useState(false);
  if (isLoaded && !initialized) {
    setInitialized(true);
    setDraft(preferences);
  }

  if (!draft) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">جاري التحميل...</p>;
  }

  const handleSave = () => {
    savePreferences(draft);
    toast.success("تم حفظ التفضيلات");
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">تفضيلات المخطط</h1>
        {/* <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          تُحفظ هذه التفضيلات على هذا الجهاز فقط حاليًا، وسيتم ربطها بالخادم لاحقًا.
        </p> */}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 rounded-2xl bg-white border border-zinc-200 p-6 dark:bg-zinc-900 dark:border-zinc-800">
        <SettingsField label="وقت النوم" description="يُستخدم لاستبعاد ساعات نومك عند جدولة المهام">
          <div className="flex items-center gap-3">
            <input
              type="time"
              value={draft.sleepStart}
              onChange={(e) => setDraft({ ...draft, sleepStart: e.target.value })}
              className={timeInputClass}
            />
            <span className="text-sm text-zinc-500 dark:text-zinc-400">إلى</span>
            <input
              type="time"
              value={draft.sleepEnd}
              onChange={(e) => setDraft({ ...draft, sleepEnd: e.target.value })}
              className={timeInputClass}
            />
          </div>
        </SettingsField>

        <SettingsField label="الحد الأقصى لساعات الدراسة اليومية">
          <input
            type="number"
            min={1}
            max={14}
            value={draft.maxDailyStudyHours}
            onChange={(e) => setDraft({ ...draft, maxDailyStudyHours: Number(e.target.value) })}
            className={numberInputClass}
          />
        </SettingsField>

        <SettingsField
          label="مدة الجلسة والاستراحة"
          description="المدة الافتراضية للجلسة ، ومدة الاستراحة نفسها"
        >
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="number"
              min={5}
              value={draft.breakIntervalMinutes}
              onChange={(e) => setDraft({ ...draft, breakIntervalMinutes: Number(e.target.value) })}
              className={numberInputClass}
            />
            <span className="text-sm text-zinc-500 dark:text-zinc-400">دقيقة جلسة، ثم</span>
            <input
              type="number"
              min={1}
              value={draft.breakDurationMinutes}
              onChange={(e) => setDraft({ ...draft, breakDurationMinutes: Number(e.target.value) })}
              className={numberInputClass}
            />
            <span className="text-sm text-zinc-500 dark:text-zinc-400">دقيقة استراحة</span>
          </div>
        </SettingsField>

        <SettingsField
          label="عند عدم إنهاء مهمة"
          description="كيف يتم التعامل مع المهام غير المكتملة نهاية اليوم"
        >
          <select
            value={draft.unfinishedTaskPolicy}
            onChange={(e) =>
              setDraft({ ...draft, unfinishedTaskPolicy: e.target.value as UnfinishedTaskPolicy })
            }
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-blue-500"
          >
            {UNFINISHED_POLICY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </SettingsField>
      </div>

      <div className="rounded-2xl bg-white border border-zinc-200 p-6 dark:bg-zinc-900 dark:border-zinc-800">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">الأوقات المشغولة</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
          أضف الأوقات التي لا تكون فيها متفرغًا للدراسة، لكل يوم على حدة — يمكنك إضافة أكثر من وقت لكل يوم.
        </p>
        <BusyTimesEditor
          value={draft.busyTimes}
          onChange={(busyTimes) => setDraft({ ...draft, busyTimes })}
        />
      </div>

      <button
        type="button"
        onClick={handleSave}
        className="self-start px-6 py-2.5 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
      >
        حفظ التفضيلات
      </button>
    </div>
  );
};

export default PlannerSettingsPage;
