"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Info } from "lucide-react";
import Skeleton from "@/components/ui/Skeleton";
import { useAuth } from "@/app/(public)/context/auth.context";
import { useBundles, useMySubscription } from "@/app/hooks/usePayments";
import { useAuthKind } from "@/app/hooks/useAuthKind";
import {
  AUDIENCES,
  TERM_LABELS,
  TERM_MONTHS,
  type TermMonths,
} from "@/app/constants/payment.constants";
import { audienceForUser, groupPlans, isTeacherAccount, savingPercent } from "@/app/lib/payments";
import { BundleAudience } from "@/app/types/payment.types";
import { Segmented } from "@/components/TrackingTables/ui";
import { PlanCard } from "./PlanCard";
import { ComparisonTable } from "./ComparisonTable";

const selectClasses =
  "w-full cursor-pointer rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 outline-none transition focus:border-blue-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:focus:border-blue-500";

// Plans for one audience at a time, opening on the account's own; the term
// picker changes every card's price.
export function PlansSection() {
  const { user } = useAuth();
  const kind = useAuthKind();
  // A link can ask for an audience (?audience=Mentor from a plan-limit
  // prompt); otherwise the account's own, until the user picks one (the
  // user loads after the first render).
  const searchParams = useSearchParams();
  const requested = AUDIENCES.find((a) => a.value === searchParams.get("audience"))?.value ?? null;
  const [picked, setAudience] = useState<BundleAudience | null>(requested);
  const audience = picked ?? audienceForUser(user);
  const [term, setTerm] = useState<TermMonths>(1);
  const { data: bundles, isLoading } = useBundles(audience);
  const { data: subscription } = useMySubscription(kind !== "none");

  const { free, tiers } = groupPlans(bundles ?? []);
  // Teacher plans are for teacher accounts; the server refuses anyone else.
  const teacherLocked = audience === "Teacher" && kind !== "none" && !isTeacherAccount(user);
  const currentId = subscription?.current.bundleId;

  // The best saving each term offers, for the picker's labels.
  const bestSaving = (months: TermMonths) =>
    Math.max(0, ...tiers.map((t) => (t.terms[months] ? savingPercent(t.terms[months]!.price, t.terms[1]?.price, months) : 0)));

  return (
    <div>
      <div className="mx-auto flex max-w-md flex-col gap-5">
        <Segmented<BundleAudience>
          value={audience}
          onChange={setAudience}
          options={AUDIENCES}
          className="w-full"
        />
        <div className="flex flex-col gap-2">
          <label htmlFor="term" className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            مدة الاشتراك
          </label>
          <select
            id="term"
            value={term}
            onChange={(e) => setTerm(Number(e.target.value) as TermMonths)}
            className={selectClasses}
          >
            {TERM_MONTHS.map((months) => {
              const saving = bestSaving(months);
              return (
                <option key={months} value={months}>
                  {TERM_LABELS[months]}
                  {saving > 0 ? ` — وفّر حتى ${saving}٪` : ""}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {teacherLocked && (
        <p className="mx-auto mt-6 flex max-w-2xl items-start gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          <Info size={18} className="mt-0.5 shrink-0" />
          باقات المدرسين متاحة لحسابات المدرسين فقط. إذا كنت مدرسًا تواصل مع الدعم لتفعيل حساب المدرس.
        </p>
      )}

      <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 items-start gap-6 md:grid-cols-3">
        {isLoading
          ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-[30rem] rounded-3xl" />)
          : tiers.map(({ tier, terms }) => {
              const bundle = terms[term];
              if (!bundle) return null;
              return (
                <PlanCard
                  key={tier}
                  tier={tier}
                  bundle={bundle}
                  monthly={terms[1]}
                  term={term}
                  audience={audience}
                  isCurrent={bundle.id === currentId}
                  currentGroups={subscription?.current.groups}
                  buyDisabled={teacherLocked}
                />
              );
            })}
      </div>

      {!isLoading && tiers.length > 0 && (
        <section className="mx-auto mt-14 max-w-6xl">
          <h2 className="mb-1 text-xl font-bold text-zinc-900 dark:text-zinc-100">مقارنة كل المزايا</h2>
          <p className="mb-4 text-sm text-zinc-500">
            الحدود الشهرية تتجدد كل شهر من بداية اشتراكك، والحدود العامة (مثل عدد المواد) لا تتجدد.
          </p>
          <ComparisonTable free={free} tiers={tiers} term={term} />
        </section>
      )}
    </div>
  );
}
