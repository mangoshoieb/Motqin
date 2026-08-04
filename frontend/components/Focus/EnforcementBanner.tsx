import { Smartphone, ShieldCheck, ShieldAlert, ShieldOff } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { ENFORCEMENT_META } from "@/app/constants/focus.constants";
import { EnforcementState } from "@/app/types/focus.types";

const TONE_STYLES = {
  warning:
    "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200",
  neutral:
    "border-zinc-300 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
  active:
    "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200",
} as const;

const TONE_ICONS = {
  warning: ShieldAlert,
  neutral: ShieldOff,
  active: ShieldCheck,
} as const;

interface EnforcementBannerProps {
  state: EnforcementState;
}

// Says plainly which of the three enforcement states the student is actually
// in. This banner is the reason the rest of the screen can be trusted: a
// policy editor that silently implies it is blocking something loses all
// credibility the first time the student opens TikTok anyway.
export const EnforcementBanner = ({ state }: EnforcementBannerProps) => {
  const meta = ENFORCEMENT_META[state];
  const Icon = TONE_ICONS[meta.tone];

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-3xl border p-5 sm:flex-row sm:items-center sm:justify-between",
        TONE_STYLES[meta.tone]
      )}
      dir="rtl"
    >
      <div className="flex items-start gap-3">
        <Icon size={22} className="mt-0.5 shrink-0" />
        <div>
          <p className="font-bold">{meta.label}</p>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed opacity-90">{meta.detail}</p>
        </div>
      </div>

      {state === "noDevice" && (
        <button
          type="button"
          disabled
          title="سيتاح فور إطلاق تطبيق متقن للهاتف"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-amber-600 px-5 py-2.5 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Smartphone size={16} />
          ربط جهاز — قريبًا
        </button>
      )}
    </div>
  );
};
