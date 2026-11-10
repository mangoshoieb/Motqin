"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, CalendarClock, Gauge, X } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { useAuthKind } from "@/app/hooks/useAuthKind";
import { useMySubscription } from "@/app/hooks/usePayments";
import { featureLabel, formatDay, toUtcDate } from "@/app/lib/payments";
import { MySubscription } from "@/app/types/payment.types";

// How close is "close": a plan ending within this many days, a monthly
// limit used this much.
const ENDING_DAYS = 3;
const NEAR_LIMIT = 0.8;

type Reminder =
  | { kind: "grace"; until: string | null }
  | { kind: "ending"; days: number }
  | { kind: "limits"; items: { label: string; percent: number }[] };

const daysUntil = (iso: string | null) => {
  const end = toUtcDate(iso);
  return end ? Math.ceil((end.getTime() - Date.now()) / 86_400_000) : null;
};

// The most pressing thing to say about the plan, if anything.
const reminderFor = (me: MySubscription, limitsOnly = false): Reminder | null => {
  const { current, scheduled } = me;
  if (!limitsOnly && current.kind === "Paid" && !scheduled) {
    if (current.inGrace) return { kind: "grace", until: current.graceEndsAt };
    const days = daysUntil(current.endDate);
    if (days !== null && days <= ENDING_DAYS) return { kind: "ending", days: Math.max(0, days) };
  }
  // Monthly limits only: an allowance (subjects, students) at its limit is a
  // normal state, not something running out.
  const items = me.quotas
    .filter((q) => q.type === "Usage" && q.access === "Limited" && q.included !== false && !q.lifetime && (q.limit ?? 0) > 0)
    .map((q) => ({ label: featureLabel(q.feature, q.displayName), percent: Math.round((q.used / q.limit!) * 100) }))
    .filter((q) => q.percent >= NEAR_LIMIT * 100)
    .sort((a, b) => b.percent - a.percent);
  return items.length ? { kind: "limits", items: items.slice(0, 2) } : null;
};

const todayKey = (kind: string) => `motqin:plan-reminder:${kind}:${new Date().toISOString().slice(0, 10)}`;

const wasDismissed = (kind: string) => {
  try {
    return localStorage.getItem(todayKey(kind)) === "1";
  } catch {
    return false;
  }
};

// A banner when the plan is about to end (or already in its grace days), or
// a monthly limit is nearly used — before the "limit reached" popup. Hidden
// for the rest of the day once dismissed.
export function PlanReminder({ className, limitsOnly }: { className?: string; limitsOnly?: boolean }) {
  const registered = useAuthKind() === "user";
  const { data: me } = useMySubscription(registered);
  const [dismissed, setDismissed] = useState<string[]>([]);
  // Where the plan card already warns about the end date, only limits.
  const reminder = me ? reminderFor(me, limitsOnly) : null;

  if (!reminder || dismissed.includes(reminder.kind) || wasDismissed(reminder.kind)) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(todayKey(reminder.kind), "1");
    } catch {
      // Storage blocked: hidden for this visit only.
    }
    setDismissed((prev) => [...prev, reminder.kind]);
  };

  const current = me!.current;
  const renewHref = `/subscription/checkout?bundleId=${current.bundleId}${current.groups?.length ? `&groups=${current.groups.join(",")}` : ""}`;
  const urgent = reminder.kind === "grace";

  return (
    <div
      dir="rtl"
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-2xl border p-4 text-sm",
        urgent
          ? "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200"
          : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200",
        className,
      )}
    >
      {reminder.kind === "limits" ? (
        <Gauge size={20} className="shrink-0" />
      ) : urgent ? (
        <AlertTriangle size={20} className="shrink-0" />
      ) : (
        <CalendarClock size={20} className="shrink-0" />
      )}
      <p className="min-w-0 flex-1">
        {reminder.kind === "grace" && (
          <>
            <b>انتهت باقتك.</b> مزاياها متاحة حتى {formatDay(reminder.until)} فقط، جدّدها الآن حتى لا تتوقف.
          </>
        )}
        {reminder.kind === "ending" && (
          <>
            <b>
              باقتك تنتهي{" "}
              {reminder.days === 0 ? "اليوم" : reminder.days === 1 ? "غدًا" : reminder.days === 2 ? "بعد يومين" : `خلال ${reminder.days} أيام`}.
            </b>{" "}
            جدّدها الآن، وتبدأ الباقة الجديدة عند انتهاء الحالية.
          </>
        )}
        {reminder.kind === "limits" && (
          <>
            <b>اقتربت من حدود باقتك:</b>{" "}
            {reminder.items.map((item) => `${item.label} (${item.percent}٪)`).join("، ")}. رقِّ باقتك حتى لا تتوقف.
          </>
        )}
      </p>
      <Link
        href={reminder.kind === "limits" ? "/subscription" : renewHref}
        className={cn(
          "rounded-full px-4 py-2 text-xs font-bold text-white",
          urgent ? "bg-rose-600 hover:bg-rose-700" : "bg-amber-500 hover:bg-amber-600",
        )}
      >
        {reminder.kind === "limits" ? "اعرض العروض" : "جدّد الآن"}
      </Link>
      {reminder.kind === "limits" && (
        <Link href="/settings/billing/limits" className="text-xs font-semibold underline-offset-2 hover:underline">
          حدود باقتي
        </Link>
      )}
      <button type="button" onClick={dismiss} aria-label="إخفاء اليوم" className="rounded-full p-1 opacity-60 hover:opacity-100">
        <X size={16} />
      </button>
    </div>
  );
}
