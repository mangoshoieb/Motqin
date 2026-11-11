"use client";

import { useEffect, useState } from "react";
import { KeyRound, Lock, LockOpen, Send } from "lucide-react";
import { toast } from "sonner";
import {
  useBlockerLock,
  useRequestUnlockCode,
  useVerifyUnlockCode,
} from "@/app/hooks/useDistractionBlocker";
import { useMyMentors } from "@/app/hooks/useMentorship";
import {
  blockerErrorMessage,
  formatClock,
  getBlockerError,
  parseUtc,
} from "@/app/lib/distraction-blocker";
import { formatUsage } from "@/app/constants/focus.constants";

// Shown on both blocker screens while a mentor holds the lock. The student
// asks for a code (it appears on the mentor's page), types it in, and the
// locked changes work for 15 minutes. Renders nothing without a lock.
export const MentorLockCard = () => {
  const { lockedByMentor, isLocked, unlockedUntil, minutesLeft } = useBlockerLock();
  // Only fetched once a lock exists — guests (who can't have mentors) never
  // get here, so this never trips their signup popup.
  const { data: myMentors } = useMyMentors({ enabled: lockedByMentor });
  const lockHolder = myMentors?.mentors.find((m) => m.status === "Active" && m.canLockBlocker);

  const requestCode = useRequestUnlockCode();
  const verifyCode = useVerifyUnlockCode();

  const [code, setCode] = useState("");
  const [codeExpiresAt, setCodeExpiresAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  // cooldown: when asking again is allowed, and a 1s tick to count down to it.
  const [retryAt, setRetryAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (retryAt === null) return;
    const tick = setInterval(() => {
      setNow(Date.now());
      if (Date.now() >= retryAt) setRetryAt(null);
    }, 1000);
    return () => clearInterval(tick);
  }, [retryAt]);

  if (!lockedByMentor) return null;

  if (!isLocked && unlockedUntil) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
        <LockOpen size={20} className="mt-0.5 shrink-0" />
        <div className="text-sm leading-relaxed">
          <p className="font-bold">الإعدادات مفتوحة للتعديل حتى {formatClock(unlockedUntil)}</p>
          <p className="mt-0.5 opacity-90">
            باقي {formatUsage(minutesLeft)}، ثم يعود قفل مشرفك تلقائيًا.
          </p>
        </div>
      </div>
    );
  }

  const secondsToRetry = retryAt ? Math.max(0, Math.ceil((retryAt - now) / 1000)) : 0;

  const handleRequest = async () => {
    setError(null);
    try {
      const state = await requestCode.mutateAsync();
      setCodeExpiresAt(parseUtc(state.codeExpiresAt));
    } catch (err) {
      const coded = getBlockerError(err);
      if (coded?.code === "cooldown" && coded.details?.retryAfterSeconds) {
        setNow(Date.now());
        setRetryAt(Date.now() + coded.details.retryAfterSeconds * 1000);
      }
      setError(blockerErrorMessage(err));
    }
  };

  const handleVerify = async () => {
    setError(null);
    try {
      await verifyCode.mutateAsync(code);
      setCode("");
      setCodeExpiresAt(null);
      toast.success("تم فتح الإعدادات لمدة 15 دقيقة");
    } catch (err) {
      setError(blockerErrorMessage(err));
      if (getBlockerError(err)?.code === "unlock_code_expired") setCodeExpiresAt(null);
    }
  };

  return (
    <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950 dark:border-amber-900/70 dark:bg-amber-950/25 dark:text-amber-100">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300">
          <Lock size={20} />
        </span>
        <div className="min-w-0 text-sm leading-relaxed">
          <h2 className="text-base font-bold">
            {lockHolder
              ? `إعدادات الحجب مقفلة بواسطة ${lockHolder.mentorName}`
              : "قفل مشرفك إعدادات الحجب"}
          </h2>
          <p className="mt-1 opacity-90">
            تغيير الإعدادات وتعديل الجداول أو حذفها يحتاج رمزًا من مشرفك، ويفتحها لمدة 15 دقيقة.
            إضافة جدول جديد مسموحة دائمًا لأنها تزيد الحجب فقط.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-amber-200/80 pt-4 dark:border-amber-900/50">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void handleRequest()}
            disabled={requestCode.isPending || secondsToRetry > 0}
            className="flex items-center gap-2 rounded-full bg-amber-600 dark:bg-amber-700 px-5 py-2 text-sm font-bold text-white transition hover:bg-amber-700 dark:hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send size={15} />
            {requestCode.isPending
              ? "جاري الطلب..."
              : secondsToRetry > 0
                ? `اطلب مرة أخرى بعد ${secondsToRetry} ث`
                : "اطلب رمزًا من مشرفك"}
          </button>

          {codeExpiresAt && (
            <p className="text-xs font-medium opacity-90">
              الرمز ظاهر الآن في صفحة مشرفك، وصالح حتى {formatClock(codeExpiresAt)}.
            </p>
          )}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (code.length >= 4) void handleVerify();
          }}
          className="flex flex-wrap items-center gap-2"
        >
          <label htmlFor="blocker-unlock-code" className="sr-only">
            رمز المشرف
          </label>
          <div className="relative">
            <KeyRound
              size={16}
              className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-amber-700/70 dark:text-amber-300/70"
            />
            <input
              id="blocker-unlock-code"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 8))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="أدخل الرمز"
              className="w-44 rounded-full border border-amber-300 bg-white py-2 pe-4 ps-9 text-sm tracking-widest text-zinc-900 outline-none transition placeholder:tracking-normal focus:border-amber-500 dark:border-amber-900 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>
          <button
            type="submit"
            disabled={code.length < 4 || verifyCode.isPending}
            className="rounded-full border border-amber-600 px-5 py-2 text-sm font-bold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-amber-200 dark:hover:bg-amber-900/40"
          >
            {verifyCode.isPending ? "جاري التحقق..." : "فتح الإعدادات"}
          </button>
        </form>

        {error && <p className="text-xs font-semibold text-red-700 dark:text-red-400">{error}</p>}
      </div>
    </section>
  );
};
