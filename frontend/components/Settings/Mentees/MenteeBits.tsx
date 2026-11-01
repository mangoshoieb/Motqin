"use client";

import { Clock3, KeyRound } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { MENTOR_PRIVILEGES } from "@/app/constants/mentorship.constants";
import { formatClock, parseUtc } from "@/app/lib/distraction-blocker";
import { MentorPrivileges } from "@/app/types/mentorship.types";

// What the student shares with this mentor, as small chips.
export const PrivilegeChips = ({ privileges }: { privileges: MentorPrivileges }) => {
  const shared = MENTOR_PRIVILEGES.filter(({ key }) => privileges[key]);
  if (shared.length === 0) {
    return <span className="text-xs text-zinc-500 dark:text-zinc-400">لم يشارك شيئًا بعد</span>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {shared.map(({ key, short }) => (
        <span
          key={key}
          className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
        >
          {short}
        </span>
      ))}
    </div>
  );
};

// The unlock code, big enough to read out over the phone or across a room.
export const UnlockCodePanel = ({
  code,
  expiresAt,
  studentName,
  compact,
}: {
  code: string;
  expiresAt: string | null;
  studentName: string;
  compact?: boolean;
}) => {
  const expires = parseUtc(expiresAt);
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-2xl border border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-900/70 dark:bg-amber-950/25 dark:text-amber-100",
        compact ? "px-4 py-3" : "p-5",
      )}
    >
      <p className="flex items-center gap-1.5 text-xs font-bold">
        <KeyRound size={14} />
        رمز فتح الحجب · {studentName}
      </p>
      <p
        dir="ltr"
        className={cn(
          "text-right font-mono font-bold tabular-nums tracking-[0.3em]",
          compact ? "text-2xl" : "text-4xl",
        )}
      >
        {code}
      </p>
      <p className="flex items-center gap-1 text-xs opacity-90">
        <Clock3 size={12} />
        {expires ? `صالح حتى ${formatClock(expires)}. ` : ""}
        شارك الرمز ليُدخَل في التطبيق، فتُفتح إعدادات الحجب 15 دقيقة.
      </p>
    </div>
  );
};
