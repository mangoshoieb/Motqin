"use client";

import { useState } from "react";
import { Copy, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/app/lib/utils";
import { getApiErrorMessage } from "@/app/lib/api-error";
import { AUDIENCE_LABELS } from "@/app/constants/payment.constants";
import {
  arabicPlanTitle,
  bundleName,
  downloadText,
  formatDateTime,
  formatEgp,
  fromLocalInput,
  toLocalInput,
} from "@/app/lib/payments";
import {
  useAdminBundles,
  useAdminPartners,
  useCouponUsage,
  useCreateBatch,
  useSaveCoupon,
} from "@/app/hooks/useAdminPayments";
import { Bundle, Coupon, VoucherBatch } from "@/app/types/payment.types";
import { Modal, inputClass, primaryButton, secondaryButton } from "@/components/TrackingTables/ui";
import { ErrorBox, Field } from "./AdminHeader";

const toIntOrNull = (text: string) => (text.trim() === "" ? null : Math.floor(Number(text)));

// Paid plans to tick; none ticked = every paid plan.
function BundlePicker({ value, onChange }: { value: number[]; onChange: (ids: number[]) => void }) {
  const { data: bundles = [] } = useAdminBundles();
  const paid = bundles.filter((b) => b.kind === "Paid" && b.isActive);
  const byAudience = new Map<string, Bundle[]>();
  paid.forEach((b) => byAudience.set(b.audience ?? "", [...(byAudience.get(b.audience ?? "") ?? []), b]));
  const toggle = (id: number) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        الباقات <span className="font-normal text-zinc-500">{value.length ? `(${value.length} محددة)` : "(كل الباقات المدفوعة)"}</span>
      </p>
      <div className="max-h-52 overflow-y-auto rounded-xl border border-zinc-200 p-2 dark:border-zinc-700">
        {[...byAudience.entries()].map(([audience, items]) => (
          <div key={audience} className="mb-2 last:mb-0">
            <p className="px-1 text-[11px] font-bold text-zinc-500">
              {audience ? AUDIENCE_LABELS[audience as keyof typeof AUDIENCE_LABELS] : "أخرى"}
            </p>
            <div className="grid gap-x-3 sm:grid-cols-2">
              {items.map((b) => (
                <label key={b.id} className="flex items-center gap-2 rounded-lg px-1 py-1 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800">
                  <input type="checkbox" checked={value.includes(b.id)} onChange={() => toggle(b.id)} />
                  <span className="truncate">{bundleName(b)}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Off: refused when the student took main features off, so it doesn't stack
// with that discount (the whole plan still takes it).
function CustomizedCheckbox({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      يعمل مع الباقات المخصصة (التي حذف الطالب منها مميزات)
    </label>
  );
}

function PartnerSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { data: partners = [] } = useAdminPartners();
  return (
    <Field label="الشريك" hint="يُحسب له المبيعات بهذا الكوبون.">
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
        <option value="">بدون شريك</option>
        {partners.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </Field>
  );
}

// Create a coupon, or edit everything but its code. Every field is sent on
// edit: anything left out would go back to its default.
export function CouponDialog({ coupon, onClose }: { coupon?: Coupon; onClose: () => void }) {
  const [code, setCode] = useState("");
  const [percent, setPercent] = useState(coupon ? String(coupon.discountPercent) : "20");
  const [max, setMax] = useState(coupon?.maxRedemptions ? String(coupon.maxRedemptions) : "");
  const [validFrom, setValidFrom] = useState(toLocalInput(coupon?.validFrom));
  const [validUntil, setValidUntil] = useState(toLocalInput(coupon?.validUntil));
  const [firstOnly, setFirstOnly] = useState(coupon?.firstPurchaseOnly ?? false);
  const [isActive, setIsActive] = useState(coupon?.isActive ?? true);
  const [onCustomized, setOnCustomized] = useState(coupon?.allowOnCustomized ?? true);
  const [partnerId, setPartnerId] = useState(coupon?.partnerId ? String(coupon.partnerId) : "");
  const [bundleIds, setBundleIds] = useState<number[]>(coupon?.bundleIds ?? []);
  const [error, setError] = useState<string | null>(null);
  const save = useSaveCoupon();

  const percentNum = Number(percent);
  const maxNum = toIntOrNull(max);
  const problem =
    !(Number.isInteger(percentNum) && percentNum >= 1 && percentNum <= 100)
      ? "الخصم من 1 إلى 100٪"
      : maxNum !== null && !(maxNum >= 1 && maxNum <= 1_000_000)
        ? "عدد مرات الاستخدام من 1 إلى مليون"
        : validFrom && validUntil && validUntil <= validFrom
          ? "تاريخ النهاية يجب أن يكون بعد البداية"
          : null;

  const submit = () => {
    if (problem || save.isPending) return;
    setError(null);
    save.mutate(
      {
        id: coupon?.id,
        body: {
          ...(coupon ? {} : { code: code.trim() || null }),
          discountPercent: percentNum,
          maxRedemptions: maxNum,
          validFrom: fromLocalInput(validFrom),
          validUntil: fromLocalInput(validUntil),
          firstPurchaseOnly: firstOnly,
          isActive,
          partnerId: partnerId ? Number(partnerId) : null,
          bundleIds,
          allowOnCustomized: onCustomized,
        },
      },
      {
        onSuccess: (saved) => {
          toast.success(coupon ? "تم حفظ الكوبون" : `تم إنشاء الكوبون ${saved?.code ?? ""}`);
          onClose();
        },
        onError: (err) => setError(getApiErrorMessage(err)),
      },
    );
  };

  return (
    <Modal
      title={coupon ? `تعديل الكوبون ${coupon.code}` : "كوبون جديد"}
      onClose={onClose}
      className="max-w-2xl"
      footer={
        <>
          <button type="button" onClick={onClose} className={cn(secondaryButton, "flex-1")}>
            إلغاء
          </button>
          <button type="button" onClick={submit} disabled={!!problem || save.isPending} className={cn(primaryButton, "flex-1")}>
            {save.isPending ? "جارٍ الحفظ..." : coupon ? "حفظ" : "إنشاء الكوبون"}
          </button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {!coupon && (
          <Field label="الكود" hint="اتركه فارغًا لكود عشوائي من 12 حرفًا. الشرطات والمسافات تُحذف.">
            <input dir="ltr" value={code} maxLength={50} onChange={(e) => setCode(e.target.value.toUpperCase())} className={inputClass} />
          </Field>
        )}
        <Field label="الخصم (٪)" hint="100 = مجاني">
          <input dir="ltr" inputMode="numeric" value={percent} onChange={(e) => setPercent(e.target.value)} className={inputClass} />
        </Field>
        <Field label="أقصى عدد استخدامات" hint="فارغ = بلا حد. كل مستخدم يستخدمه مرة واحدة.">
          <input dir="ltr" inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value)} className={inputClass} />
        </Field>
        <PartnerSelect value={partnerId} onChange={setPartnerId} />
        <Field label="يبدأ في (اختياري)">
          <input type="datetime-local" dir="ltr" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} className={inputClass} />
        </Field>
        <Field label="ينتهي في (اختياري)">
          <input type="datetime-local" dir="ltr" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className={inputClass} />
        </Field>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input type="checkbox" checked={firstOnly} onChange={(e) => setFirstOnly(e.target.checked)} />
            لأول عملية شراء فقط (لمن لم يشترِ باقة مدفوعة من قبل)
          </label>
          <CustomizedCheckbox checked={onCustomized} onChange={setOnCustomized} />
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            مفعّل
          </label>
        </div>
        <div className="sm:col-span-2">
          <BundlePicker value={bundleIds} onChange={setBundleIds} />
        </div>
      </div>
      {problem && <p className="mt-4 text-sm text-amber-700 dark:text-amber-400">{problem}</p>}
      {error && <div className="mt-4"><ErrorBox message={error} /></div>}
    </Modal>
  );
}

// N single-use vouchers. The codes come back only once, in this response,
// so they're shown with copy and export straight away.
export function BatchDialog({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [count, setCount] = useState("10");
  const [percent, setPercent] = useState("100");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [bundleIds, setBundleIds] = useState<number[]>([]);
  const [onCustomized, setOnCustomized] = useState(true);
  const [batch, setBatch] = useState<VoucherBatch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const create = useCreateBatch();

  const countNum = Number(count);
  const percentNum = Number(percent);
  const problem =
    name.trim().length < 2
      ? "اسم الدفعة من 2 إلى 150 حرفًا"
      : !(Number.isInteger(countNum) && countNum >= 1 && countNum <= 5000)
        ? "عدد القسائم من 1 إلى 5000"
        : !(Number.isInteger(percentNum) && percentNum >= 1 && percentNum <= 100)
          ? "الخصم من 1 إلى 100٪"
          : validFrom && validUntil && validUntil <= validFrom
            ? "تاريخ النهاية يجب أن يكون بعد البداية"
            : null;

  const submit = () => {
    if (problem || create.isPending) return;
    setError(null);
    create.mutate(
      {
        name: name.trim(),
        count: countNum,
        discountPercent: percentNum,
        bundleIds,
        validFrom: fromLocalInput(validFrom),
        validUntil: fromLocalInput(validUntil),
        partnerId: partnerId ? Number(partnerId) : null,
        allowOnCustomized: onCustomized,
      },
      { onSuccess: setBatch, onError: (err) => setError(getApiErrorMessage(err)) },
    );
  };

  if (batch) {
    const copyAll = async () => {
      try {
        await navigator.clipboard.writeText(batch.codes.join("\n"));
        toast.success(`تم نسخ ${batch.codes.length} كود`);
      } catch {
        toast.error("تعذر النسخ");
      }
    };
    return (
      <Modal
        title={`دفعة ${batch.name}`}
        description="احفظ الأكواد الآن: لا تظهر مرة أخرى."
        onClose={onClose}
        footer={
          <>
            <button type="button" onClick={() => void copyAll()} className={cn(secondaryButton, "flex-1")}>
              <Copy size={16} /> نسخ الكل
            </button>
            <button
              type="button"
              onClick={() => downloadText(["code", ...batch.codes].join("\n"), `${batch.name}.csv`)}
              className={cn(primaryButton, "flex-1")}
            >
              <Download size={16} /> تنزيل CSV
            </button>
          </>
        }
      >
        <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-300">
          {batch.count} قسيمة · خصم {batch.discountPercent}٪ · تُستخدم كل قسيمة مرة واحدة
        </p>
        <div className="grid max-h-80 grid-cols-2 gap-1.5 overflow-y-auto sm:grid-cols-3" dir="ltr">
          {batch.codes.map((c) => (
            <span key={c} className="rounded-lg bg-zinc-100 px-2 py-1.5 text-center font-mono text-xs dark:bg-zinc-800">
              {c}
            </span>
          ))}
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title="دفعة قسائم"
      description="أكواد تُستخدم مرة واحدة، مثلاً لسنتر أو لولي أمر دفع خارج التطبيق."
      onClose={onClose}
      className="max-w-2xl"
      footer={
        <>
          <button type="button" onClick={onClose} className={cn(secondaryButton, "flex-1")}>
            إلغاء
          </button>
          <button type="button" onClick={submit} disabled={!!problem || create.isPending} className={cn(primaryButton, "flex-1")}>
            {create.isPending ? "جارٍ الإنشاء..." : `إنشاء ${Number.isFinite(countNum) ? countNum : ""} قسيمة`}
          </button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="اسم الدفعة">
            <input dir="auto" value={name} maxLength={150} onChange={(e) => setName(e.target.value)} placeholder="مثال: سنتر النور — نوفمبر" className={inputClass} />
          </Field>
        </div>
        <Field label="عدد القسائم">
          <input dir="ltr" inputMode="numeric" value={count} onChange={(e) => setCount(e.target.value)} className={inputClass} />
        </Field>
        <Field label="الخصم (٪)">
          <input dir="ltr" inputMode="numeric" value={percent} onChange={(e) => setPercent(e.target.value)} className={inputClass} />
        </Field>
        <Field label="يبدأ في (اختياري)">
          <input type="datetime-local" dir="ltr" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} className={inputClass} />
        </Field>
        <Field label="ينتهي في (اختياري)">
          <input type="datetime-local" dir="ltr" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className={inputClass} />
        </Field>
        <PartnerSelect value={partnerId} onChange={setPartnerId} />
        <div className="sm:col-span-2">
          <CustomizedCheckbox checked={onCustomized} onChange={setOnCustomized} />
        </div>
        <div className="sm:col-span-2">
          <BundlePicker value={bundleIds} onChange={setBundleIds} />
        </div>
      </div>
      {problem && <p className="mt-4 text-sm text-amber-700 dark:text-amber-400">{problem}</p>}
      {error && <div className="mt-4"><ErrorBox message={error} /></div>}
    </Modal>
  );
}

// Who used a coupon (or a batch's vouchers), on which plan, and for how much.
export function UsageDialog({ kind, id, title, onClose }: { kind: "coupon" | "batch"; id: number; title: string; onClose: () => void }) {
  const { data: usage, isLoading } = useCouponUsage(kind, id);

  return (
    <Modal title={title} onClose={onClose} className="max-w-3xl">
      {isLoading || !usage ? (
        <Loader2 className="mx-auto animate-spin text-zinc-400" />
      ) : (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "مرات الاستخدام", value: String(usage.redemptions) + (usage.codesInBatch ? ` / ${usage.codesInBatch}` : "") },
              { label: "طلاب مختلفون", value: String(usage.distinctStudents) },
              { label: "إجمالي الخصم", value: formatEgp(usage.totalDiscount) },
              { label: "الإيرادات", value: formatEgp(usage.revenue) },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-zinc-50 p-3 text-center dark:bg-zinc-800/60">
                <p dir="ltr" className="text-lg font-extrabold tabular-nums text-zinc-900 dark:text-zinc-100">{s.value}</p>
                <p className="text-xs text-zinc-500">{s.label}</p>
              </div>
            ))}
          </div>
          {usage.items.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-500">لم يُستخدم بعد.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="text-xs text-zinc-500">
                    <th className="pb-2 text-start font-semibold">الطالب</th>
                    <th className="pb-2 text-start font-semibold">الكود</th>
                    <th className="pb-2 text-start font-semibold">الباقة</th>
                    <th className="pb-2 text-end font-semibold">الخصم</th>
                    <th className="pb-2 text-end font-semibold">المدفوع</th>
                    <th className="pb-2 text-end font-semibold">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {usage.items.map((item, i) => (
                    <tr key={i}>
                      <td className="py-2 font-semibold">{item.studentName}</td>
                      <td className="py-2 font-mono text-xs" dir="ltr">{item.code}</td>
                      <td className="py-2 text-zinc-600 dark:text-zinc-300">{arabicPlanTitle(item.bundleTitle)}</td>
                      <td className="py-2 text-end tabular-nums">{formatEgp(item.discountAmount)}</td>
                      <td className="py-2 text-end tabular-nums">{formatEgp(item.pricePaid)}</td>
                      <td className="py-2 text-end text-xs text-zinc-500">{formatDateTime(item.redeemedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
