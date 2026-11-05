"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut, Table2 } from "lucide-react";
import { toast } from "sonner";
import { useAuthKind } from "@/app/hooks/useAuthKind";
import { useLeaveTeacher } from "@/app/hooks/useTrackingTables";
import { useTrackingAccess } from "@/app/hooks/useTrackingAccess";
import { AssistingLink } from "@/app/types/tracking-table.types";
import UserAvatar from "@/components/ui/UserAvatar";
import { ConfirmDialog } from "@/components/ExecutionBoard/ConfirmDialog";
import { SignUpToUse } from "@/components/Settings/Mentors/SignUpToUse";
import { PermissionChips, SharedTables } from "@/components/Settings/Assistants/AssistantBits";

// The assistant's side: the teachers whose tracking tables this user helps
// with, and what each one allows.
const AssistingSettingsPage = () => {
  const authKind = useAuthKind();
  const { links, isLoading } = useTrackingAccess();
  const leaveTeacher = useLeaveTeacher();
  const [leaving, setLeaving] = useState<AssistingLink | null>(null);

  if (authKind === "guest") {
    return <SignUpToUse title="أساعد المعلمين" message="أنشئ حسابًا ليضيفك المعلمون مساعدًا في جداولهم." />;
  }

  if (authKind === "none" || isLoading) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">جاري التحميل...</p>;
  }

  const confirmLeave = () => {
    const link = leaving;
    setLeaving(null);
    if (!link) return;
    leaveTeacher.mutate(link.id, {
      onSuccess: () => toast.success(`توقفت عن مساعدة ${link.teacherName}`),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {leaving && (
        <ConfirmDialog
          title={`التوقف عن مساعدة ${leaving.teacherName}؟`}
          description="تختفي جداول هذا المعلم من قائمتك فورًا. لتعود، يجب أن يضيفك من جديد."
          confirmLabel="التوقف عن المساعدة"
          onConfirm={confirmLeave}
          onClose={() => setLeaving(null)}
        />
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">أساعد المعلمين</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            المعلمون الذين أضافوك مساعدًا في جداول المتابعة، وما يسمح به كل منهم.
          </p>
        </div>
        {links.length > 0 && (
          <Link
            href="/tracking-tables"
            className="flex items-center gap-1.5 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Table2 size={16} />
            جداول المتابعة
          </Link>
        )}
      </div>

      {links.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          لا تساعد أي معلم الآن. حين يضيفك معلم برقم هاتفك تظهر جداوله هنا وفي جداول المتابعة.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {links.map((link) => (
            <li
              key={link.id}
              className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex flex-wrap items-center gap-3">
                <UserAvatar name={link.teacherName} size={42} />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-zinc-900 dark:text-zinc-100">{link.teacherName}</p>
                  <p dir="ltr" className="text-right text-xs text-zinc-500 dark:text-zinc-400">
                    {link.teacherPhone}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLeaving(link)}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  <LogOut size={13} />
                  التوقف عن المساعدة
                </button>
              </div>
              <PermissionChips permissions={link.permissions} />
              <SharedTables allTables={link.allTables} tables={link.tables} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AssistingSettingsPage;
