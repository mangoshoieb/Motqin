"use client";

import { useState } from "react";
import { Clock3, Lock, PauseCircle, UserMinus, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/app/lib/utils";
import { MENTOR_PRIVILEGES } from "@/app/constants/mentorship.constants";
import { useEndMentorship, useUpdateMentorPrivileges } from "@/app/hooks/useMentorship";
import { hasAnyPrivilege, toastMentorshipError } from "@/app/lib/mentorship";
import { MentorPrivileges, MyMentor } from "@/app/types/mentorship.types";
import { Switch } from "@/components/ui/switch";
import UserAvatar from "@/components/ui/UserAvatar";
import { ConfirmDialog } from "@/components/ExecutionBoard/ConfirmDialog";

type PendingConfirm =
  | { kind: "privilege-off"; key: keyof MentorPrivileges; label: string }
  | { kind: "end" };

interface MentorCardProps {
  mentor: MyMentor;
  // Another mentor who already holds the blocker lock, if any.
  lockHolder: MyMentor | null;
}

export const MentorCard = ({ mentor, lockHolder }: MentorCardProps) => {
  const updatePrivileges = useUpdateMentorPrivileges();
  const endMentorship = useEndMentorship();
  const [confirm, setConfirm] = useState<PendingConfirm | null>(null);

  const isPending = mentor.status === "Pending";
  // The mentor's plan no longer covers this student: they see nothing, their
  // lock doesn't apply, and taking privileges back or unlinking is instant.
  const paused = !!mentor.paused;
  const lockHolderName = lockHolder?.mentorName ?? null;
  const busy = updatePrivileges.isPending || endMentorship.isPending;
  const privileges: MentorPrivileges = {
    canViewPerformance: mentor.canViewPerformance,
    canViewBlocker: mentor.canViewBlocker,
    canLockBlocker: mentor.canLockBlocker,
  };

  const savePrivileges = async (next: MentorPrivileges, turnedOff: string | null) => {
    try {
      const saved = await updatePrivileges.mutateAsync({ id: mentor.id, privileges: next });
      toast.success(
        turnedOff && saved.removalRequested.length > 0
          ? `أُرسل طلب إيقاف «${turnedOff}» إلى ${mentor.mentorName} للموافقة`
          : "تم تحديث الصلاحيات",
      );
    } catch (error) {
      toastMentorshipError("تعذر تحديث الصلاحيات", error);
    }
  };

  const toggle = (key: keyof MentorPrivileges, label: string, on: boolean) => {
    if (!on) {
      // Switching off isn't instant (except on a paused link) — say so
      // before sending it.
      setConfirm({ kind: "privilege-off", key, label });
      return;
    }
    const next = { ...privileges, [key]: true };
    // The lock includes seeing the blocker.
    if (key === "canLockBlocker") next.canViewBlocker = true;
    void savePrivileges(next, null);
  };

  const end = async () => {
    try {
      const result = await endMentorship.mutateAsync(mentor.id);
      if (result.status === "Cancelled") toast.success("تم إلغاء الدعوة");
      else if (result.status === "Ended") toast.success(`انتهت متابعة ${mentor.mentorName}`);
      else if (result.endRequested) toast.success(`أُرسل طلب إنهاء المتابعة إلى ${mentor.mentorName}`);
    } catch (error) {
      toastMentorshipError(isPending ? "تعذر إلغاء الدعوة" : "تعذر إنهاء المتابعة", error);
    }
  };

  const onConfirm = () => {
    const pending = confirm;
    setConfirm(null);
    if (!pending) return;
    if (pending.kind === "end") void end();
    else void savePrivileges({ ...privileges, [pending.key]: false }, pending.label);
  };

  // Requests sent before the pause still wait; sent again now, they apply
  // at once.
  const resend = () => {
    if (mentor.endRequested) {
      void end();
      return;
    }
    const next = { ...privileges };
    for (const { key, name } of MENTOR_PRIVILEGES) if (mentor.removalRequested.includes(name)) next[key] = false;
    void savePrivileges(next, null);
  };

  // The lock is with a paused mentor: take it back from them at once, then
  // give it to this one.
  const takeLockFromPaused = async () => {
    if (!lockHolder) return;
    try {
      await updatePrivileges.mutateAsync({
        id: lockHolder.id,
        privileges: {
          canViewPerformance: lockHolder.canViewPerformance,
          canViewBlocker: lockHolder.canViewBlocker,
          canLockBlocker: false,
        },
      });
      await savePrivileges({ ...privileges, canLockBlocker: true, canViewBlocker: true }, null);
    } catch (error) {
      toastMentorshipError("تعذر سحب القفل", error);
    }
  };

  const pausedWaiting = paused && (mentor.endRequested || mentor.removalRequested.length > 0);

  return (
    <li
      className={cn(
        "flex flex-col gap-4 rounded-2xl border p-4",
        isPending
          ? "border-dashed border-zinc-300 dark:border-zinc-700"
          : "border-zinc-200 dark:border-zinc-800",
        paused && "bg-zinc-50 dark:bg-zinc-900/60",
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className={cn(paused && "opacity-50 grayscale")}>
          <UserAvatar name={mentor.mentorName} photoUrl={mentor.mentorPhotoUrl} size={44} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className={cn("font-bold", paused ? "text-zinc-500" : "text-zinc-900 dark:text-zinc-100")}>{mentor.mentorName}</p>
            {paused ? (
              <span className="flex items-center gap-1 rounded-full bg-zinc-200 px-2.5 py-0.5 text-[11px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                <PauseCircle size={12} />
                انتهت باقة متابعك
              </span>
            ) : isPending ? (
              <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                <Clock3 size={12} />
                بانتظار القبول
              </span>
            ) : (
              mentor.canLockBlocker && (
                <span className="flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-bold text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                  <Lock size={12} />
                  قفل الحجب
                </span>
              )
            )}
          </div>
          <p dir="ltr" className="text-right text-xs text-zinc-500 dark:text-zinc-400">
            {mentor.mentorPhone}
          </p>
        </div>

        {isPending ? (
          <button
            type="button"
            onClick={() => void end()}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-full border border-zinc-200 px-4 py-2 text-sm text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <X size={15} />
            إلغاء الدعوة
          </button>
        ) : (
          !mentor.endRequested && (
            <button
              type="button"
              onClick={() => setConfirm({ kind: "end" })}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              <UserMinus size={15} />
              إنهاء المتابعة
            </button>
          )
        )}
      </div>

      {isPending ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          تظهر دعوتك في صفحة {mentor.mentorName}. بعد قبولها تختار الصلاحيات.
        </p>
      ) : (
        <>
          {paused && (
            <p className="rounded-xl bg-zinc-100 px-3 py-2 text-xs leading-relaxed text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              انتهت باقة {mentor.mentorName}: بياناتك محجوبة عن المتابعة الآن والقفل لا يسري، حتى تتجدد الباقة. إيقاف أي صلاحية أو إنهاء المتابعة يسري فورًا.
            </p>
          )}
          {pausedWaiting && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
              <Clock3 size={14} className="shrink-0" />
              <span className="flex-1">أرسلت طلبًا قبل توقف المتابعة. أعد إرساله ليُطبّق فورًا.</span>
              <button
                type="button"
                onClick={resend}
                disabled={busy}
                className="rounded-full bg-white px-3 py-1 font-bold text-amber-800 shadow-sm hover:bg-amber-100 dark:hover:bg-amber-500/15 disabled:opacity-50 dark:bg-amber-950 dark:text-amber-200"
              >
                أعد الإرسال
              </button>
            </div>
          )}
          {mentor.endRequested && !paused && (
            <p className="flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
              <Clock3 size={14} className="shrink-0" />
              طلبت إنهاء المتابعة، وهو بانتظار موافقة {mentor.mentorName}.
            </p>
          )}

          <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-100 dark:divide-zinc-800 dark:border-zinc-800">
            {MENTOR_PRIVILEGES.map(({ key, name, label, description }) => {
              const on = privileges[key];
              const removalPending = mentor.removalRequested.includes(name);
              // Seeing the blocker comes with the lock.
              const coveredByLock = key === "canViewBlocker" && privileges.canLockBlocker;
              const heldElsewhere = key === "canLockBlocker" && !on && lockHolderName !== null;

              return (
                <div key={key} className="flex items-start justify-between gap-4 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{label}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                      {description}
                    </p>
                    {removalPending && !paused ? (
                      <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                        <Clock3 size={12} />
                        طلبت إيقافها، وهي بانتظار موافقة المشرف
                      </p>
                    ) : heldElsewhere && lockHolder?.paused ? (
                      <button
                        type="button"
                        onClick={() => void takeLockFromPaused()}
                        disabled={busy}
                        className="mt-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
                      >
                        القفل مع {lockHolderName} لكن باقة المتابعة انتهت. اسحب القفل وامنحه لـ {mentor.mentorName}
                      </button>
                    ) : heldElsewhere ? (
                      <p className="mt-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                        القفل مع {lockHolderName} الآن
                      </p>
                    ) : (
                      coveredByLock && (
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">مشمولة مع قفل الحجب</p>
                      )
                    )}
                  </div>
                  <Switch
                    checked={on}
                    onCheckedChange={(next) => toggle(key, label, next)}
                    disabled={busy || (removalPending && !paused) || coveredByLock || heldElsewhere}
                    aria-label={label}
                    className="mt-0.5 bg-zinc-300 data-[checked]:bg-blue-600 dark:bg-zinc-700 dark:data-[checked]:bg-blue-500"
                  />
                </div>
              );
            })}
          </div>
        </>
      )}

      {confirm && (
        <ConfirmDialog
          tone={confirm.kind === "end" && (paused || !hasAnyPrivilege(privileges)) ? "danger" : "default"}
          title={
            confirm.kind === "privilege-off"
              ? `إيقاف «${confirm.label}»؟`
              : hasAnyPrivilege(privileges) && !paused
                ? `طلب إنهاء متابعة ${mentor.mentorName}؟`
                : `إنهاء متابعة ${mentor.mentorName}؟`
          }
          description={
            paused
              ? confirm.kind === "privilege-off"
                ? `تتوقف فورًا، لأن باقة ${mentor.mentorName} انتهت، فلا تحتاج موافقة الآن.`
                : `تنتهي المتابعة فورًا، لأن باقة ${mentor.mentorName} انتهت. يمكنك إرسال دعوة جديدة لاحقًا.`
              : confirm.kind === "privilege-off"
                ? `لن تتوقف فورًا: يصل طلبك إلى ${mentor.mentorName}، وتبقى الصلاحية حتى الموافقة عليه. هكذا لا يُلغى اتفاقكما في لحظة ملل.`
                : hasAnyPrivilege(privileges)
                  ? `لأن للمتابعة صلاحيات مفعّلة، يحتاج إنهاؤها موافقة ${mentor.mentorName}، وسيظهر طلبك في صفحة المشرف.`
                  : `تنتهي المتابعة فورًا، ويمكنك دعوة ${mentor.mentorName} من جديد لاحقًا.`
          }
          confirmLabel={
            paused ? (confirm.kind === "privilege-off" ? "إيقاف" : "إنهاء") : confirm.kind === "privilege-off" || hasAnyPrivilege(privileges) ? "إرسال الطلب" : "إنهاء"
          }
          onConfirm={onConfirm}
          onClose={() => setConfirm(null)}
        />
      )}
    </li>
  );
};
