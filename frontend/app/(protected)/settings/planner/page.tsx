"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarClock, GraduationCap } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/app/lib/utils";

import { usePlannerPreferences } from "@/app/hooks/usePlannerPreferences";
import { useUnsavedChangesGuard } from "@/app/hooks/useUnsavedChangesGuard";
import {
  PlannerPreferences,
  UnfinishedTaskPolicy,
} from "@/app/types/planner-preferences.types";

import { SettingsField } from "@/components/Settings/SettingsField";
import { CourseScheduleEditor } from "@/components/Settings/Planner/CourseScheduleEditor";
import { RegularBusyTimeEditor } from "@/components/Settings/Planner/RegularBusyTimeEditor";
import { UnsavedChangesDialog } from "@/components/Settings/UnsavedChangesDialog";
import GuidedTour, { TourStep } from "@/components/ui/GuidedTour";

// First-visit walkthrough of the three preferences the AI planner can't
// work without. Dismissing it is remembered so it doesn't nag, but coming
// back through the planner's "ابدأ الرحلة" button shows it again.
const TOUR_DONE_KEY = "planner-settings-tour-done";
const TOUR_STEPS: TourStep[] = [
  {
    target: "sleep",
    title: "أولًا: وقت نومك",
    description:
      "أدخل الوقت الذي تنام فيه عادةً ووقت استيقاظك. لن يضع المخطط أي مهمة خلال هذه الساعات.",
  },
  {
    target: "hours",
    title: "ثانيًا: ساعات الدراسة اليومية",
    description:
      "حدد أقل عدد ساعات تلتزم به يوميًا، وأقصى ما يمكنك تحمله. يوزع المخطط مهامك بين هذين الحدين.",
  },
  {
    target: "lessons",
    title: "ثالثًا: جدول دروسك",
    description:
      "أضف دروسك تحت كل يوم حتى لا تتعارض مع مهامك. تُحفظ كل درس فور إضافتها، ولا تنسَ حفظ التفضيلات بالأعلى بعد الانتهاء.",
  },
];

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

type BusyTab = "courses" | "other";

const BUSY_TABS: { value: BusyTab; label: string; description: string; icon: typeof GraduationCap }[] = [
  {
    value: "courses",
    label: "جدول الدروس",
    description: "أضف دروسك تحت كل يوم من أيام الأسبوع.",
    icon: GraduationCap,
  },
  {
    value: "other",
    label: "أوقات مشغولة أخرى",
    description: "أضف موعدًا بعنوان، إما بوقت البداية والنهاية أو بمدة تقريبية.",
    icon: CalendarClock,
  },
];

const PlannerSettingsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  // "?return=/planner?tab=ai" — set by the AI-planning intro card so the
  // user lands back on it once their preferences are saved.
  const returnTo = searchParams.get("return");
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
  // "?tab=other" picks the tab to land on; the AI planner links here with
  // "courses" when that's the part the user still has to fill in.
  const [busyTab, setBusyTab] = useState<BusyTab>(
    searchParams.get("tab") === "other" ? "other" : "courses",
  );

  // Walk a first-time user through the required fields once the form is
  // on screen. Users who already saved preferences know the page.
  const [tourDismissedBefore] = useState(() => {
    try {
      return typeof window !== "undefined" && window.localStorage.getItem(TOUR_DONE_KEY) === "1";
    } catch {
      return false; // storage blocked — just show the tour
    }
  });
  const [tourClosed, setTourClosed] = useState(false);
  const tourOpen =
    !isLoading && !hasPreferences && !tourClosed && (Boolean(returnTo) || !tourDismissedBefore);

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

  const closeTour = () => {
    setTourClosed(true);
    try {
      window.localStorage.setItem(TOUR_DONE_KEY, "1");
    } catch {
      // Not remembering is fine; it'll just show again next time.
    }
  };

  // Anything typed but not saved yet. Compared against what the hook holds
  // (the server copy, or the empty defaults for a new user).
  const isDirty = draft !== null && JSON.stringify(draft) !== JSON.stringify(preferences);
  const { pendingHref, confirmLeave, cancelLeave } = useUnsavedChangesGuard(isDirty);

  if (isLoading || !draft) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        جاري التحميل...
      </p>
    );
  }

  // Validates and saves. Returns whether it succeeded so callers (the
  // unsaved-changes dialog) can decide whether to navigate afterwards.
  const handleSave = async (): Promise<boolean> => {
    // Basic client-side validation — the sleep and hours fields start
    // empty for a new user, so these are what stop a blank save.
    if (!draft.startSleepTime || !draft.endSleepTime) {
      toast.error("يرجى تحديد وقت النوم والاستيقاظ.");
      return false;
    }

    if (draft.minWorkHours < 1) {
      toast.error(
        "الحد الأدنى لساعات الدراسة يجب أن يكون ساعة واحدة على الأقل.",
      );
      return false;
    }

    if (draft.maxWorkHours < 1) {
      toast.error(
        "الحد الأقصى لساعات الدراسة يجب أن يكون ساعة واحدة على الأقل.",
      );
      return false;
    }

    if (draft.minWorkHours > draft.maxWorkHours) {
      toast.error(
        "الحد الأدنى لساعات الدراسة لا يمكن أن يكون أكبر من الحد الأقصى.",
      );
      return false;
    }

    try {
      if (hasPreferences) {
        await updatePreferences(draft);
      } else {
        await createPreferences(draft);
      }

      toast.success("تم حفظ التفضيلات");
      return true;
    } catch {
      toast.error("حدث خطأ أثناء حفظ التفضيلات.");
      return false;
    }
  };

  const saveAndReturn = async () => {
    if ((await handleSave()) && returnTo && returnTo.startsWith("/")) router.push(returnTo);
  };

  return (
    <div className="flex flex-col gap-6">
      <GuidedTour
        steps={TOUR_STEPS}
        open={tourOpen}
        // The lessons step points at the courses tab of the busy-times card.
        onStepChange={(step) => {
          if (step.target === "lessons") setBusyTab("courses");
        }}
        onFinish={closeTour}
        onSkip={closeTour}
      />

      {pendingHref && (
        <UnsavedChangesDialog
          isSaving={isSaving}
          onStay={cancelLeave}
          onDiscard={confirmLeave}
          onSaveAndLeave={async () => {
            if (await handleSave()) confirmLeave();
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            تفضيلات المخطط
          </h1>

          {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
     {/* Save */}
      <button
        type="button"
        onClick={saveAndReturn}
        // Nothing to save until a field differs from what's stored.
        disabled={isSaving || !isDirty}
        title={isDirty ? undefined : "لا توجد تغييرات لحفظها"}
        className="self-start  rounded-full bg-blue-600 px-6 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSaving ? "جاري الحفظ..." : "حفظ التفضيلات"}
      </button>
      </div>

      {/* Main Preferences */}
      <div className="grid grid-cols-1 gap-6 rounded-2xl border border-zinc-200 bg-white p-6 sm:grid-cols-2 dark:border-zinc-800 dark:bg-zinc-900">
        {/* Sleep Time */}
        <div data-tour="sleep">
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
        </div>

        {/* Minimum + Maximum Study Hours */}
        <div data-tour="hours">
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
                  value={draft.minWorkHours || ""}
                  placeholder="مثال: 2"
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
                  value={draft.maxWorkHours || ""}
                  placeholder="مثال: 5"
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
        </div>

        {/* Pomodoro */}
        <SettingsField
          label="مدة الجلسة والاستراحة"
          description="المدة الافتراضية للجلسة، ومدة الاستراحة نفسها"
        >
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="number"
              min={5}
              value={draft.pomodoroWorkingMinutes}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  pomodoroWorkingMinutes: Number(e.target.value),
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
                  e.target.value,
                ) as UnfinishedTaskPolicy,
              })
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

      {/* Busy Times — one card, two tabs */}
      <div
        data-tour="lessons"
        className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="mb-5 inline-flex items-center gap-1.5 rounded-2xl bg-zinc-100 p-1.5 dark:bg-zinc-800">
          {BUSY_TABS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setBusyTab(value)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all",
                busyTab === value
                  ? "bg-white text-blue-700 shadow-sm dark:bg-zinc-900 dark:text-blue-400"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200",
              )}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
          {BUSY_TABS.find((tab) => tab.value === busyTab)?.description}
        </p>

        {busyTab === "courses" ? <CourseScheduleEditor /> : <RegularBusyTimeEditor />}
      </div>
    </div>
  );
};

export default PlannerSettingsPage;
