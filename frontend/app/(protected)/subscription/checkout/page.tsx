"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  SlidersHorizontal,
  Tag,
  Wallet,
  X,
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import Skeleton from "@/components/ui/Skeleton";
import { getApiErrorMessage, getCodedApiError } from "@/app/lib/api-error";
import { errorCodeMessage } from "@/app/lib/error-codes";
import { useAuthKind } from "@/app/hooks/useAuthKind";
import { useBundle, useBundles, usePurchase, usePurchasePreview } from "@/app/hooks/usePayments";
import {
  AUDIENCE_LABELS,
  HIGHLIGHTED_TIERS,
  OPERATION_META,
  RECHARGE_MIN,
  REFUND_GUARANTEE_TEXT,
  TIER_META,
} from "@/app/constants/payment.constants";
import {
  bundleName,
  customPrice,
  durationLabel,
  featureLabel,
  featureValueText,
  formatDay,
  formatEgp,
  formatMoney,
  isFeatureOn,
  leftOutText,
  parseGroups,
  rateLimitText,
  removableGroups,
  termOf,
  tierOf,
} from "@/app/lib/payments";
import { PurchaseResult } from "@/app/types/payment.types";
import { KeptGroups } from "@/components/Payments/BillingBits";
import { TopUpDialog } from "@/components/Payments/TopUpDialog";
import { AnimatedMoney } from "@/components/Payments/AnimatedMoney";
import { MobilePriceBar } from "@/components/Payments/MobilePriceBar";
import { inputClass, primaryButton, secondaryButton } from "@/components/TrackingTables/ui";

// Coupons are stored without dashes or spaces, in capitals.
const normalizeCoupon = (text: string) => text.replace(/[\s-]+/g, "").toUpperCase();

const CheckoutContent = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const bundleId = Number(searchParams.get("bundleId")) || null;
  // The main features kept in the plan builder; none = the whole plan.
  const groups = parseGroups(searchParams.get("groups"));
  const registered = useAuthKind() === "user";

  const { data: bundle, isLoading: bundleLoading, error: bundleError } = useBundle(bundleId);
  const { data: audienceBundles } = useBundles(bundle?.audience ?? "Student");
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState("");
  const {
    data: preview,
    isFetching: previewing,
    refetch: refetchPreview,
  } = usePurchasePreview(bundleId, coupon, groups, registered && !!bundle);
  const purchase = usePurchase();
  const [result, setResult] = useState<PurchaseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [topUp, setTopUp] = useState<number | null>(null);

  if (!bundleId || bundleError) {
    return (
      <Shell>
        <div className="mx-auto max-w-md rounded-3xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">هذه الباقة غير متاحة</h2>
          <p className="mt-1 text-sm text-zinc-500">ربما توقف بيعها أو الرابط غير صحيح.</p>
          <Link href="/subscription" className={cn(primaryButton, "mt-5")}>
            عرض الباقات
          </Link>
        </div>
      </Shell>
    );
  }

  if (bundleLoading || !bundle) {
    return (
      <Shell>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <Skeleton className="h-96 rounded-3xl lg:col-span-2" />
          <Skeleton className="h-96 rounded-3xl lg:col-span-3" />
        </div>
      </Shell>
    );
  }

  const tier = tierOf(bundle);
  const meta = tier ? TIER_META[tier] : undefined;
  const highlighted = tier ? HIGHLIGHTED_TIERS.includes(tier) : false;
  const term = termOf(bundle) ?? 1;
  // The plan lists all 20 features; show its own audience's, as the list does.
  const ownKeys = new Set(audienceBundles?.find((b) => b.kind === "Free")?.features.map((f) => f.feature) ?? []);
  const features = bundle.features.filter((f) => ownKeys.size === 0 || ownKeys.has(f.feature));
  // Main features taken off in the plan builder.
  const removedGroups = groups ? removableGroups(bundle).map((g) => g.group).filter((g) => !groups.includes(g)) : [];
  const removedFeature = (key: string) => removedGroups.includes(bundle.features.find((f) => f.feature === key)?.group ?? "");

  const couponError = preview?.couponError ? errorCodeMessage(preview.couponError) ?? preview.couponError : null;
  const notForCustomized = preview?.couponError === "coupon_not_for_customized";
  const wholePlan = () => router.replace(`${pathname}?bundleId=${bundle.id}`);
  const builderHref = `/subscription/plans/${bundle.id}${groups ? `?groups=${groups.join(",")}` : ""}`;
  const blocked = preview?.blockedReason ? errorCodeMessage(preview.blockedReason) ?? preview.blockedReason : null;
  const short = preview ? Math.max(0, preview.amountDue - preview.walletBalance) : 0;
  // An upgrade charges only the difference for the days left.
  const credit = preview?.operation
    ? Math.max(0, Math.round((preview.listPrice - preview.discountAmount - preview.amountDue) * 100) / 100)
    : 0;
  const operation = preview?.operation ? OPERATION_META[preview.operation] : null;

  const buy = () => {
    if (!preview || blocked) return;
    setError(null);
    // A coupon the preview refused isn't sent: the purchase works without it.
    purchase.mutate(
      { bundleId: bundle.id, coupon: coupon && !preview.couponError ? coupon : null, groups },
      {
        onSuccess: setResult,
        onError: (err) => {
          const coded = getCodedApiError<{ walletBalance?: number; amountDue?: number }>(err);
          if (coded?.code === "insufficient_balance" && coded.details?.amountDue !== undefined) {
            const missing = coded.details.amountDue - (coded.details.walletBalance ?? 0);
            setTopUp(Math.max(RECHARGE_MIN, Math.ceil(missing)));
          }
          // Something changed since the preview (a coupon ran out, say):
          // show the new state.
          void refetchPreview();
          setError(getApiErrorMessage(err));
        },
      },
    );
  };

  if (result) {
    const scheduled = result.subscription.status === "Scheduled";
    return (
      <Shell>
        <div className="mx-auto max-w-lg rounded-3xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <CheckCircle2 size={56} className="mx-auto text-emerald-500 dark:text-emerald-400" />
          <h2 className="mt-4 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {result.operation === "Upgrade" ? "تمت الترقية" : result.operation === "Renewal" ? "تم التجديد" : "تم الاشتراك"}
          </h2>
          <p className="mt-2 text-zinc-600 dark:text-zinc-300">
            {bundleName(bundle)}
            {scheduled
              ? ` تبدأ في ${formatDay(result.subscription.startDate)} وتنتهي في ${formatDay(result.subscription.endDate)}.`
              : ` مفعّلة الآن حتى ${formatDay(result.subscription.endDate)}.`}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            خُصم {formatEgp(result.amountCharged)} · رصيدك الآن {formatEgp(result.walletBalance)}
          </p>
          <KeptGroups groups={result.subscription.groups} className="mt-3 justify-center" />
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Link href="/settings/billing/limits" className={cn(primaryButton, "flex-1")}>
              حدود باقتي
            </Link>
            <Link href="/settings/billing" className={cn(secondaryButton, "flex-1")}>
              المحفظة والاشتراك
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-5">
        {/* Order summary */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="rounded-3xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">ملخص الطلب</h2>

            <dl className="mt-6 flex flex-col gap-4 text-sm">
              <Row label="الخطة" value={meta?.name ?? bundle.title} />
              {bundle.audience && <Row label="الفئة" value={AUDIENCE_LABELS[bundle.audience]} />}
              <Row label="مدة الاشتراك" value={durationLabel(bundle)} />
              {operation && <Row label="العملية" value={operation.label} />}
              {preview?.startsAt && (
                <Row label="الفترة" value={`${formatDay(preview.startsAt)} — ${formatDay(preview.endsAt)}`} />
              )}
            </dl>

            {operation && <p className="mt-3 rounded-xl bg-blue-50 px-3 py-2 text-xs text-blue-800 dark:bg-blue-500/10 dark:text-blue-300">{operation.hint}</p>}

            {removableGroups(bundle).length > 1 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {groups ? (
                  <KeptGroups groups={groups} className="flex-1" />
                ) : (
                  <span className="flex-1 text-xs text-zinc-500">الباقة كاملة بكل مميزاتها</span>
                )}
                <Link href={builderHref} className="flex items-center gap-1 text-xs font-semibold text-violet-700 hover:underline dark:text-violet-300">
                  <SlidersHorizontal size={13} /> {groups ? "تعديل المميزات" : "خصّص باقتك"}
                </Link>
              </div>
            )}

            {/* Coupon */}
            {registered && (
              <div className="mt-6">
                {coupon && !preview?.couponError && preview && preview.discountPercent > 0 ? (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
                    <Tag size={16} />
                    <span className="flex-1">
                      كوبون <b dir="ltr">{coupon}</b> · خصم {preview.discountPercent}٪
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCoupon("");
                        setCouponInput("");
                      }}
                      aria-label="إزالة الكوبون"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <form
                    className="flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      setCoupon(normalizeCoupon(couponInput));
                    }}
                  >
                    <input
                      dir="ltr"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="كود الخصم"
                      className={cn(inputClass, "py-2 text-center uppercase")}
                    />
                    <button type="submit" disabled={!couponInput.trim() || previewing} className={cn(secondaryButton, "shrink-0 py-2")}>
                      تطبيق
                    </button>
                  </form>
                )}
                {coupon && couponError && <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">{couponError}</p>}
                {coupon && notForCustomized && groups && (
                  <button type="button" onClick={wholePlan} className="mt-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                    اشترك في الباقة كاملة لتستخدم الكوبون
                  </button>
                )}
              </div>
            )}

            {registered ? (
              preview ? (
                <dl className="mt-6 flex flex-col gap-3 text-sm">
                  <div className="h-px bg-zinc-200 dark:bg-zinc-800" />
                  <Row
                    label="السعر"
                    value={<AnimatedMoney value={preview.operation ? preview.fullPrice ?? preview.listPrice : bundle.price} suffix=" ج.م" />}
                    strike={preview.discountAmount > 0 || credit > 0 || (preview.featuresDiscount ?? 0) > 0}
                  />
                  {(preview.featuresDiscount ?? 0) > 0 && (
                    <Row
                      label={`خصم المميزات المحذوفة (${preview.featuresDiscountPercent ?? 0}٪)`}
                      value={<>- <AnimatedMoney value={preview.featuresDiscount!} suffix=" ج.م" /></>}
                      tone="good"
                    />
                  )}
                  {preview.discountAmount > 0 && (
                    <Row label={`الخصم (${preview.discountPercent}٪)`} value={<>- <AnimatedMoney value={preview.discountAmount} suffix=" ج.م" /></>} tone="good" />
                  )}
                  {credit > 0 && (
                    <Row label="رصيد الأيام المتبقية من باقتك" value={<>- <AnimatedMoney value={credit} suffix=" ج.م" /></>} tone="good" />
                  )}
                  <div className="h-px bg-zinc-200 dark:bg-zinc-800" />
                  <div className="flex items-center justify-between text-base">
                    <dt className="font-bold text-zinc-900 dark:text-zinc-100">المطلوب دفعه</dt>
                    <dd className="text-xl font-extrabold tabular-nums text-blue-950 dark:text-blue-100">
                      <AnimatedMoney value={preview.amountDue} suffix=" ج.م" />
                    </dd>
                  </div>
                  <div className="flex items-center justify-between text-zinc-500">
                    <dt className="flex items-center gap-1.5">
                      <Wallet size={14} /> رصيد المحفظة
                    </dt>
                    <dd className="tabular-nums">{formatEgp(preview.walletBalance)}</dd>
                  </div>
                  {short > 0 && !blocked && (
                    <p className="text-xs text-amber-700 dark:text-amber-400">ينقصك {formatEgp(short)} لإتمام الشراء.</p>
                  )}
                </dl>
              ) : (
                <Skeleton className="mt-6 h-32" />
              )
            ) : null}

            {blocked && (
              <p className="mt-5 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {blocked}
              </p>
            )}
            {error && <p className="mt-4 text-sm text-rose-600 dark:text-rose-400">{error}</p>}

            {!registered ? (
              <div className="mt-6 rounded-2xl bg-blue-50 p-4 text-sm text-blue-900 dark:bg-blue-500/10 dark:text-blue-200">
                <p>أنشئ حسابك أولاً لتشترك. كل ما أنجزته كزائر ينتقل معك.</p>
                <Link href="/sign-up" className={cn(primaryButton, "mt-3 w-full")}>
                  إنشاء حساب
                </Link>
              </div>
            ) : short > 0 && !blocked ? (
              <button
                type="button"
                onClick={() => setTopUp(Math.max(RECHARGE_MIN, preview?.suggestedRechargeAmount || Math.ceil(short)))}
                className="mt-8 w-full rounded-full bg-blue-950 py-3 font-semibold text-white transition hover:bg-blue-900 dark:bg-blue-100 dark:text-blue-950 dark:hover:bg-white"
              >
                اشحن {formatMoney(Math.max(RECHARGE_MIN, preview?.suggestedRechargeAmount || Math.ceil(short)))} ج.م
              </button>
            ) : (
              <button
                type="button"
                onClick={buy}
                disabled={!preview || !!blocked || purchase.isPending || previewing}
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-blue-950 py-3 font-semibold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-100 dark:text-blue-950 dark:hover:bg-white"
              >
                {purchase.isPending && <Loader2 size={16} className="animate-spin" />}
                {preview && preview.amountDue === 0 ? "تفعيل الباقة" : `تأكيد الدفع${preview ? ` · ${formatEgp(preview.amountDue)}` : ""}`}
              </button>
            )}
          </div>

          {/* Fixed refund guarantee — same wording on every plan/period */}
          <div className="flex gap-3 rounded-3xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900 dark:bg-emerald-950/40">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">ضمان استرداد الأموال</h3>
              <p className="mt-1 text-xs leading-relaxed text-emerald-700 dark:text-emerald-400">{REFUND_GUARANTEE_TEXT}</p>
            </div>
          </div>
        </div>

        {/* Plan details */}
        <div className="lg:col-span-3">
          <div
            className={cn(
              "relative h-full rounded-3xl border p-8",
              highlighted
                ? "border-blue-900 bg-blue-950 text-white dark:border-blue-800 dark:bg-blue-900"
                : "border-zinc-200 bg-white text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100",
            )}
          >
            {highlighted && (
              <span className="absolute -top-3 right-6 rounded-full bg-amber-400 dark:bg-amber-600 px-3 py-1 text-xs font-bold text-zinc-900">
                الأكثر طلباً
              </span>
            )}
            <h2 className="text-xl font-bold">تفاصيل خطة {meta?.name ?? bundle.title}</h2>
            <p className={cn("mt-1 text-sm", highlighted ? "text-blue-200" : "text-zinc-500 dark:text-zinc-400")}>
              {meta?.tagline ?? bundle.description}
            </p>
            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold tabular-nums">
                <AnimatedMoney value={Math.round(customPrice(bundle, removedGroups) / term)} />
              </span>
              <span className="text-sm">ج.م / شهرياً</span>
            </div>

            <ul className="mt-8 flex flex-col gap-4 text-sm">
              {features.map((feature) => {
                // A feature whose main feature was taken off keeps only its
                // left-out allowance.
                const removed = removedFeature(feature.feature);
                const on = removed ? !!feature.accessIfLeftOut && feature.accessIfLeftOut !== "Off" : isFeatureOn(feature);
                const rate = rateLimitText(feature);
                return (
                  <li key={feature.feature} className={cn("flex items-start gap-2", !on && "opacity-50")}>
                    {on ? (
                      <Check className={cn("mt-0.5 size-4 shrink-0", highlighted ? "text-emerald-300" : "text-emerald-600 dark:text-emerald-400")} />
                    ) : (
                      <X className="mt-0.5 size-4 shrink-0" />
                    )}
                    <span>
                      {featureLabel(feature.feature, feature.displayName)}
                      {removed ? (
                        <b className={highlighted ? "text-amber-300" : "text-amber-700 dark:text-amber-400"}>
                          {" "}
                          · {leftOutText(feature) ?? "غير متاح"} (حذفتها)
                        </b>
                      ) : (
                        feature.type !== "Access" && <b> · {featureValueText(feature.type, feature.access, feature.limit)}</b>
                      )}
                      {on && !removed && rate && (
                        <span className={cn("block text-xs", highlighted ? "text-blue-200" : "text-zinc-500")}>{rate}</span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      {/* Phones: what's due and the next step stay in reach below the plan details. */}
      {registered && preview && !blocked && (
        <>
          <div className="h-24 lg:hidden" />
          <MobilePriceBar
            price={<AnimatedMoney value={preview.amountDue} suffix=" ج.م" />}
            note={short > 0 ? `ينقصك ${formatEgp(short)}` : `رصيدك ${formatEgp(preview.walletBalance)}`}
            warn={short > 0}
            action={
              short > 0 ? (
                <button
                  type="button"
                  onClick={() => setTopUp(Math.max(RECHARGE_MIN, preview.suggestedRechargeAmount || Math.ceil(short)))}
                  className="rounded-full bg-blue-950 px-6 py-3 font-semibold text-white dark:bg-blue-100 dark:text-blue-950"
                >
                  اشحن المحفظة
                </button>
              ) : (
                <button
                  type="button"
                  onClick={buy}
                  disabled={purchase.isPending || previewing}
                  className="flex items-center gap-2 rounded-full bg-blue-950 px-6 py-3 font-semibold text-white disabled:opacity-50 dark:bg-blue-100 dark:text-blue-950"
                >
                  {purchase.isPending && <Loader2 size={16} className="animate-spin" />}
                  {preview.amountDue === 0 ? "تفعيل الباقة" : "ادفع"}
                </button>
              )
            }
          />
        </>
      )}

      {topUp !== null && <TopUpDialog initialAmount={topUp} onClose={() => setTopUp(null)} onPaid={() => setError(null)} />}
    </Shell>
  );
};

function Row({ label, value, strike, tone }: { label: string; value: React.ReactNode; strike?: boolean; tone?: "good" }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className={cn("text-zinc-500 dark:text-zinc-400", tone === "good" && "text-emerald-600 dark:text-emerald-400")}>{label}</dt>
      <dd
        className={cn(
          "text-end font-semibold text-zinc-900 dark:text-zinc-100",
          strike && "text-zinc-400 line-through dark:text-zinc-500",
          tone === "good" && "text-emerald-600 dark:text-emerald-400",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div dir="rtl" className="min-h-screen bg-zinc-100 px-6 py-12 sm:px-10 dark:bg-zinc-950">
      <div className="mx-auto mb-8 max-w-5xl">
        <Link
          href="/subscription"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition hover:text-blue-950 dark:text-zinc-400 dark:hover:text-blue-100"
        >
          <ArrowRight className="size-4" />
          الرجوع لاختيار خطة أخرى
        </Link>
        <h1 className="mt-4 text-3xl font-extrabold text-blue-950 sm:text-4xl dark:text-blue-100">ملخص الدفع</h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">راجع تفاصيل اشتراكك قبل إتمام عملية الدفع</p>
      </div>
      <div className="mx-auto max-w-5xl">{children}</div>
    </div>
  );
}

const CheckoutPage = () => (
  <Suspense fallback={null}>
    <CheckoutContent />
  </Suspense>
);

export default CheckoutPage;
