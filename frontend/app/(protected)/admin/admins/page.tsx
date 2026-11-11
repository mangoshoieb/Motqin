"use client";

import { useState } from "react";
import { Loader2, ShieldPlus, UserCog, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/app/lib/utils";
import Skeleton from "@/components/ui/Skeleton";
import { getApiErrorMessage } from "@/app/lib/api-error";
import { USER_ROLE_LABELS } from "@/app/constants/payment.constants";
import { useAuth } from "@/app/(public)/context/auth.context";
import { isAdmin } from "@/app/lib/payments";
import { useAdmins, useGrantAdmin, useRevokeAdmin, useSetUserRole } from "@/app/hooks/useAdminPayments";
import { AdminUser, UserRole } from "@/app/types/payment.types";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { AdminHeader, ErrorBox, Field } from "@/components/Admin/AdminHeader";
import { inputClass, primaryButton, secondaryButton } from "@/components/TrackingTables/ui";

const ROLES = Object.keys(USER_ROLE_LABELS) as UserRole[];

// Who can manage Motqin (Admin accounts only; a Manager gets 403).
export default function AdminAdminsPage() {
  const { user } = useAuth();
  const { data: admins, isLoading } = useAdmins(isAdmin(user));
  const grant = useGrantAdmin();
  const revoke = useRevokeAdmin();
  const setRole = useSetUserRole();
  const [phone, setPhone] = useState("");
  const [grantError, setGrantError] = useState<string | null>(null);
  const [roleUserId, setRoleUserId] = useState("");
  const [role, setRoleValue] = useState<UserRole>("Teacher");
  const [roleError, setRoleError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<AdminUser | null>(null);

  const submitGrant = () => {
    if (!phone.trim()) return;
    setGrantError(null);
    grant.mutate(phone.trim(), {
      onSuccess: () => {
        toast.success("تم منح صلاحية المدير");
        setPhone("");
      },
      onError: (err) => setGrantError(getApiErrorMessage(err)),
    });
  };

  const submitRole = () => {
    if (!roleUserId.trim()) return;
    setRoleError(null);
    setRole.mutate(
      { userId: roleUserId.trim(), role },
      {
        onSuccess: (result) => {
          toast.success(`أصبح دور ${result?.fullName ?? "المستخدم"}: ${USER_ROLE_LABELS[role]}`, {
            description: "يظهر الدور الجديد بعد تحديث المستخدم لتسجيل دخوله.",
          });
          setRoleUserId("");
        },
        onError: (err) => setRoleError(getApiErrorMessage(err)),
      },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <AdminHeader title="المديرون والأدوار" subtitle="منح صلاحية المدير وإزالتها، وتغيير دور أي مستخدم. جرّب ذلك على حسابات تجريبية فقط." />

      <div className="rounded-3xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="border-b border-zinc-100 px-6 py-4 font-bold text-zinc-900 dark:border-zinc-800 dark:text-zinc-100">المديرون</h2>
        {isLoading ? (
          <div className="p-6">
            <Skeleton className="h-10" />
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {admins?.map((a) => {
              const self = a.userId === user?.id;
              return (
                <li key={a.userId} className="flex flex-wrap items-center gap-3 px-6 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {a.fullName} {self && <span className="text-xs font-normal text-zinc-400">(أنت)</span>}
                    </p>
                    <p className="text-xs tabular-nums text-zinc-500" dir="ltr">
                      {a.phoneNumber}
                    </p>
                  </div>
                  <button type="button" onClick={() => setRoleUserId(a.userId)} disabled={self} className={cn(secondaryButton, "px-3 py-1.5")}>
                    <UserCog size={15} /> تغيير الدور
                  </button>
                  <button
                    type="button"
                    onClick={() => setRemoving(a)}
                    disabled={self || (admins?.length ?? 0) <= 1}
                    className={cn(secondaryButton, "px-3 py-1.5 text-rose-600 dark:text-rose-400")}
                  >
                    <UserMinus size={15} /> إزالة
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <form
          className="flex flex-wrap items-end gap-3 border-t border-zinc-100 px-6 py-4 dark:border-zinc-800"
          onSubmit={(e) => {
            e.preventDefault();
            submitGrant();
          }}
        >
          <div className="min-w-56 flex-1">
            <Field label="إضافة مدير برقم الهاتف" hint="حساب مسجل في متقن.">
              <input dir="ltr" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01xxxxxxxxx" className={inputClass} />
            </Field>
          </div>
          <button type="submit" disabled={!phone.trim() || grant.isPending} className={cn(primaryButton, "mb-5")}>
            {grant.isPending ? <Loader2 size={16} className="animate-spin" /> : <ShieldPlus size={16} />} منح الصلاحية
          </button>
          {grantError && (
            <div className="w-full">
              <ErrorBox message={grantError} />
            </div>
          )}
        </form>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="font-bold text-zinc-900 dark:text-zinc-100">تغيير دور مستخدم</h2>
        <p className="mt-1 text-sm text-zinc-500">
          يأخذ المستخدم دورًا واحدًا بالضبط. معرّف المستخدم موجود في قائمة المديرين، وفي سجل استخدام الكوبونات، وفي الحساب المربوط بالشريك.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_14rem_auto] sm:items-end">
          <Field label="معرّف المستخدم">
            <input dir="ltr" value={roleUserId} onChange={(e) => setRoleUserId(e.target.value)} placeholder="00000000-0000-0000-0000-000000000000" className={cn(inputClass, "font-mono text-xs")} />
          </Field>
          <Field label="الدور">
            <select value={role} onChange={(e) => setRoleValue(e.target.value as UserRole)} className={inputClass}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {USER_ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </Field>
          <button type="button" onClick={submitRole} disabled={!roleUserId.trim() || setRole.isPending} className={primaryButton}>
            {setRole.isPending && <Loader2 size={16} className="animate-spin" />} تغيير
          </button>
        </div>
        {roleError && (
          <div className="mt-3">
            <ErrorBox message={roleError} />
          </div>
        )}
      </div>

      {removing && (
        <ConfirmDialog
          title={`إزالة صلاحية المدير من ${removing.fullName}؟`}
          message="لن يستطيع فتح لوحة الإدارة بعد ذلك."
          confirmLabel="إزالة"
          cancelLabel="إلغاء"
          onCancel={() => setRemoving(null)}
          onConfirm={() => {
            revoke.mutate(removing.userId, { onSuccess: () => toast.success("تمت إزالة صلاحية المدير") });
            setRemoving(null);
          }}
        />
      )}
    </div>
  );
}
