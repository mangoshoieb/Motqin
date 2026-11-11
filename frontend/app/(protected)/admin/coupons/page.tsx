"use client";

import { useState } from "react";
import { BarChart3, ChevronLeft, ChevronRight, Copy, Layers, MoreHorizontal, Pencil, Plus, Power, Ticket, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/app/lib/utils";
import Skeleton from "@/components/ui/Skeleton";
import { toastApiError } from "@/app/lib/api-error";
import { COUPONS_PAGE_SIZE } from "@/app/constants/payment.constants";
import { formatDay } from "@/app/lib/payments";
import { useAdminCoupons, useAdminPartners, useSaveCoupon } from "@/app/hooks/useAdminPayments";
import { Coupon } from "@/app/types/payment.types";
import { AdminHeader, Chip } from "@/components/Admin/AdminHeader";
import { BatchDialog, CouponDialog, UsageDialog } from "@/components/Admin/CouponDialogs";
import { Dropdown, Segmented, ghostButton, inputClass, primaryButton, secondaryButton } from "@/components/TrackingTables/ui";

type ActiveFilter = "all" | "active" | "inactive";

type DialogState =
  | { kind: "coupon"; coupon?: Coupon }
  | { kind: "batch" }
  | { kind: "usage"; usage: "coupon" | "batch"; id: number; title: string }
  | null;

export default function AdminCouponsPage() {
  const [active, setActive] = useState<ActiveFilter>("all");
  const [partnerId, setPartnerId] = useState("");
  const [batchId, setBatchId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<DialogState>(null);
  const { data: partners = [] } = useAdminPartners();
  const save = useSaveCoupon();

  const { data, isLoading, isFetching } = useAdminCoupons({
    ...(active !== "all" ? { active: active === "active" } : {}),
    ...(partnerId ? { partnerId: Number(partnerId) } : {}),
    ...(batchId ? { batchId } : {}),
    page,
    pageSize: COUPONS_PAGE_SIZE,
  });
  const pageCount = Math.max(1, Math.ceil((data?.total ?? 0) / COUPONS_PAGE_SIZE));

  // Turning a coupon off means sending its current values with isActive flipped.
  const toggle = (coupon: Coupon) =>
    save.mutate(
      {
        id: coupon.id,
        body: {
          discountPercent: coupon.discountPercent,
          maxRedemptions: coupon.maxRedemptions,
          validFrom: coupon.validFrom,
          validUntil: coupon.validUntil,
          firstPurchaseOnly: coupon.firstPurchaseOnly,
          isActive: !coupon.isActive,
          partnerId: coupon.partnerId,
          bundleIds: coupon.bundleIds,
          // Left out, it would go back to true.
          allowOnCustomized: coupon.allowOnCustomized ?? true,
        },
      },
      {
        onSuccess: () => toast.success(coupon.isActive ? "تم إيقاف الكوبون" : "تم تفعيل الكوبون"),
        onError: (error) => toastApiError("تعذر تغيير حالة الكوبون", error),
      },
    );

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("تم نسخ الكود");
    } catch {
      toast.error("تعذر النسخ");
    }
  };

  const resetPage = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setPage(1);
  };

  return (
    <div>
      <AdminHeader
        title="الكوبونات والقسائم"
        subtitle="الأكواد تُحفظ بدون شرطات ومسافات وبحروف كبيرة. لا يُحذف شيء؛ أوقف الكوبون بدلًا من ذلك."
        actions={
          <>
            <button type="button" onClick={() => setDialog({ kind: "batch" })} className={secondaryButton}>
              <Layers size={17} /> دفعة قسائم
            </button>
            <button type="button" onClick={() => setDialog({ kind: "coupon" })} className={primaryButton}>
              <Plus size={17} /> كوبون جديد
            </button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Segmented<ActiveFilter>
          value={active}
          onChange={resetPage(setActive)}
          options={[
            { value: "all", label: "الكل" },
            { value: "active", label: "المفعّلة" },
            { value: "inactive", label: "الموقوفة" },
          ]}
        />
        <select value={partnerId} onChange={(e) => resetPage(setPartnerId)(e.target.value)} className={cn(inputClass, "w-auto py-2")}>
          <option value="">كل الشركاء</option>
          {partners.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {batchId && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 py-1 pe-1 ps-3 text-xs font-semibold text-blue-800 dark:bg-blue-500/15 dark:text-blue-300">
            قسائم الدفعة #{batchId}
            <button
              type="button"
              onClick={() => setDialog({ kind: "usage", usage: "batch", id: batchId, title: `استخدام الدفعة #${batchId}` })}
              className="rounded-full px-2 py-0.5 hover:bg-black/10"
            >
              الاستخدام
            </button>
            <button type="button" aria-label="إلغاء التصفية" onClick={() => resetPage(setBatchId)(null)} className="rounded-full p-0.5 hover:bg-black/10">
              <X size={13} />
            </button>
          </span>
        )}
      </div>

      <div className={cn("overflow-x-auto rounded-3xl border border-zinc-200 bg-white transition-opacity dark:border-zinc-800 dark:bg-zinc-900", isFetching && !isLoading && "opacity-70")}>
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-xs text-zinc-500 dark:border-zinc-800">
              <th className="px-5 py-3 text-start font-semibold">الكود</th>
              <th className="px-3 py-3 text-start font-semibold">الخصم</th>
              <th className="px-3 py-3 text-start font-semibold">الاستخدام</th>
              <th className="px-3 py-3 text-start font-semibold">الصلاحية</th>
              <th className="px-3 py-3 text-start font-semibold">ينطبق على</th>
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
            {data?.items.map((c) => {
              const partner = partners.find((p) => p.id === c.partnerId);
              return (
                <tr key={c.id} className={cn(!c.isActive && "opacity-60")}>
                  <td className="px-5 py-3">
                    <button type="button" onClick={() => void copy(c.code)} className="group flex items-center gap-1.5 font-mono text-sm font-bold" dir="ltr">
                      {c.code}
                      <Copy size={13} className="text-zinc-300 group-hover:text-zinc-600" />
                    </button>
                    {partner && <p className="text-xs text-zinc-500">{partner.name}</p>}
                  </td>
                  <td className="px-3 py-3 font-bold tabular-nums">{c.discountPercent}٪</td>
                  <td dir="ltr" className="px-3 py-3 text-end tabular-nums text-zinc-600 dark:text-zinc-300">
                    {c.redemptionCount}
                    {c.maxRedemptions ? ` / ${c.maxRedemptions}` : ""}
                  </td>
                  <td className="px-3 py-3 text-xs text-zinc-600 dark:text-zinc-300">
                    {c.validFrom || c.validUntil
                      ? `${c.validFrom ? formatDay(c.validFrom) : "الآن"} — ${c.validUntil ? formatDay(c.validUntil) : "بلا نهاية"}`
                      : "دائمًا"}
                  </td>
                  <td className="px-3 py-3 text-xs text-zinc-600 dark:text-zinc-300">
                    {c.bundleIds.length ? `${c.bundleIds.length} باقة` : "كل الباقات"}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {c.isActive ? <Chip tone="green">مفعّل</Chip> : <Chip>موقوف</Chip>}
                      {c.firstPurchaseOnly && <Chip tone="blue">أول شراء</Chip>}
                      {c.allowOnCustomized === false && <Chip tone="rose">ليس للباقات المخصصة</Chip>}
                      {c.batchId && (
                        <button type="button" onClick={() => resetPage(setBatchId)(c.batchId)}>
                          <Chip tone="amber">
                            <Ticket size={11} className="me-1" /> دفعة #{c.batchId}
                          </Chip>
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <Dropdown
                      align="end"
                      trigger={
                        <button type="button" aria-label="خيارات" className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:text-zinc-200 dark:hover:bg-zinc-800">
                          <MoreHorizontal size={18} />
                        </button>
                      }
                      items={[
                        { label: "تعديل", Icon: Pencil, onSelect: () => setDialog({ kind: "coupon", coupon: c }) },
                        {
                          label: "من استخدمه",
                          Icon: BarChart3,
                          onSelect: () => setDialog({ kind: "usage", usage: "coupon", id: c.id, title: `استخدام ${c.code}` }),
                        },
                        {
                          label: c.isActive ? "إيقاف" : "تفعيل",
                          Icon: Power,
                          danger: c.isActive,
                          separatorBefore: true,
                          onSelect: () => toggle(c),
                        },
                      ]}
                    />
                  </td>
                </tr>
              );
            })}
            {!isLoading && data?.items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-zinc-500">
                  لا توجد كوبونات بهذه التصفية.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <button type="button" onClick={() => setPage((p) => p - 1)} disabled={page <= 1} className={ghostButton}>
            <ChevronRight size={16} /> الأحدث
          </button>
          <span className="tabular-nums text-zinc-500">
            {page} / {pageCount} · {data?.total} كوبون
          </span>
          <button type="button" onClick={() => setPage((p) => p + 1)} disabled={page >= pageCount} className={ghostButton}>
            الأقدم <ChevronLeft size={16} />
          </button>
        </div>
      )}

      {dialog?.kind === "coupon" && <CouponDialog coupon={dialog.coupon} onClose={() => setDialog(null)} />}
      {dialog?.kind === "batch" && <BatchDialog onClose={() => setDialog(null)} />}
      {dialog?.kind === "usage" && (
        <UsageDialog kind={dialog.usage} id={dialog.id} title={dialog.title} onClose={() => setDialog(null)} />
      )}
    </div>
  );
}
