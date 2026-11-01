"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { BarChart3, BellRing, ChevronRight, Lock, RotateCcw, ShieldOff, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { getCodedApiError } from "@/app/lib/api-error";
import {
  useApproveMenteeChange,
  useMentee,
  useRejectMenteeChange,
  useUnlinkMentee,
} from "@/app/hooks/useMentorship";
import { useAuthKind } from "@/app/hooks/useAuthKind";
import { awaitsApproval, toastMentorshipError } from "@/app/lib/mentorship";
import { PRIVILEGE_LABEL } from "@/app/constants/mentorship.constants";
import UserAvatar from "@/components/ui/UserAvatar";
import { ConfirmDialog } from "@/components/ExecutionBoard/ConfirmDialog";
import { PrivilegeChips, UnlockCodePanel } from "@/components/Settings/Mentees/MenteeBits";
import { WeekChart } from "@/components/Settings/Mentees/WeekChart";
import { MenteeBlocker } from "@/components/Settings/Mentees/MenteeBlocker";
import { SignUpToUse } from "@/components/Settings/Mentors/SignUpToUse";

const BackLink = () => (
  <Link
    href="/settings/mentees"
    className="flex w-fit items-center gap-1 text-sm font-semibold text-zinc-500 transition hover:text-blue-600 dark:text-zinc-400"
  >
    <ChevronRight size={16} />
    طلابي
  </Link>
);

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof BarChart3;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-100">
        <Icon size={18} className="text-blue-600 dark:text-blue-400" />
        {title}
      </h2>
      {children}
    </section>
  );
}

const NotShared = ({ children }: { children: React.ReactNode }) => (
  <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
    {children}
  </p>
);

const MenteeDetailPage = () => {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const authKind = useAuthKind();

  const { data: mentee, isLoading, isError, error, refetch } = useMentee(id);
  const approve = useApproveMenteeChange();
  const reject = useRejectMenteeChange();
  const unlink = useUnlinkMentee();
  const [confirmUnlink, setConfirmUnlink] = useState(false);

  if (authKind === "guest") {
    return <SignUpToUse title="طلابي" message="أنشئ حسابًا مجانيًا لتتابع الطلاب الذين يدعونك." />;
  }

  if (authKind === "none" || isLoading) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">جاري التحميل...</p>;
  }

  if (isError || !mentee) {
    const gone = getCodedApiError(error)?.code === "mentorship_not_found";
    return (
      <div className="flex flex-col gap-4">
        <BackLink />
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-red-600 dark:text-red-400">
            {gone ? "هذا الطالب لم يعد مرتبطًا بك." : "تعذر تحميل بيانات الطالب"}
          </p>
          {!gone && (
            <button
              type="button"
              onClick={() => void refetch()}
              className="flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <RotateCcw size={14} />
              إعادة المحاولة
            </button>
          )}
        </div>
      </div>
    );
  }

  const busy = approve.isPending || reject.isPending || unlink.isPending;

  const handleApprove = async () => {
    try {
      const result = await approve.mutateAsync(mentee.id);
      if (result === null) {
        toast.success(`انتهت متابعتك لـ ${mentee.studentName}`);
        router.replace("/settings/mentees");
      } else {
        toast.success("تمت الموافقة على الطلب");
      }
    } catch (err) {
      toastMentorshipError("تعذرت الموافقة", err);
    }
  };

  const handleReject = async () => {
    try {
      await reject.mutateAsync(mentee.id);
      toast.success("تم رفض الطلب، وبقيت الصلاحيات كما هي");
    } catch (err) {
      toastMentorshipError("تعذر رفض الطلب", err);
    }
  };

  const handleUnlink = async () => {
    setConfirmUnlink(false);
    try {
      await unlink.mutateAsync(mentee.id);
      toast.success(`انتهت متابعتك لـ ${mentee.studentName}`);
      router.replace("/settings/mentees");
    } catch (err) {
      toastMentorshipError("تعذر إنهاء المتابعة", err);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {confirmUnlink && (
        <ConfirmDialog
          title={`إنهاء متابعة ${mentee.studentName}؟`}
          description="تنتهي كل صلاحياتك فورًا، ومنها قفل الحجب إن كان معك."
          confirmLabel="إنهاء المتابعة"
          onConfirm={() => void handleUnlink()}
          onClose={() => setConfirmUnlink(false)}
        />
      )}

      <BackLink />

      {/* Header */}
      <div className="flex flex-wrap items-center gap-4">
        <UserAvatar name={mentee.studentName} photoUrl={mentee.studentPhotoUrl} size={56} />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{mentee.studentName}</h1>
          <div className="mt-1">
            <PrivilegeChips privileges={mentee} />
          </div>
        </div>
        <button
          type="button"
          onClick={() => setConfirmUnlink(true)}
          disabled={busy}
          className="flex items-center gap-1.5 rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
        >
          <UserMinus size={15} />
          إنهاء المتابعة
        </button>
      </div>

      {/* A change waiting for this mentor */}
      {awaitsApproval(mentee) && (
        <div className="flex flex-col gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-blue-950 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-100">
          <p className="flex items-center gap-2 font-bold">
            <BellRing size={18} />
            {mentee.endRequested
              ? `طلب من ${mentee.studentName}: إنهاء المتابعة`
              : `طلب من ${mentee.studentName}: إيقاف ${mentee.removalRequested
                  .map((name) => `«${PRIVILEGE_LABEL[name] ?? name}»`)
                  .join(" و")}`}
          </p>
          <p className="text-sm opacity-90">
            {mentee.endRequested
              ? "بالموافقة تنتهي المتابعة وكل صلاحياتها. بالرفض تبقى كما هي."
              : "بالموافقة تتوقف هذه الصلاحية. بالرفض تبقى كما هي."}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void handleApprove()}
              disabled={busy}
              className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {approve.isPending ? "جاري..." : "موافقة"}
            </button>
            <button
              type="button"
              onClick={() => void handleReject()}
              disabled={busy}
              className="rounded-full border border-blue-300 px-5 py-2 text-sm font-semibold text-blue-800 transition hover:bg-blue-100 disabled:opacity-50 dark:border-blue-800 dark:text-blue-200 dark:hover:bg-blue-900/40"
            >
              {reject.isPending ? "جاري..." : "رفض"}
            </button>
          </div>
        </div>
      )}

      {/* The unlock code, for the lock holder */}
      {mentee.unlockCode ? (
        <UnlockCodePanel
          code={mentee.unlockCode}
          expiresAt={mentee.unlockCodeExpiresAt}
          studentName={mentee.studentName}
        />
      ) : (
        mentee.canLockBlocker && (
          <p className="flex items-start gap-2 rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-200">
            <Lock size={16} className="mt-0.5 shrink-0" />
            معك قفل حجب {mentee.studentName}. حين يُطلب رمز فتح يظهر هنا، فتشاركه ليُدخَل في التطبيق.
          </p>
        )
      )}

      <Section icon={BarChart3} title="الأداء في آخر 7 أيام">
        {mentee.week ? (
          <WeekChart week={mentee.week} />
        ) : (
          <NotShared>لم تُشارَك بيانات الأداء معك.</NotShared>
        )}
      </Section>

      <Section icon={ShieldOff} title="منع المشتتات">
        {mentee.blocker ? (
          <MenteeBlocker blocker={mentee.blocker} />
        ) : (
          <NotShared>لم تُشارَك إعدادات الحجب معك.</NotShared>
        )}
      </Section>
    </div>
  );
};

export default MenteeDetailPage;
