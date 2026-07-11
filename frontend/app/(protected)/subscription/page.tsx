"use client";

import { useState } from "react";
import { PlanCard } from "@/components/PlanCard";
import {
  SUBSCRIPTION_PLANS,
  PERIOD_OPTIONS,
  ACCOUNT_TYPE_OPTIONS,
} from "@/app/data/subscriptionPlans";

const selectClasses =
  "rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 outline-none transition cursor-pointer focus:border-blue-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:focus:border-blue-500";

const SubscriptionPage = () => {
  const [period, setPeriod] = useState<number>(PERIOD_OPTIONS[0].value);
  // Not wired to anything yet — placeholder options per spec.
  const [accountType, setAccountType] = useState<string>(ACCOUNT_TYPE_OPTIONS[0].value);

  const selectedPeriod =
    PERIOD_OPTIONS.find((p) => p.value === period) ?? PERIOD_OPTIONS[0];

  return (
    <div dir="rtl" className="min-h-screen bg-zinc-100 dark:bg-zinc-950 px-6 sm:px-10 py-12">
      <div className="max-w-5xl mx-auto text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-950 dark:text-blue-100">
          اختر خطة الاشتراك المناسبة لك
        </h1>
        <p className="mt-3 text-zinc-500 dark:text-zinc-400">
          كل الخطط تشمل الوصول إلى المعلم الذكي والمخطط الذكي — الفرق في الحدود والمزايا المتقدمة
        </p>
      </div>

      <div className="max-w-5xl mx-auto flex flex-wrap items-end justify-center gap-4 mb-10">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            مدة الاشتراك
          </label>
          <select
            value={period}
            onChange={(e) => setPeriod(Number(e.target.value))}
            className={selectClasses}
          >
            {PERIOD_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            نوع الحساب
          </label>
          <select
            value={accountType}
            onChange={(e) => setAccountType(e.target.value)}
            className={selectClasses}
          >
            {ACCOUNT_TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {SUBSCRIPTION_PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            periodMonths={selectedPeriod.value}
            discountRate={selectedPeriod.discount}
          />
        ))}
      </div>
    </div>
  );
};

export default SubscriptionPage;
