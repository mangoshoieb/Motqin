"use client";

import { useState } from "react";
import { FileCog, Link2, MoreHorizontal, Pencil, Plus, SlidersHorizontal, Ban } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/app/lib/utils";
import Skeleton from "@/components/ui/Skeleton";
import { AUDIENCE_LABELS } from "@/app/constants/payment.constants";
import { bundleName, durationLabel, formatEgp } from "@/app/lib/payments";
import { useAdminBundles, useAdminPartners, useDeactivateBundle } from "@/app/hooks/useAdminPayments";
import { Bundle, BundleAudience } from "@/app/types/payment.types";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { AdminHeader, Chip } from "@/components/Admin/AdminHeader";
import { BundleFeaturesDialog, BundleInfoDialog, CatalogueDialog } from "@/components/Admin/BundleDialogs";
import { Dropdown, Segmented, primaryButton, secondaryButton } from "@/components/TrackingTables/ui";

type AudienceFilter = "all" | BundleAudience | "system";
type ActiveFilter = "active" | "retired" | "all";

type DialogState =
  | { kind: "info"; bundle?: Bundle }
  | { kind: "features"; bundle: Bundle }
  | { kind: "retire"; bundle: Bundle }
  | { kind: "catalogue" }
  | null;

export default function AdminBundlesPage() {
  const { data: bundles, isLoading } = useAdminBundles();
  const { data: partners = [] } = useAdminPartners();
  const deactivate = useDeactivateBundle();
  const [audience, setAudience] = useState<AudienceFilter>("all");
  const [active, setActive] = useState<ActiveFilter>("active");
  const [dialog, setDialog] = useState<DialogState>(null);

  const free = bundles?.find((b) => b.kind === "Free");
  const shown = (bundles ?? []).filter((b) => {
    if (audience === "system" ? b.kind === "Paid" : audience !== "all" && b.audience !== audience) return false;
    if (active === "active" && !b.isActive) return false;
    if (active === "retired" && b.isActive) return false;
    return true;
  });

  // Partner offers are hidden from the list and opened by this link.
  const copyLink = async (bundle: Bundle) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/subscription/checkout?bundleId=${bundle.id}`);
      toast.success("تم نسخ رابط الباقة");
    } catch {
      toast.error("تعذر النسخ");
    }
  };

  return (
    <div>
      <AdminHeader
        title="الباقات"
        subtitle="تعديل باقة مدفوعة يصل للمشترين الجدد فقط. باقات الملف (لها كود) تُعدّل من ملف الباقات."
        actions={
          <>
            <button type="button" onClick={() => setDialog({ kind: "catalogue" })} className={secondaryButton}>
              <FileCog size={17} /> ملف الباقات
            </button>
            <button type="button" onClick={() => setDialog({ kind: "info" })} disabled={!free} className={primaryButton}>
              <Plus size={17} /> باقة جديدة
            </button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <Segmented<AudienceFilter>
          value={audience}
          onChange={setAudience}
          options={[
            { value: "all", label: "الكل" },
            { value: "Student", label: "طلاب" },
            { value: "Teacher", label: "مدرسون" },
            { value: "Mentor", label: "أولياء أمور" },
            { value: "system", label: "النظام" },
          ]}
        />
        <Segmented<ActiveFilter>
          value={active}
          onChange={setActive}
          options={[
            { value: "active", label: "المتاحة" },
            { value: "retired", label: "الموقوفة" },
            { value: "all", label: "الكل" },
          ]}
        />
      </div>

      <div className="overflow-x-auto rounded-3xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-xs text-zinc-500 dark:border-zinc-800">
              <th className="px-5 py-3 text-start font-semibold">الباقة</th>
              <th className="px-3 py-3 text-start font-semibold">الكود</th>
              <th className="px-3 py-3 text-start font-semibold">لمن</th>
              <th className="px-3 py-3 text-end font-semibold">السعر</th>
              <th className="px-3 py-3 text-start font-semibold">المدة</th>
              <th className="px-3 py-3 text-start font-semibold">الحالة</th>
              <th className="w-12" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {isLoading &&
              [0, 1, 2, 3].map((i) => (
                <tr key={i}>
                  <td colSpan={7} className="px-5 py-3">
                    <Skeleton className="h-6" />
                  </td>
                </tr>
              ))}
            {shown.map((bundle) => {
              const partner = partners.find((p) => p.id === bundle.partnerId);
              return (
                <tr key={bundle.id} className={cn(!bundle.isActive && "opacity-60")}>
                  <td className="px-5 py-3">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">{bundleName(bundle)}</p>
                    <p className="text-xs text-zinc-500" dir="auto">
                      {bundle.title} · #{bundle.id}
                      {partner && ` · ${partner.name}`}
                    </p>
                  </td>
                  <td className="px-3 py-3 font-mono text-xs" dir="ltr">
                    {bundle.code ?? "—"}
                  </td>
                  <td className="px-3 py-3 text-zinc-600 dark:text-zinc-300">
                    {bundle.audience ? AUDIENCE_LABELS[bundle.audience] : bundle.kind === "Paid" ? "—" : "الكل"}
                  </td>
                  <td className="px-3 py-3 text-end tabular-nums">{bundle.kind === "Paid" ? formatEgp(bundle.price) : "مجانًا"}</td>
                  <td className="px-3 py-3 text-zinc-600 dark:text-zinc-300">{bundle.kind === "Paid" ? durationLabel(bundle) : bundle.quotaPeriod === "Lifetime" ? "مدى التجربة" : "شهريًا"}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {bundle.kind !== "Paid" && <Chip tone="blue">نظام</Chip>}
                      {bundle.isActive ? <Chip tone="green">متاحة</Chip> : <Chip>موقوفة</Chip>}
                      {bundle.isHidden && bundle.kind === "Paid" && <Chip tone="amber">مخفية</Chip>}
                      {bundle.customizable && <Chip tone="blue">على كيفك</Chip>}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <Dropdown
                      align="end"
                      trigger={
                        <button type="button" aria-label="خيارات" className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800">
                          <MoreHorizontal size={18} />
                        </button>
                      }
                      items={[
                        { label: "تعديل البيانات", Icon: Pencil, onSelect: () => setDialog({ kind: "info", bundle }) },
                        { label: "تعديل الحدود", Icon: SlidersHorizontal, onSelect: () => setDialog({ kind: "features", bundle }) },
                        ...(bundle.kind === "Paid"
                          ? [
                              { label: "نسخ رابط الباقة", Icon: Link2, onSelect: () => void copyLink(bundle) },
                              {
                                label: "إيقاف البيع",
                                Icon: Ban,
                                danger: true,
                                separatorBefore: true,
                                disabled: !bundle.isActive,
                                onSelect: () => setDialog({ kind: "retire", bundle }),
                              },
                            ]
                          : []),
                      ]}
                    />
                  </td>
                </tr>
              );
            })}
            {!isLoading && shown.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-zinc-500">
                  لا توجد باقات بهذه التصفية.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {dialog?.kind === "info" && <BundleInfoDialog bundle={dialog.bundle} freeBundle={free} onClose={() => setDialog(null)} />}
      {dialog?.kind === "features" && <BundleFeaturesDialog bundle={dialog.bundle} onClose={() => setDialog(null)} />}
      {dialog?.kind === "catalogue" && <CatalogueDialog onClose={() => setDialog(null)} />}
      {dialog?.kind === "retire" && (
        <ConfirmDialog
          title={`إيقاف بيع ${bundleName(dialog.bundle)}؟`}
          message="لن يستطيع أحد شراءها بعد الآن، والمشتركون الحاليون يحتفظون بها حتى تنتهي."
          confirmLabel="إيقاف البيع"
          cancelLabel="إلغاء"
          onCancel={() => setDialog(null)}
          onConfirm={() => {
            deactivate.mutate(dialog.bundle.id, { onSuccess: () => toast.success("تم إيقاف بيع الباقة") });
            setDialog(null);
          }}
        />
      )}
    </div>
  );
}
