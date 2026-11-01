"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, Globe, Info, Lock, RotateCcw, ShieldCheck, Smartphone, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/app/lib/utils";
import {
  useBlockerLock,
  useBlockerSettings,
  useUpdateBlockerSettings,
} from "@/app/hooks/useDistractionBlocker";
import { useUnsavedChangesGuard } from "@/app/hooks/useUnsavedChangesGuard";
import { isPlannerPreferencesMissing, toastBlockerError } from "@/app/lib/distraction-blocker";
import { BLOCKER_LIMITS } from "@/app/constants/distraction-blocker.constants";
import { BlockerSettings, BlockerSettingsInput } from "@/app/types/distraction-blocker.types";
import { Switch } from "@/components/ui/switch";
import { MentorLockCard } from "@/components/Blocker/MentorLockCard";
import { WebsitesEditor } from "@/components/Settings/Blocker/WebsitesEditor";
import { AllowedAppsList } from "@/components/Settings/Blocker/AllowedAppsList";
import { UnsavedChangesDialog } from "@/components/Settings/UnsavedChangesDialog";

// The editable part of the settings — the lock fields are read-only and
// would be ignored if sent back.
const toInput = (settings: BlockerSettings): BlockerSettingsInput => ({
  blockDuringStudySessions: settings.blockDuringStudySessions,
  unblockDuringBreaks: settings.unblockDuringBreaks,
  autoStartPlanBlock: settings.autoStartPlanBlock,
  allowedApps: settings.allowedApps ?? [],
  blockedWebsites: settings.blockedWebsites ?? [],
});

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
  nested,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  nested?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 py-4",
        nested && "ms-6 border-s-2 border-zinc-100 ps-4 dark:border-zinc-800",
        disabled && "opacity-60",
      )}
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{label}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{description}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={(next) => onChange(next)}
        disabled={disabled}
        aria-label={label}
        className="mt-0.5 bg-zinc-300 data-[checked]:bg-blue-600 dark:bg-zinc-700 dark:data-[checked]:bg-blue-500"
      />
    </div>
  );
}

function SectionCard({
  icon: Icon,
  iconClass,
  title,
  description,
  children,
}: {
  icon: typeof Globe;
  iconClass: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start gap-3">
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", iconClass)}>
          <Icon size={20} />
        </span>
        <div className="min-w-0">
          <h2 className="font-bold text-zinc-900 dark:text-zinc-100">{title}</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

const BlockerSettingsPage = () => {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useBlockerSettings();
  const updateSettings = useUpdateBlockerSettings();
  const { isLocked } = useBlockerLock();

  // Only set once the student changes something; until then the form shows
  // the server's copy.
  const [draft, setDraft] = useState<BlockerSettingsInput | null>(null);

  const saved = data ? toInput(data) : null;
  const value = draft ?? saved;
  const isDirty = draft !== null && JSON.stringify(draft) !== JSON.stringify(saved);
  const { pendingHref, confirmLeave, cancelLeave } = useUnsavedChangesGuard(isDirty);

  if (isLoading) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">جاري التحميل...</p>;
  }

  if (isError || !value) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-red-600 dark:text-red-400">تعذر تحميل إعدادات منع المشتتات</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <RotateCcw size={14} />
          إعادة المحاولة
        </button>
      </div>
    );
  }

  const patch = (changes: Partial<BlockerSettingsInput>) => setDraft({ ...value, ...changes });

  // Returns whether it saved, so the unsaved-changes dialog knows whether
  // to navigate afterwards.
  const handleSave = async (): Promise<boolean> => {
    if (!draft) return true;
    try {
      await updateSettings.mutateAsync(draft);
      setDraft(null);
      toast.success("تم حفظ إعدادات منع المشتتات");
      return true;
    } catch (error) {
      if (isPlannerPreferencesMissing(error)) {
        toast.error("اضبط تفضيلات المخطط أولًا", {
          description: "يحتاج منع المشتتات وقت نومك وساعات دراستك قبل حفظ إعداداته.",
          action: {
            label: "تفضيلات المخطط",
            onClick: () => router.push("/settings/planner?return=/settings/blocker"),
          },
        });
      } else {
        toastBlockerError("تعذر حفظ الإعدادات", error);
      }
      return false;
    }
  };

  const saving = updateSettings.isPending;

  return (
    <div className="flex flex-col gap-6">
      {pendingHref && (
        <UnsavedChangesDialog
          isSaving={saving}
          onStay={cancelLeave}
          onDiscard={confirmLeave}
          onSaveAndLeave={async () => {
            if (await handleSave()) confirmLeave();
          }}
        />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">منع المشتتات</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            ما يُحجب على هاتفك ومتى، بعيدًا عن جداول الحجب.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isDirty && (
            <button
              type="button"
              onClick={() => setDraft(null)}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-full border border-zinc-200 px-4 py-2.5 text-sm text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <Undo2 size={15} />
              تراجع
            </button>
          )}
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || !isDirty || isLocked}
            title={
              isLocked ? "مقفلة من مشرفك" : isDirty ? undefined : "لا توجد تغييرات لحفظها"
            }
            className="flex items-center gap-1.5 rounded-full bg-blue-600 px-6 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLocked && <Lock size={15} />}
            {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
          </button>
        </div>
      </div>

      {/* The web can't block anything itself — say so before any setting. */}
      <div className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-blue-900 sm:flex-row sm:items-center sm:justify-between dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">
        <div className="flex gap-3">
          <Info size={18} className="mt-0.5 shrink-0" />
          <p className="leading-relaxed">
            الحجب يعمل من تطبيق متقن على هاتفك فقط، وتصله هذه الإعدادات تلقائيًا. لا يمكن تغييرها أثناء
            حجب يعمل على الهاتف.
          </p>
        </div>
        <Link
          href="/focus"
          className="flex shrink-0 items-center gap-1.5 self-start rounded-full bg-white px-4 py-2 text-xs font-bold text-blue-700 shadow-sm transition hover:bg-blue-100 sm:self-auto dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900"
        >
          <CalendarClock size={14} />
          جداول الحجب
        </Link>
      </div>

      <MentorLockCard />

      <SectionCard
        icon={ShieldCheck}
        iconClass="bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300"
        title="متى يعمل الحجب"
        description="إلى جانب جداول الحجب التي تضبطها من صفحة منع المشتتات."
      >
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          <ToggleRow
            label="الحجب أثناء جلسات المذاكرة"
            description="يعمل الحجب طوال جلسة المذاكرة، حتى خارج جداول الحجب."
            checked={value.blockDuringStudySessions}
            onChange={(checked) => patch({ blockDuringStudySessions: checked })}
            disabled={isLocked}
          />
          <ToggleRow
            nested
            label="رفع الحجب في الاستراحات"
            description="يتوقف الحجب خلال استراحة الجلسة، ثم يعود مع الجلسة التالية."
            checked={value.unblockDuringBreaks}
            onChange={(checked) => patch({ unblockDuringBreaks: checked })}
            disabled={isLocked || !value.blockDuringStudySessions}
          />
          <ToggleRow
            label="بدء حجب «حتى إنهاء الخطة» تلقائيًا"
            description="يبدأ التطبيق حجب اليوم بنفسه عند منتصف الليل، ويرفعه بعد إنهاء خطة اليوم ومراجعاته."
            checked={value.autoStartPlanBlock}
            onChange={(checked) => patch({ autoStartPlanBlock: checked })}
            disabled={isLocked}
          />
        </div>
      </SectionCard>

      <SectionCard
        icon={Globe}
        iconClass="bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-300"
        title="المواقع المحجوبة"
        description="تُحجب أثناء أي حجب. الصق الرابط كاملًا إن شئت، ونحفظ اسم الموقع فقط."
      >
        <WebsitesEditor
          websites={value.blockedWebsites}
          onChange={(blockedWebsites) => patch({ blockedWebsites })}
          disabled={isLocked}
        />
      </SectionCard>

      <SectionCard
        icon={Smartphone}
        iconClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300"
        title="التطبيقات المسموحة"
        description="أثناء الحجب تُحجب كل التطبيقات ما عدا هذه. تضيفها من تطبيق متقن على هاتف أندرويد، ويمكنك إزالتها من هنا."
      >
        <AllowedAppsList
          apps={value.allowedApps}
          onRemove={(appId) => patch({ allowedApps: value.allowedApps.filter((id) => id !== appId) })}
          disabled={isLocked}
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {value.allowedApps.length} / {BLOCKER_LIMITS.APPS} تطبيق · اختيارات آيفون تبقى على الهاتف ولا تظهر
          هنا.
        </p>
      </SectionCard>
    </div>
  );
};

export default BlockerSettingsPage;
