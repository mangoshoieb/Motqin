"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/app/lib/utils";
import {
  SUBSCRIPTION_PLANS,
  PERIOD_OPTIONS,
  ACCOUNT_TYPE_OPTIONS,
} from "@/app/data/subscriptionPlans";

// Fixed across every plan, at every billing period — per product spec.
const REFUND_GUARANTEE_TEXT =
  "يمكنك استرداد كامل المبلغ المدفوع إذا لم تتجاوز نسبة استخدامك من رصيد الذكاء الاصطناعي المخصص للخطة 10%. في حال تجاوز هذه النسبة، لا يحق للمستخدم استرداد المبلغ.";

const CheckoutContent = () => {
  const searchParams = useSearchParams();

  const planId = searchParams.get("planId") ?? SUBSCRIPTION_PLANS[1].id;
  const periodValue = Number(searchParams.get("period")) || PERIOD_OPTIONS[0].value;
  const accountTypeValue = searchParams.get("accountType") ?? ACCOUNT_TYPE_OPTIONS[0].value;

  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId) ?? SUBSCRIPTION_PLANS[1];
  const periodOption =
    PERIOD_OPTIONS.find((p) => p.value === periodValue) ?? PERIOD_OPTIONS[0];
  const accountType =
    ACCOUNT_TYPE_OPTIONS.find((a) => a.value === accountTypeValue) ?? ACCOUNT_TYPE_OPTIONS[0];

  const hasDiscount = periodOption.discount > 0;
  const finalMonthly = Math.round(plan.monthlyPrice * (1 - periodOption.discount));
  const subtotal = plan.monthlyPrice * periodOption.value;
  const total = finalMonthly * periodOption.value;
  const savings = subtotal - total;

  const handleConfirm = () => {
    // Payment gateway isn't wired up yet — placeholder for now.
    toast.success("سيتم تفعيل الدفع قريباً");
  };

  return (
    <div dir="rtl" className="min-h-screen bg-zinc-100 dark:bg-zinc-950 px-6 sm:px-10 py-12">
      <div className="max-w-5xl mx-auto mb-8">
        <Link
          href="/subscription"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-blue-950 dark:text-zinc-400 dark:hover:text-blue-100 transition"
        >
          <ArrowRight className="size-4" />
          الرجوع لاختيار خطة أخرى
        </Link>

        <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold text-blue-950 dark:text-blue-100">
          ملخص الدفع
        </h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          راجع تفاصيل اشتراكك قبل إتمام عملية الدفع
        </p>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Order summary */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="rounded-3xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">ملخص الطلب</h2>

            <dl className="mt-6 flex flex-col gap-4 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-zinc-500 dark:text-zinc-400">الخطة</dt>
                <dd className="font-semibold text-zinc-900 dark:text-zinc-100">{plan.name}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-zinc-500 dark:text-zinc-400">نوع الحساب</dt>
                <dd className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {accountType.label}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-zinc-500 dark:text-zinc-400">مدة الاشتراك</dt>
                <dd className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {periodOption.label}
                </dd>
              </div>

              <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-1" />

              <div className="flex items-center justify-between">
                <dt className="text-zinc-500 dark:text-zinc-400">السعر الأساسي</dt>
                <dd
                  className={cn(
                    "font-medium",
                    hasDiscount
                      ? "line-through text-zinc-400 dark:text-zinc-500"
                      : "text-zinc-900 dark:text-zinc-100"
                  )}
                >
                  {subtotal} ج.م
                </dd>
              </div>

              {hasDiscount && (
                <div className="flex items-center justify-between">
                  <dt className="text-emerald-600 dark:text-emerald-400">
                    الخصم ({Math.round(periodOption.discount * 100)}٪)
                  </dt>
                  <dd className="font-medium text-emerald-600 dark:text-emerald-400">
                    - {savings} ج.م
                  </dd>
                </div>
              )}

              <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-1" />

              <div className="flex items-center justify-between text-base">
                <dt className="font-bold text-zinc-900 dark:text-zinc-100">الإجمالي</dt>
                <dd className="font-extrabold text-blue-950 dark:text-blue-100 text-xl tabular-nums">
                  {total} ج.م
                </dd>
              </div>
            </dl>

            <button
              type="button"
              onClick={handleConfirm}
              className="mt-8 w-full py-3 rounded-full font-semibold bg-blue-950 text-white hover:bg-blue-900 transition cursor-pointer dark:bg-blue-100 dark:text-blue-950 dark:hover:bg-white"
            >
              المتابعة للدفع
            </button>
          </div>

          {/* Fixed refund guarantee — same wording on every plan/period */}
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 flex gap-3 dark:border-emerald-900 dark:bg-emerald-950/40">
            <ShieldCheck className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                ضمان استرداد الأموال
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-emerald-700 dark:text-emerald-400">
                {REFUND_GUARANTEE_TEXT}
              </p>
            </div>
          </div>
        </div>

        {/* Plan details */}
        <div className="lg:col-span-3">
          <div
            className={cn(
              "relative rounded-3xl p-8 border h-full",
              plan.highlighted
                ? "bg-blue-950 text-white border-blue-900 dark:bg-blue-900 dark:border-blue-800"
                : "bg-white text-zinc-900 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-800"
            )}
          >
            {plan.badge && (
              <span className="absolute -top-3 right-6 px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-zinc-900">
                {plan.badge}
              </span>
            )}

            <h2 className="text-xl font-bold">تفاصيل خطة {plan.name}</h2>
            <p
              className={cn(
                "text-sm mt-1",
                plan.highlighted ? "text-blue-200" : "text-zinc-500 dark:text-zinc-400"
              )}
            >
              {plan.tagline}
            </p>

            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold tabular-nums">{finalMonthly}</span>
              <span className="text-sm">ج.م / شهرياً</span>
            </div>

            <ul className="mt-8 flex flex-col gap-5 text-sm">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check
                    className={cn(
                      "size-4 mt-0.5 shrink-0",
                      plan.highlighted
                        ? "text-emerald-300"
                        : "text-emerald-600 dark:text-emerald-400"
                    )}
                  />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const CheckoutPage = () => {
  return (
    <Suspense fallback={null}>
      <CheckoutContent />
    </Suspense>
  );
};

export default CheckoutPage;
