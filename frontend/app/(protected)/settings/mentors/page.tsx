"use client";

import { useState } from "react";
import Link from "next/link";
import { Info, Lock, LockOpen, RotateCcw, UserPlus, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { useAuthKind } from "@/app/hooks/useAuthKind";
import { useInviteMentor, useMyMentors } from "@/app/hooks/useMentorship";
import { mentorshipErrorMessage } from "@/app/lib/mentorship";
import { normalizeEgyptianPhone } from "@/app/lib/phone";
import { formatClock, parseUtc } from "@/app/lib/distraction-blocker";
import { isAuthGateError } from "@/app/lib/api-error";
import { MAX_MENTORS } from "@/app/constants/mentorship.constants";
import { MentorCard } from "@/components/Settings/Mentors/MentorCard";
import { SignUpToUse } from "@/components/Settings/Mentors/SignUpToUse";

const MentorsSettingsPage = () => {
  const authKind = useAuthKind();
  const { data, isLoading, isError, refetch } = useMyMentors();
  const inviteMentor = useInviteMentor();

  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (authKind === "guest") {
    return (
      <SignUpToUse
        title="المشرفون"
        message="أنشئ حسابًا مجانيًا لتدعو من تثق به ليتابع أداءك أو إعدادات الحجب."
      />
    );
  }

  if (isLoading || authKind === "none") {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">جاري التحميل...</p>;
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-red-600 dark:text-red-400">تعذر تحميل المشرفين</p>
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

  const { mentors, blockerLock } = data;
  const atLimit = mentors.length >= MAX_MENTORS;
  const lockHolder = mentors.find((m) => m.status === "Active" && m.canLockBlocker) ?? null;
  const unlockedUntil = parseUtc(blockerLock.unlockedUntil);

  const invite = async () => {
    const normalized = normalizeEgyptianPhone(phone);
    if (!normalized) {
      setError("أدخل رقم موبايل مصري صحيح، مثل 01012345678.");
      return;
    }
    setError(null);
    try {
      const mentor = await inviteMentor.mutateAsync(normalized);
      setPhone("");
      toast.success(`أُرسلت الدعوة إلى ${mentor.mentorName}`);
    } catch (err) {
      if (!isAuthGateError(err)) setError(mentorshipErrorMessage(err));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">المشرفون</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          ادعُ من تثق به ليتابعك. أنت من يختار ما يراه كل مشرف.
        </p>
      </div>

      <div className="flex gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">
        <Info size={18} className="mt-0.5 shrink-0" />
        <p className="leading-relaxed">
          تشغيل صلاحية يسري فورًا، أما إيقافها أو إنهاء المتابعة فيحتاج موافقة المشرف. المشرف اتفاقك مع نفسك
          الآن، حتى لا تلغيه في لحظة ملل.
        </p>
      </div>

      {/* Lock state, so the student knows why the blocker refuses changes. */}
      {blockerLock.locked && lockHolder && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-200">
          <p className="flex items-center gap-2 font-semibold">
            <Lock size={16} className="shrink-0" />
            إعدادات الحجب مقفلة بواسطة {lockHolder.mentorName}
          </p>
          <Link
            href="/focus"
            className="rounded-full bg-white px-4 py-1.5 text-xs font-bold text-violet-700 shadow-sm transition hover:bg-violet-100 dark:bg-violet-950 dark:text-violet-300"
          >
            اطلب رمزًا لفتحها
          </Link>
        </div>
      )}
      {!blockerLock.locked && lockHolder && unlockedUntil && (
        <p className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
          <LockOpen size={16} className="shrink-0" />
          إعدادات الحجب مفتوحة للتعديل حتى {formatClock(unlockedUntil)}
        </p>
      )}

      {/* Invite */}
      <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
            <UserPlus size={20} />
          </span>
          <div className="min-w-0">
            <h2 className="font-bold text-zinc-900 dark:text-zinc-100">دعوة مشرف</h2>
            <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              برقم هاتفه المسجّل في متقن. تظهر الدعوة في صفحته حتى يقبلها أو يرفضها.
            </p>
          </div>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void invite();
          }}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <label htmlFor="mentor-phone" className="sr-only">
            رقم هاتف المشرف
          </label>
          <input
            id="mentor-phone"
            type="tel"
            dir="ltr"
            inputMode="tel"
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value);
              setError(null);
            }}
            disabled={atLimit}
            placeholder="01XXXXXXXXX"
            className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-left text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-400 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={atLimit || !phone.trim() || inviteMentor.isPending}
            className="shrink-0 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {inviteMentor.isPending ? "جاري الإرسال..." : "إرسال الدعوة"}
          </button>
        </form>
        {error && <p className="-mt-2 text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {mentors.length} / {MAX_MENTORS} مشرفين، والدعوات المعلّقة منهم
        </p>
      </section>

      {/* Mentors */}
      <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300">
            <UsersRound size={20} />
          </span>
          <div className="min-w-0">
            <h2 className="font-bold text-zinc-900 dark:text-zinc-100">مشرفوك</h2>
            <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              مشرف واحد فقط يمكنه حمل قفل الحجب.
            </p>
          </div>
        </div>

        {mentors.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            لم تدعُ أي مشرف بعد. ادعُ أحد والديك أو معلمك أو صديقًا تثق به.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {mentors.map((mentor) => (
              <MentorCard
                key={mentor.id}
                mentor={mentor}
                lockHolder={lockHolder && lockHolder.id !== mentor.id ? lockHolder : null}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default MentorsSettingsPage;
