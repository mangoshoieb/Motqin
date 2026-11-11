"use client";

import { useState } from "react";
import { BarChart3, Link2, Loader2, MoreHorizontal, Pencil, Plus, Power, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/app/lib/utils";
import Skeleton from "@/components/ui/Skeleton";
import { getApiErrorMessage, toastApiError } from "@/app/lib/api-error";
import { formatMoney } from "@/app/lib/payments";
import { useAdminPartners, useLinkPartnerUser, usePartnerReport, useSavePartner } from "@/app/hooks/useAdminPayments";
import { Partner, PartnerType, SavePartnerBody } from "@/app/types/payment.types";
import { AdminHeader, Chip, ErrorBox, Field } from "@/components/Admin/AdminHeader";
import { PartnerReportView, rangeDates, type SalesRange } from "@/components/Payments/PartnerReportView";
import { Dropdown, Modal, Segmented, inputClass, primaryButton, secondaryButton } from "@/components/TrackingTables/ui";

type DialogState =
  | { kind: "edit"; partner?: Partner }
  | { kind: "link"; partner: Partner }
  | { kind: "report"; partner: Partner }
  | null;

const bodyOf = (p: Partner): SavePartnerBody => ({
  name: p.name,
  type: p.type,
  contactPhone: p.contactPhone,
  commissionPercent: p.commissionPercent,
  isActive: p.isActive,
});

export default function AdminPartnersPage() {
  const { data: partners, isLoading } = useAdminPartners();
  const save = useSavePartner();
  const [dialog, setDialog] = useState<DialogState>(null);

  const toggle = (partner: Partner) =>
    save.mutate(
      { id: partner.id, body: { ...bodyOf(partner), isActive: !partner.isActive } },
      {
        onSuccess: () => toast.success(partner.isActive ? "تم إيقاف الشريك" : "تم تفعيل الشريك"),
        onError: (error) => toastApiError("تعذر تغيير حالة الشريك", error),
      },
    );

  return (
    <div>
      <AdminHeader
        title="الشركاء"
        subtitle="مدرسون وسناتر يبيعون متقن ويحصلون على عمولة من مبيعاتهم بكوبوناتهم أو باقاتهم."
        actions={
          <button type="button" onClick={() => setDialog({ kind: "edit" })} className={primaryButton}>
            <Plus size={17} /> شريك جديد
          </button>
        }
      />

      <div className="overflow-x-auto rounded-3xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-xs text-zinc-500 dark:border-zinc-800">
              <th className="px-5 py-3 text-start font-semibold">الشريك</th>
              <th className="px-3 py-3 text-start font-semibold">النوع</th>
              <th className="px-3 py-3 text-start font-semibold">الهاتف</th>
              <th className="px-3 py-3 text-start font-semibold">العمولة</th>
              <th className="px-3 py-3 text-start font-semibold">الحساب</th>
              <th className="px-3 py-3 text-start font-semibold">الحالة</th>
              <th className="w-12" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {isLoading &&
              [0, 1, 2].map((i) => (
                <tr key={i}>
                  <td colSpan={7} className="px-5 py-3">
                    <Skeleton className="h-6" />
                  </td>
                </tr>
              ))}
            {partners?.map((p) => (
              <tr key={p.id} className={cn(!p.isActive && "opacity-60")}>
                <td className="px-5 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                  {p.name} <span className="text-xs font-normal text-zinc-400">#{p.id}</span>
                </td>
                <td className="px-3 py-3 text-zinc-600 dark:text-zinc-300">{p.type === "Center" ? "سنتر" : "مدرس"}</td>
                <td className="px-3 py-3 tabular-nums" dir="ltr">
                  {p.contactPhone ?? "—"}
                </td>
                <td className="px-3 py-3 font-bold tabular-nums">{formatMoney(p.commissionPercent)}٪</td>
                <td className="px-3 py-3">{p.linkedUserId ? <Chip tone="blue">مربوط</Chip> : <Chip>غير مربوط</Chip>}</td>
                <td className="px-3 py-3">{p.isActive ? <Chip tone="green">نشط</Chip> : <Chip>موقوف</Chip>}</td>
                <td className="px-3 py-3">
                  <Dropdown
                    align="end"
                    trigger={
                      <button type="button" aria-label="خيارات" className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:text-zinc-200 dark:hover:bg-zinc-800">
                        <MoreHorizontal size={18} />
                      </button>
                    }
                    items={[
                      { label: "تقرير المبيعات", Icon: BarChart3, onSelect: () => setDialog({ kind: "report", partner: p }) },
                      { label: "تعديل", Icon: Pencil, onSelect: () => setDialog({ kind: "edit", partner: p }) },
                      { label: p.linkedUserId ? "تغيير الحساب المربوط" : "ربط حساب", Icon: Link2, onSelect: () => setDialog({ kind: "link", partner: p }) },
                      { label: p.isActive ? "إيقاف" : "تفعيل", Icon: Power, danger: p.isActive, separatorBefore: true, onSelect: () => toggle(p) },
                    ]}
                  />
                </td>
              </tr>
            ))}
            {!isLoading && partners?.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-zinc-500">
                  لا يوجد شركاء بعد.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {dialog?.kind === "edit" && <PartnerDialog partner={dialog.partner} onClose={() => setDialog(null)} />}
      {dialog?.kind === "link" && <LinkDialog partner={dialog.partner} onClose={() => setDialog(null)} />}
      {dialog?.kind === "report" && <ReportDialog partner={dialog.partner} onClose={() => setDialog(null)} />}
    </div>
  );
}

function PartnerDialog({ partner, onClose }: { partner?: Partner; onClose: () => void }) {
  const [name, setName] = useState(partner?.name ?? "");
  const [type, setType] = useState<PartnerType>(partner?.type ?? "Teacher");
  const [phone, setPhone] = useState(partner?.contactPhone ?? "");
  const [commission, setCommission] = useState(partner ? String(partner.commissionPercent) : "10");
  const [isActive, setIsActive] = useState(partner?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);
  const save = useSavePartner();

  const commissionNum = Number(commission);
  const problem =
    name.trim().length < 2
      ? "الاسم من 2 إلى 150 حرفًا"
      : !(commission.trim() !== "" && commissionNum >= 0 && commissionNum <= 100)
        ? "العمولة من 0 إلى 100٪"
        : null;

  const submit = () => {
    if (problem || save.isPending) return;
    setError(null);
    save.mutate(
      {
        id: partner?.id,
        body: { name: name.trim(), type, contactPhone: phone.trim() || null, commissionPercent: commissionNum, isActive },
      },
      {
        onSuccess: () => {
          toast.success(partner ? "تم حفظ الشريك. النسبة الجديدة تنطبق على المبيعات القادمة فقط." : "تم إنشاء الشريك");
          onClose();
        },
        onError: (err) => setError(getApiErrorMessage(err)),
      },
    );
  };

  return (
    <Modal
      title={partner ? `تعديل ${partner.name}` : "شريك جديد"}
      description={partner ? undefined : "الشريك سجل أولاً؛ ربط حسابه في متقن خطوة بعدها."}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={cn(secondaryButton, "flex-1")}>
            إلغاء
          </button>
          <button type="button" onClick={submit} disabled={!!problem || save.isPending} className={cn(primaryButton, "flex-1")}>
            {save.isPending ? "جارٍ الحفظ..." : "حفظ"}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="الاسم">
          <input dir="auto" value={name} maxLength={150} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </Field>
        <Field label="النوع">
          <Segmented<PartnerType>
            value={type}
            onChange={setType}
            options={[
              { value: "Teacher", label: "مدرس" },
              { value: "Center", label: "سنتر" },
            ]}
          />
        </Field>
        <Field label="هاتف التواصل (اختياري)">
          <input dir="ltr" inputMode="tel" value={phone} maxLength={20} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
        </Field>
        <Field label="العمولة (٪)" hint={partner ? "النسبة الجديدة تنطبق على المبيعات القادمة فقط." : undefined}>
          <input dir="ltr" inputMode="decimal" value={commission} onChange={(e) => setCommission(e.target.value)} className={inputClass} />
        </Field>
        <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          نشط (الشريك الموقوف لا يحصل على عمولة من المبيعات الجديدة)
        </label>
        {problem && <p className="text-sm text-amber-700 dark:text-amber-400">{problem}</p>}
        {error && <ErrorBox message={error} />}
      </div>
    </Modal>
  );
}

function LinkDialog({ partner, onClose }: { partner: Partner; onClose: () => void }) {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const link = useLinkPartnerUser();

  const submit = () => {
    if (!phone.trim() || link.isPending) return;
    setError(null);
    link.mutate(
      { id: partner.id, phoneNumber: phone.trim() },
      {
        onSuccess: () => {
          toast.success("تم ربط الحساب");
          onClose();
        },
        onError: (err) => setError(getApiErrorMessage(err)),
      },
    );
  };

  return (
    <Modal
      title={`ربط حساب ${partner.name}`}
      description="ليفتح الشريك لوحة مبيعاته من حسابه."
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={cn(secondaryButton, "flex-1")}>
            إلغاء
          </button>
          <button type="button" onClick={submit} disabled={!phone.trim() || link.isPending} className={cn(primaryButton, "flex-1")}>
            {link.isPending ? <Loader2 size={16} className="animate-spin" /> : <UserCheck size={16} />} ربط
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="رقم هاتف الحساب" hint="حساب مسجل في متقن (ليس زائرًا).">
          <input dir="ltr" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01xxxxxxxxx" className={inputClass} />
        </Field>
        <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          سيصبح هذا الحساب حساب مدرس إذا كان دوره أقل من ذلك. حسابات المديرين تحتفظ بدورها.
        </p>
        {error && <ErrorBox message={error} />}
      </div>
    </Modal>
  );
}

function ReportDialog({ partner, onClose }: { partner: Partner; onClose: () => void }) {
  const [range, setRange] = useState<SalesRange>("month");
  const { from, to } = rangeDates(range);
  const { data: report, isFetching } = usePartnerReport(partner.id, from, to);

  return (
    <Modal title={`مبيعات ${partner.name}`} onClose={onClose} className="max-w-5xl">
      {report ? (
        <PartnerReportView report={report} range={range} onRangeChange={setRange} loading={isFetching} />
      ) : (
        <Loader2 className="mx-auto animate-spin text-zinc-400" />
      )}
    </Modal>
  );
}
