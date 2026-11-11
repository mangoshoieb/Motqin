"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, PlusCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/app/lib/utils";
import { getApiErrorMessage, getCodedApiError } from "@/app/lib/api-error";
import { AUDIENCE_GROUPS, AUDIENCES } from "@/app/constants/payment.constants";
import { bundleName } from "@/app/lib/payments";
import {
  useAdminPartners,
  useApplyCatalogue,
  useFeatureCatalogue,
  useSaveBundle,
  useSetBundleFeatures,
} from "@/app/hooks/useAdminPayments";
import { Bundle, BundleAudience, BundleFeatureInput, CatalogueEntry, CatalogueReport } from "@/app/types/payment.types";
import { Modal, Segmented, inputClass, primaryButton, secondaryButton } from "@/components/TrackingTables/ui";
import { ErrorBox, Field } from "./AdminHeader";
import { FeaturesEditor, featuresProblem, toFeatureInputs } from "./FeaturesEditor";
import {
  GroupDiscountsEditor,
  discountsFromDraft,
  discountsProblem,
  draftFromDiscounts,
  type DiscountDraft,
} from "./GroupDiscountsEditor";

type SaveError = { message: string; extra?: string[] };

const readError = (error: unknown): SaveError => {
  const coded = getCodedApiError<{ missing?: string[] }>(error);
  return { message: getApiErrorMessage(error), extra: coded?.details?.missing };
};

const DURATIONS = [
  { days: 30, label: "شهر" },
  { days: 180, label: "6 أشهر" },
  { days: 365, label: "سنة" },
];

// Create a paid plan, or edit one's details. On edit the features are kept
// (they have their own dialog); Free and Guest only take title and text.
export function BundleInfoDialog({
  bundle,
  freeBundle,
  onClose,
}: {
  bundle?: Bundle;
  freeBundle?: Bundle; // a new plan starts from Free's limits
  onClose: () => void;
}) {
  const system = bundle && bundle.kind !== "Paid";
  const [title, setTitle] = useState(bundle?.title ?? "");
  const [description, setDescription] = useState(bundle?.description ?? "");
  const [price, setPrice] = useState(bundle ? String(bundle.price) : "");
  const [days, setDays] = useState(bundle ? String(bundle.durationDays) : "30");
  const [audience, setAudience] = useState<BundleAudience>(bundle?.audience ?? "Student");
  const [isHidden, setIsHidden] = useState(bundle?.isHidden ?? true);
  const [partnerId, setPartnerId] = useState(bundle?.partnerId ? String(bundle.partnerId) : "");
  const [code, setCode] = useState(bundle?.code ?? "");
  const [features, setFeatures] = useState<BundleFeatureInput[]>(() => toFeatureInputs(freeBundle?.features ?? []));
  const [discounts, setDiscounts] = useState<DiscountDraft>(() => draftFromDiscounts(bundle?.groupDiscounts));
  const [error, setError] = useState<SaveError | null>(null);
  const { data: partners = [] } = useAdminPartners();
  const { data: catalogue = [] } = useFeatureCatalogue();
  const save = useSaveBundle();

  const priceNum = Number(price);
  const daysNum = Number(days);
  const problem =
    title.trim().length < 2
      ? "العنوان من 2 إلى 100 حرف"
      : !system && !(priceNum >= 1 && priceNum <= 100_000)
        ? "السعر من 1 إلى 100,000 ج.م"
        : !system && !(Number.isInteger(daysNum) && daysNum >= 1 && daysNum <= 3650)
          ? "المدة من 1 إلى 3650 يوم"
          : (!system && discountsProblem(discounts)) ||
            (!bundle && catalogue.length ? featuresProblem(catalogue, features) : null);

  const submit = () => {
    if (problem || save.isPending) return;
    setError(null);
    save.mutate(
      {
        id: bundle?.id,
        body: {
          title: title.trim(),
          description: description.trim() || null,
          price: system ? bundle!.price : priceNum,
          durationDays: system ? bundle!.durationDays : daysNum,
          audience,
          isHidden,
          partnerId: partnerId ? Number(partnerId) : null,
          code: code.trim() || null,
          features: bundle ? null : features,
          // {} sells it whole; Free and Guest can't have any.
          groupDiscounts: system ? null : discountsFromDraft(discounts),
        },
      },
      {
        onSuccess: () => {
          toast.success(bundle ? "تم حفظ الباقة. المشتركون الحاليون يحتفظون بما اشتروه." : "تم إنشاء الباقة");
          onClose();
        },
        onError: (err) => setError(readError(err)),
      },
    );
  };

  return (
    <Modal
      title={bundle ? `تعديل ${bundleName(bundle)}` : "باقة جديدة"}
      description={system ? "باقة نظام: يتغير العنوان والوصف فقط هنا، والحدود من \"تعديل الحدود\"." : undefined}
      onClose={onClose}
      className="max-w-3xl"
      footer={
        <>
          <button type="button" onClick={onClose} className={cn(secondaryButton, "flex-1")}>
            إلغاء
          </button>
          <button type="button" onClick={submit} disabled={!!problem || save.isPending} className={cn(primaryButton, "flex-1")}>
            {save.isPending ? "جارٍ الحفظ..." : bundle ? "حفظ" : "إنشاء الباقة"}
          </button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="العنوان">
          <input dir="auto" value={title} maxLength={100} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </Field>
        {!system && (
          <Field label="الكود" hint="اختياري وفريد، حتى 20 حرفًا. باقات الملف لها أكواد مثل S2-6M.">
            <input dir="ltr" value={code} maxLength={20} onChange={(e) => setCode(e.target.value)} className={inputClass} />
          </Field>
        )}
        <div className="sm:col-span-2">
          <Field label="الوصف">
            <textarea
              dir="auto"
              value={description}
              maxLength={1000}
              rows={2}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
        {!system && (
          <>
            <Field label="السعر (ج.م)">
              <input dir="ltr" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} className={inputClass} />
            </Field>
            <Field label="المدة (أيام)">
              <div className="flex gap-2">
                <input dir="ltr" inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value)} className={cn(inputClass, "w-24")} />
                {DURATIONS.map((d) => (
                  <button
                    key={d.days}
                    type="button"
                    onClick={() => setDays(String(d.days))}
                    className={cn(secondaryButton, "px-3 py-2", Number(days) === d.days && "border-blue-600 text-blue-700 dark:text-blue-400")}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="لمن الباقة">
              <Segmented<BundleAudience>
                value={audience}
                onChange={(next) => {
                  setAudience(next);
                  // Only main features with features for that audience can be discounted.
                  setDiscounts((prev) =>
                    Object.fromEntries(Object.entries(prev).filter(([group]) => AUDIENCE_GROUPS[next].includes(group))),
                  );
                }}
                options={AUDIENCES}
              />
            </Field>
            <Field label="الشريك" hint="الشريك الذي يحصل على عمولة مبيعاتها.">
              <select value={partnerId} onChange={(e) => setPartnerId(e.target.value)} className={inputClass}>
                <option value="">بدون شريك</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <label className="flex items-center gap-2 text-sm text-zinc-700 sm:col-span-2 dark:text-zinc-300">
              <input type="checkbox" checked={isHidden} onChange={(e) => setIsHidden(e.target.checked)} />
              مخفية: لا تظهر في قائمة الباقات، وتُفتح برابطها فقط (عروض الشركاء)
            </label>
            <div className="sm:col-span-2">
              <GroupDiscountsEditor
                audience={audience}
                value={discounts}
                onChange={setDiscounts}
              />
            </div>
          </>
        )}
      </div>

      {!bundle && catalogue.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">الحدود (تبدأ من حدود الباقة المجانية)</p>
          <FeaturesEditor catalogue={catalogue} value={features} onChange={setFeatures} />
        </div>
      )}

      {problem && <p className="mt-4 text-sm text-amber-700 dark:text-amber-400">{problem}</p>}
      {error && (
        <div className="mt-4">
          <ErrorBox message={error.message} extra={error.extra} />
        </div>
      )}
    </Modal>
  );
}

// Replace a plan's 20 limits. On Free and Guest this reaches everyone on
// them at once; on a paid plan, new purchases only.
export function BundleFeaturesDialog({ bundle, onClose }: { bundle: Bundle; onClose: () => void }) {
  const { data: catalogue = [], isLoading } = useFeatureCatalogue();
  const [features, setFeatures] = useState<BundleFeatureInput[]>(() => toFeatureInputs(bundle.features));
  const [error, setError] = useState<SaveError | null>(null);
  const save = useSetBundleFeatures();
  const problem = catalogue.length ? featuresProblem(catalogue, features) : null;

  const submit = () => {
    if (problem || save.isPending) return;
    setError(null);
    save.mutate(
      { id: bundle.id, features },
      {
        onSuccess: () => {
          toast.success("تم حفظ الحدود");
          onClose();
        },
        onError: (err) => setError(readError(err)),
      },
    );
  };

  return (
    <Modal
      title={`حدود ${bundleName(bundle)}`}
      description={
        bundle.kind === "Paid"
          ? "تنطبق على المشترين الجدد فقط؛ المشتركون الحاليون يحتفظون بما اشتروه."
          : "تصل لكل المستخدمين على هذه الباقة فورًا، مع الاحتفاظ بما استخدموه."
      }
      onClose={onClose}
      className="max-w-3xl"
      footer={
        <>
          <button type="button" onClick={onClose} className={cn(secondaryButton, "flex-1")}>
            إلغاء
          </button>
          <button type="button" onClick={submit} disabled={!!problem || save.isPending} className={cn(primaryButton, "flex-1")}>
            {save.isPending ? "جارٍ الحفظ..." : "حفظ الحدود"}
          </button>
        </>
      }
    >
      {isLoading ? (
        <Loader2 className="mx-auto animate-spin text-zinc-400" />
      ) : (
        <FeaturesEditor catalogue={catalogue} value={features} onChange={setFeatures} />
      )}
      {problem && <p className="mt-4 text-sm text-amber-700 dark:text-amber-400">{problem}</p>}
      {error && (
        <div className="mt-4">
          <ErrorBox message={error.message} extra={error.extra} />
        </div>
      )}
    </Modal>
  );
}

// The plan catalogue file → database. "Check" is a dry run listing what
// would change; "Apply" saves.
export function CatalogueDialog({ onClose }: { onClose: () => void }) {
  const apply = useApplyCatalogue();
  const [report, setReport] = useState<CatalogueReport | null>(null);
  const [retireOthers, setRetireOthers] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = (dryRun: boolean) => {
    setError(null);
    apply.mutate(
      { dryRun, retireOthers },
      {
        onSuccess: (result) => {
          setReport(result);
          setConfirming(false);
          if (!dryRun) toast.success("تم تطبيق ملف الباقات");
        },
        onError: (err) => setError(getApiErrorMessage(err)),
      },
    );
  };

  const entries = report ? [...report.systemBundles, ...report.plans] : [];
  const changed = entries.filter((e) => e.status !== "Unchanged");

  return (
    <Modal
      title="ملف الباقات"
      description="يقرأ ملف الكتالوج (27 باقة وحدود المجانية والزائر). الفحص لا يحفظ شيئًا."
      onClose={onClose}
      className="max-w-2xl"
      footer={
        confirming ? (
          <>
            <button type="button" onClick={() => setConfirming(false)} className={cn(secondaryButton, "flex-1")}>
              رجوع
            </button>
            <button type="button" onClick={() => run(false)} disabled={apply.isPending} className={cn(primaryButton, "flex-1 bg-rose-600 dark:bg-rose-700 hover:bg-rose-700 dark:hover:bg-rose-800")}>
              {apply.isPending ? "جارٍ التطبيق..." : "نعم، طبّق على الباقات الحية"}
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => run(true)} disabled={apply.isPending} className={cn(secondaryButton, "flex-1")}>
              {apply.isPending ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} فحص
            </button>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={!report?.dryRun || apply.isPending}
              className={cn(primaryButton, "flex-1")}
            >
              تطبيق
            </button>
          </>
        )
      }
    >
      <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
        <input type="checkbox" checked={retireOthers} onChange={(e) => setRetireOthers(e.target.checked)} />
        إيقاف بيع الباقات المدفوعة غير الموجودة في الملف
      </label>
      {confirming && (
        <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-800 dark:bg-rose-500/10 dark:text-rose-200">
          سيُحفظ الملف على الباقات الحية{retireOthers ? " ويتوقف بيع الباقات غير الموجودة فيه" : ""}. المشتركون الحاليون يحتفظون بباقاتهم.
        </p>
      )}
      {error && <div className="mt-4"><ErrorBox message={error} /></div>}

      {report && (
        <div className="mt-5 flex flex-col gap-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            {report.dryRun ? "نتيجة الفحص:" : <><CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" /> تم الحفظ:</>}{" "}
            {changed.length === 0 ? "كل شيء مطابق للملف" : `${changed.length} تغيير`}
          </p>
          {changed.length > 0 && (
            <ul className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200 text-sm dark:divide-zinc-800 dark:border-zinc-800">
              {changed.map((entry) => (
                <CatalogueRow key={entry.code} entry={entry} />
              ))}
            </ul>
          )}
          {report.notInCatalogue.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-bold text-zinc-500">باقات ليست في الملف</p>
              <div className="flex flex-wrap gap-1.5">
                {report.notInCatalogue.map((b) => (
                  <span key={b.bundleId} className="rounded-lg bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {b.title}
                    {b.retired ? " · أُوقفت" : !b.isActive ? " · موقوفة" : ""}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function CatalogueRow({ entry }: { entry: CatalogueEntry }) {
  return (
    <li className="px-4 py-2.5">
      <p className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-100">
        {entry.status === "Created" && <PlusCircle size={14} className="text-emerald-600 dark:text-emerald-400" />}
        <span dir="ltr" className="font-mono text-xs">{entry.code}</span> {entry.title}
        <span className="text-xs font-normal text-zinc-500">{entry.status === "Created" ? "جديدة" : "تحديث"}</span>
      </p>
      {entry.changes.length > 0 && (
        <ul className="mt-1 text-xs text-zinc-500" dir="ltr">
          {entry.changes.map((change) => (
            <li key={change}>{change}</li>
          ))}
        </ul>
      )}
    </li>
  );
}
