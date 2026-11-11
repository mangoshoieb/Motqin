"use client";

import { useState } from "react";
import Link from "next/link";
import { Info, Pencil, RotateCcw, UserMinus, UserPlus, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { useAuthKind } from "@/app/hooks/useAuthKind";
import { useAssistants, useRemoveAssistant } from "@/app/hooks/useTrackingTables";
import { useTrackingAccess } from "@/app/hooks/useTrackingAccess";
import { getApiErrorStatus } from "@/app/lib/api-error";
import { MAX_ASSISTANTS } from "@/app/constants/tracking-table.constants";
import { TrackingAssistant } from "@/app/types/tracking-table.types";
import UserAvatar from "@/components/ui/UserAvatar";
import { ConfirmDialog } from "@/components/ExecutionBoard/ConfirmDialog";
import { SignUpToUse } from "@/components/Settings/Mentors/SignUpToUse";
import { PermissionChips, SharedTables } from "@/components/Settings/Assistants/AssistantBits";
import { AssistantFormDialog } from "@/components/Settings/Assistants/AssistantFormDialog";

// The teacher's side: who helps with the tracking tables, what each may do,
// and on which tables.
const AssistantsSettingsPage = () => {
  const authKind = useAuthKind();
  const { isTeacher, isLoading: accessLoading } = useTrackingAccess();
  const { data: assistants, isLoading, isError, error, refetch } = useAssistants(isTeacher);
  const removeAssistant = useRemoveAssistant();

  const [editing, setEditing] = useState<TrackingAssistant | "new" | null>(null);
  const [removing, setRemoving] = useState<TrackingAssistant | null>(null);

  if (authKind === "guest") {
    return <SignUpToUse title="مساعدو الجداول" message="أنشئ حسابًا لتستخدم جداول المتابعة." />;
  }

  if (authKind === "none" || accessLoading || (isTeacher && isLoading)) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">جاري التحميل...</p>;
  }

  if (!isTeacher) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="mb-2 text-xl font-bold text-zinc-900 dark:text-zinc-100">مساعدو الجداول</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">إضافة المساعدين متاحة لحسابات المعلمين فقط.</p>
      </div>
    );
  }

  if (isError || !assistants) {
    // Servers from before assistants answer 404 here.
    const notYet = getApiErrorStatus(error) === 404;
    return (
      <div className="flex flex-col items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-red-600 dark:text-red-400">
          {notYet ? "إضافة المساعدين غير متاحة على الخادم بعد." : "تعذر تحميل المساعدين"}
        </p>
        {!notYet && (
          <button
            type="button"
            onClick={() => void refetch()}
            className="flex items-center gap-1.5 rounded-full bg-blue-600 dark:bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 dark:hover:bg-blue-800"
          >
            <RotateCcw size={14} />
            إعادة المحاولة
          </button>
        )}
      </div>
    );
  }

  const atLimit = assistants.length >= MAX_ASSISTANTS;

  const confirmRemove = () => {
    const assistant = removing;
    setRemoving(null);
    if (!assistant) return;
    removeAssistant.mutate(assistant.id, {
      onSuccess: () => toast.success(`تمت إزالة ${assistant.name} من المساعدين`),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {editing && (
        <AssistantFormDialog
          assistant={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onExisting={(phoneNumber) =>
            setEditing(assistants.find((a) => a.phoneNumber === phoneNumber) ?? null)
          }
        />
      )}
      {removing && (
        <ConfirmDialog
          title={`إزالة ${removing.name} من المساعدين؟`}
          description="يُلغى الوصول إلى كل الجداول المشاركة فورًا. ما أُضيف أو عُدّل من قبل يبقى في الجداول."
          confirmLabel="إزالة"
          onConfirm={confirmRemove}
          onClose={() => setRemoving(null)}
        />
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">مساعدو الجداول</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            من يساعدك في <Link href="/tracking-tables" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">جداول المتابعة</Link>، وما يمكن لكل مساعد فعله.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing("new")}
          disabled={atLimit}
          title={atLimit ? `الحد الأقصى ${MAX_ASSISTANTS} مساعدين` : undefined}
          className="flex items-center gap-1.5 rounded-full bg-blue-600 dark:bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 dark:hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <UserPlus size={16} />
          إضافة مساعد
        </button>
      </div>

      <div className="flex gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">
        <Info size={18} className="mt-0.5 shrink-0" />
        <p className="leading-relaxed">
          الجداول تبقى جداولك: حدودها واسمك في التقارير وباقة الرسائل كلها لك. أي تغيير في الصلاحيات يسري على
          المساعد من طلبه التالي.
        </p>
      </div>

      <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-bold text-zinc-900 dark:text-zinc-100">
            <UsersRound size={18} className="text-blue-600 dark:text-blue-400" />
            مساعدوك
          </h2>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {assistants.length} / {MAX_ASSISTANTS}
          </span>
        </div>

        {assistants.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            لا يوجد مساعدون بعد. أضف زميلًا أو سكرتيرًا برقم هاتفه ليساعدك في رصد الدرجات والحضور.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {assistants.map((assistant) => (
              <li
                key={assistant.id}
                className="flex flex-col gap-3 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <UserAvatar name={assistant.name} size={42} />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-zinc-900 dark:text-zinc-100">{assistant.name}</p>
                    <p dir="ltr" className="text-right text-xs text-zinc-500 dark:text-zinc-400">
                      {assistant.phoneNumber}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setEditing(assistant)}
                      className="flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      <Pencil size={13} />
                      الصلاحيات
                    </button>
                    <button
                      type="button"
                      onClick={() => setRemoving(assistant)}
                      aria-label={`إزالة ${assistant.name}`}
                      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                    >
                      <UserMinus size={13} />
                      إزالة
                    </button>
                  </div>
                </div>
                <PermissionChips permissions={assistant.permissions} />
                <SharedTables allTables={assistant.allTables} tables={assistant.tables} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default AssistantsSettingsPage;
