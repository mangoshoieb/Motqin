"use client";

import { useState } from "react";
import Link from "next/link";
import { BellRing, Check, ChevronLeft, GraduationCap, Inbox, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { useAuthKind } from "@/app/hooks/useAuthKind";
import {
  useAcceptMentorRequest,
  useDeclineMentorRequest,
  useIncomingMentorRequests,
  useMentees,
} from "@/app/hooks/useMentorship";
import {
  awaitsApproval,
  formatPlans,
  formatSessions,
  toastMentorshipError,
} from "@/app/lib/mentorship";
import { formatUsage } from "@/app/constants/focus.constants";
import UserAvatar from "@/components/ui/UserAvatar";
import { PrivilegeChips, UnlockCodePanel } from "@/components/Settings/Mentees/MenteeBits";
import { SignUpToUse } from "@/components/Settings/Mentors/SignUpToUse";

const MenteesSettingsPage = () => {
  const authKind = useAuthKind();
  const incoming = useIncomingMentorRequests();
  const mentees = useMentees();
  const accept = useAcceptMentorRequest();
  const decline = useDeclineMentorRequest();
  const [busyId, setBusyId] = useState<number | null>(null);

  if (authKind === "guest") {
    return (
      <SignUpToUse
        title="طلابي"
        message="أنشئ حسابًا مجانيًا ليدعوك الطلاب كمشرف برقم هاتفك، وتتابع ما يشاركونه معك."
      />
    );
  }

  if (authKind === "none" || incoming.isLoading || mentees.isLoading) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">جاري التحميل...</p>;
  }

  if (mentees.isError || !mentees.data) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-red-600 dark:text-red-400">تعذر تحميل طلابك</p>
        <button
          type="button"
          onClick={() => void mentees.refetch()}
          className="flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <RotateCcw size={14} />
          إعادة المحاولة
        </button>
      </div>
    );
  }

  const requests = incoming.data ?? [];

  const answer = async (id: number, studentName: string, accepted: boolean) => {
    setBusyId(id);
    try {
      if (accepted) {
        await accept.mutateAsync(id);
        toast.success(`أصبحت مشرفًا لـ ${studentName}`);
      } else {
        await decline.mutateAsync(id);
        toast.success("تم رفض الطلب");
      }
    } catch (error) {
      toastMentorshipError(accepted ? "تعذر قبول الطلب" : "تعذر رفض الطلب", error);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">طلابي</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          الطلاب الذين اختاروك مشرفًا. ترى فقط ما يشاركونه معك.
        </p>
      </div>

      {/* Requests waiting for an answer */}
      {requests.length > 0 && (
        <section className="flex flex-col gap-4 rounded-2xl border border-blue-200 bg-white p-6 dark:border-blue-900/60 dark:bg-zinc-900">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
              <Inbox size={20} />
            </span>
            <div className="min-w-0">
              <h2 className="font-bold text-zinc-900 dark:text-zinc-100">طلبات إشراف جديدة</h2>
              <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                بعد القبول لا ترى شيئًا حتى يختار الطالب ما يشاركه معك.
              </p>
            </div>
          </div>

          <ul className="flex flex-col gap-2">
            {requests.map((request) => (
              <li
                key={request.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800"
              >
                <UserAvatar name={request.studentName} photoUrl={request.studentPhotoUrl} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">{request.studentName}</p>
                  <p dir="ltr" className="text-right text-xs text-zinc-500 dark:text-zinc-400">
                    {request.studentPhone}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void answer(request.id, request.studentName, false)}
                    disabled={busyId !== null}
                    className="flex items-center gap-1 rounded-full border border-zinc-200 px-4 py-2 text-sm text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    <X size={15} />
                    رفض
                  </button>
                  <button
                    type="button"
                    onClick={() => void answer(request.id, request.studentName, true)}
                    disabled={busyId !== null}
                    className="flex items-center gap-1 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Check size={15} />
                    {busyId === request.id ? "جاري..." : "قبول"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Students */}
      <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300">
            <GraduationCap size={20} />
          </span>
          <div className="min-w-0">
            <h2 className="font-bold text-zinc-900 dark:text-zinc-100">الطلاب الذين تتابعهم</h2>
            <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              تتحدّث القائمة تلقائيًا، فيظهر رمز فتح الحجب فور طلبه.
            </p>
          </div>
        </div>

        {mentees.data.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            لا يتابعك أي طالب بعد. حين يدعوك طالب برقم هاتفك تظهر دعوته هنا.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {mentees.data.map((mentee) => (
              <li key={mentee.id} className="flex flex-col gap-3">
                <Link
                  href={`/settings/mentees/${mentee.id}`}
                  className="group flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3 transition hover:border-blue-300 hover:bg-blue-50/40 dark:border-zinc-800 dark:hover:border-blue-800 dark:hover:bg-blue-950/20"
                >
                  <UserAvatar name={mentee.studentName} photoUrl={mentee.studentPhotoUrl} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-zinc-900 dark:text-zinc-100">{mentee.studentName}</p>
                      {awaitsApproval(mentee) && (
                        <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                          <BellRing size={12} />
                          طلب بانتظار موافقتك
                        </span>
                      )}
                    </div>
                    <div className="mt-1">
                      <PrivilegeChips privileges={mentee} />
                    </div>
                    {mentee.today && (
                      <p className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                        اليوم: {formatPlans(mentee.today.completedPlansCount)} ·{" "}
                        {formatSessions(mentee.today.completedSessionsCount)} ·{" "}
                        {formatUsage(mentee.today.productiveMinutes)} مذاكرة
                      </p>
                    )}
                  </div>
                  <ChevronLeft
                    size={18}
                    className="shrink-0 text-zinc-400 transition group-hover:-translate-x-0.5 group-hover:text-blue-600"
                  />
                </Link>
                {mentee.unlockCode && (
                  <UnlockCodePanel
                    compact
                    code={mentee.unlockCode}
                    expiresAt={mentee.unlockCodeExpiresAt}
                    studentName={mentee.studentName}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default MenteesSettingsPage;
