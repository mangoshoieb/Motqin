"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowRight, Check, Lock, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/app/lib/utils";
import Skeleton from "@/components/ui/Skeleton";
import { useBundle, useBundles } from "@/app/hooks/usePayments";
import { AUDIENCE_LABELS, FEATURE_GROUP_LABELS, TIER_META } from "@/app/constants/payment.constants";
import {
  customPrice,
  durationLabel,
  featureLabel,
  featureValueText,
  formatMoney,
  isFeatureOn,
  keptGroupsParam,
  leftOutText,
  parseGroups,
  rateLimitText,
  removableGroups,
  termOf,
  tierOf,
} from "@/app/lib/payments";
import { Bundle, BundleFeature, BundleGroup } from "@/app/types/payment.types";
import { Switch } from "@/components/ui/switch";
import { AnimatedMoney } from "@/components/Payments/AnimatedMoney";
import { MobilePriceBar } from "@/components/Payments/MobilePriceBar";

// One plan's features by main feature. For a customisable plan it's the
// plan builder: a switch on each main feature the student may take off, with
// what's left without it and the live price.
const PlanDetailsContent = () => {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { data: bundle, isLoading, error } = useBundle(Number(id) || null);
  const { data: audienceBundles } = useBundles(bundle?.audience ?? "Student");

  if (error) {
    return (
      <Shell>
        <div className="mx-auto max-w-md rounded-3xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">هذه الباقة غير متاحة</h2>
          <p className="mt-1 text-sm text-zinc-500">ربما توقف بيعها أو الرابط غير صحيح.</p>
        </div>
      </Shell>
    );
  }

  if (isLoading || !bundle) {
    return (
      <Shell>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-[30rem] rounded-3xl lg:col-span-2" />
          <Skeleton className="h-72 rounded-3xl" />
        </div>
      </Shell>
    );
  }

  // Only the plan's own audience's features, as the plans list shows them.
  const ownKeys = new Set(audienceBundles?.find((b) => b.kind === "Free")?.features.map((f) => f.feature) ?? []);
  return <Builder key={bundle.id} bundle={bundle} ownKeys={ownKeys} initialKept={parseGroups(searchParams.get("groups"))} />;
};

function Builder({ bundle, ownKeys, initialKept }: { bundle: Bundle; ownKeys: Set<string>; initialKept: string[] | null }) {
  const removable = removableGroups(bundle).map((g) => g.group);
  const [off, setOff] = useState<string[]>(() =>
    initialKept ? removable.filter((g) => !initialKept.includes(g)) : [],
  );
  const tier = tierOf(bundle);
  const meta = tier ? TIER_META[tier] : undefined;
  const term = termOf(bundle) ?? 1;
  const price = customPrice(bundle, off);
  const kept = removable.filter((g) => !off.includes(g));
  const groupsParam = keptGroupsParam(bundle, kept);
  const href = `/subscription/checkout?bundleId=${bundle.id}${groupsParam ? `&groups=${groupsParam.join(",")}` : ""}`;

  const groups = visibleGroups(bundle, ownKeys);

  const toggle = (group: string, on: boolean) =>
    setOff((prev) => (on ? prev.filter((g) => g !== group) : [...prev, group]));

  return (
    <Shell>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-blue-950 dark:text-blue-100">
          {meta?.name ?? bundle.title} · {durationLabel(bundle)}
        </h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">{meta?.tagline ?? bundle.description}</p>
        {bundle.customizable && removable.length > 1 && (
          <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-sm font-bold text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
            <SlidersHorizontal size={15} /> اشتراكك على كيفك: أوقف ما لا تحتاجه من المميزات وادفع أقل
          </p>
        )}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          {groups.map((group) => {
            const canRemove = removable.includes(group.group);
            const isOn = !off.includes(group.group);
            // The last main feature can't be switched off.
            const isLast = isOn && kept.length === 1 && canRemove;
            return (
              <GroupCard
                key={group.group}
                group={group}
                canRemove={canRemove}
                isOn={isOn}
                isLast={isLast}
                onToggle={(on) => toggle(group.group, on)}
              />
            );
          })}
        </div>

        <aside className="hidden flex-col gap-4 rounded-3xl border border-zinc-200 bg-white p-6 lg:sticky lg:top-6 lg:flex dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500">{bundle.audience ? `باقة ${AUDIENCE_LABELS[bundle.audience]}` : ""}</p>
          <div>
            {price < bundle.price && (
              <span className="block text-sm text-zinc-400 line-through">{formatMoney(bundle.price)} ج.م</span>
            )}
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold tabular-nums text-blue-950 dark:text-blue-100"><AnimatedMoney value={price} /></span>
              <span className="text-sm text-zinc-600 dark:text-zinc-300">ج.م · {durationLabel(bundle)}</span>
            </div>
            {term > 1 && <p className="mt-1 text-xs text-zinc-500">≈ <AnimatedMoney value={Math.round(price / term)} /> ج.م شهريًا</p>}
            {price < bundle.price && (
              <p className="mt-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                وفّرت <AnimatedMoney value={bundle.price - price} /> ج.م بحذف {off.length === 1 ? "ميزة" : `${off.length} مميزات`}
              </p>
            )}
          </div>
          <Link
            href={href}
            className="rounded-full bg-blue-950 py-3 text-center font-semibold text-white transition hover:bg-blue-900 dark:bg-blue-100 dark:text-blue-950 dark:hover:bg-white"
          >
            اشترك
          </Link>
          {removable.length > 1 && (
            <p className="text-xs leading-5 text-zinc-500">
              السعر النهائي مع أي كوبون يظهر في الخطوة التالية. يمكنك إضافة ميزة حذفتها لاحقًا من &quot;باقتي وحدودها&quot;.
            </p>
          )}
        </aside>
      </div>

      {/* Phones: the price and the button stay in reach while scrolling the features. */}
      <div className="h-24 lg:hidden" />
      <MobilePriceBar
        price={<AnimatedMoney value={price} suffix=" ج.م" />}
        note={price < bundle.price ? <>وفّرت <AnimatedMoney value={bundle.price - price} /> ج.م</> : durationLabel(bundle)}
        action={
          <Link href={href} className="rounded-full bg-blue-950 px-8 py-3 font-semibold text-white dark:bg-blue-100 dark:text-blue-950">
            اشترك
          </Link>
        }
      />
    </Shell>
  );
}

// The plan's groups (or its features grouped by main feature, for plans
// without groups), limited to the audience's features.
const visibleGroups = (bundle: Bundle, ownKeys: Set<string>): BundleGroup[] => {
  const keep = (f: BundleFeature) => ownKeys.size === 0 || ownKeys.has(f.feature);
  const source: BundleGroup[] = bundle.groups?.length
    ? bundle.groups
    : [...new Set(bundle.features.map((f) => f.group))].map((group) => ({
        group,
        removable: false,
        discountPercent: null,
        saving: null,
        features: bundle.features.filter((f) => f.group === group),
      }));
  return source.map((g) => ({ ...g, features: g.features.filter(keep) })).filter((g) => g.features.length > 0);
};

function GroupCard({
  group,
  canRemove,
  isOn,
  isLast,
  onToggle,
}: {
  group: BundleGroup;
  canRemove: boolean;
  isOn: boolean;
  isLast: boolean;
  onToggle: (on: boolean) => void;
}) {
  return (
    <section
      className={cn(
        "rounded-3xl border bg-white p-6 transition dark:bg-zinc-900",
        isOn ? "border-zinc-200 dark:border-zinc-800" : "border-dashed border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/60",
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        <h2 className={cn("flex-1 text-lg font-bold", isOn ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500")}>
          {FEATURE_GROUP_LABELS[group.group] ?? group.group}
        </h2>
        {canRemove ? (
          <>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-bold",
                isOn ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
              )}
            >
              −{group.discountPercent}٪{group.saving ? ` · وفّر ${formatMoney(group.saving)} ج.م` : ""}
            </span>
            <span title={isLast ? "اترك ميزة رئيسية واحدة على الأقل" : undefined}>
              <Switch
                checked={isOn}
                disabled={isLast}
                onCheckedChange={(next) => onToggle(next)}
                aria-label={FEATURE_GROUP_LABELS[group.group] ?? group.group}
                className="bg-zinc-300 data-[checked]:bg-blue-600 dark:bg-zinc-700 dark:data-[checked]:bg-blue-500"
              />
            </span>
          </>
        ) : (
          <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
            <Lock size={12} /> مضمّنة دائمًا
          </span>
        )}
      </div>
      {!isOn && <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">أوقفتها: يبقى لك من مزاياها ما يلي</p>}

      <ul className="mt-4 flex flex-col gap-3 text-sm">
        {group.features.map((feature) => {
          const on = isFeatureOn(feature);
          const left = leftOutText(feature);
          const rate = rateLimitText(feature);
          const value = feature.type === "Access" ? null : featureValueText(feature.type, feature.access, feature.limit);
          return (
            <li key={feature.feature} className="flex items-start gap-2">
              {(isOn ? on : feature.accessIfLeftOut && feature.accessIfLeftOut !== "Off") ? (
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <X className="mt-0.5 size-4 shrink-0 text-zinc-400" />
              )}
              <span className={cn(!on && isOn && "opacity-50")}>
                {featureLabel(feature.feature, feature.displayName)}
                {isOn ? (
                  value && <b> · {value}</b>
                ) : (
                  <>
                    {" · "}
                    <b className="text-amber-700 dark:text-amber-400">{left ?? "غير متاح"}</b>
                    {value && <span className="text-zinc-400"> بدلًا من {value}</span>}
                    {feature.type === "Access" && on && <span className="text-zinc-400"> بدلًا من متاح</span>}
                  </>
                )}
                {isOn && on && rate && <span className="block text-xs text-zinc-500">{rate}</span>}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div dir="rtl" className="min-h-screen bg-zinc-100 px-6 py-10 sm:px-10 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/subscription"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition hover:text-blue-950 dark:text-zinc-400 dark:hover:text-blue-100"
        >
          <ArrowRight className="size-4" /> كل الباقات
        </Link>
        {children}
      </div>
    </div>
  );
}

const PlanDetailsPage = () => (
  <Suspense fallback={null}>
    <PlanDetailsContent />
  </Suspense>
);

export default PlanDetailsPage;
