"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, SlidersHorizontal, TicketPercent, X } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { AnimatedMoney } from "./AnimatedMoney";
import {
  CARD_FEATURES,
  FEATURE_GROUP_LABELS,
  HIGHLIGHTED_TIERS,
  PER_UNIT_FEATURE,
  STUDENT_CARD_GROUPS,
  TERM_EVERY,
  TIER_META,
  type TermMonths,
} from "@/app/constants/payment.constants";
import {
  customPrice,
  featureLabel,
  featureValueText,
  findFeature,
  isFeatureOn,
  keptGroupsParam,
  removableGroups,
  savingPercent,
} from "@/app/lib/payments";
import { errorCodeMessage } from "@/app/lib/error-codes";
import { useAuthKind } from "@/app/hooks/useAuthKind";
import { usePurchasePreview } from "@/app/hooks/usePayments";
import { Bundle, BundleAudience, BundleFeature, FeatureKey } from "@/app/types/payment.types";

// One plan at the chosen term: the price per month in big type, what the
// whole term costs, and the features grouped by main feature. A
// customisable plan has a checkbox on each main feature it can drop; taking
// one off lowers the price on the spot, and an applied coupon comes off on
// top. Every number counts to its new value instead of jumping.
export function PlanCard({
  tier,
  bundle,
  monthly,
  term,
  audience,
  isCurrent,
  currentGroups,
  buyDisabled,
  coupon,
}: {
  tier: string;
  bundle: Bundle;
  monthly: Bundle | undefined; // the same tier's 1-month plan, for the saving
  term: TermMonths;
  audience: BundleAudience;
  isCurrent: boolean;
  // The main features the current plan kept: renewing keeps them.
  currentGroups?: string[] | null;
  buyDisabled: boolean;
  coupon: string; // applied coupon, "" when none
}) {
  const meta = TIER_META[tier];
  const highlighted = HIGHLIGHTED_TIERS.includes(tier);
  const registered = useAuthKind() === "user";

  // The main features taken off. Kept by name, so switching the term keeps
  // the choice; only the ones this bundle can drop count.
  const removable = buyDisabled ? [] : removableGroups(bundle);
  const [dropped, setDropped] = useState<string[]>(() =>
    isCurrent && currentGroups?.length
      ? removableGroups(bundle).map((g) => g.group).filter((g) => !currentGroups.includes(g))
      : [],
  );
  const off = removable.map((g) => g.group).filter((g) => dropped.includes(g));
  const kept = removable.map((g) => g.group).filter((g) => !off.includes(g));
  const toggle = (group: string) =>
    setDropped((prev) => (prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]));
  // At least one main feature stays.
  const canDrop = (group: string) => !(kept.length === 1 && kept[0] === group);
  const groupsParam = keptGroupsParam(bundle, kept);

  // The coupon's effect on this plan, with these features (saves nothing).
  const { data: preview } = usePurchasePreview(bundle.id, coupon, groupsParam, registered && !!coupon && !buyDisabled);
  const couponApplies = !!coupon && !!preview && !preview.couponError && preview.discountAmount > 0;
  const couponNote =
    coupon && preview?.couponError === "coupon_not_for_customized"
      ? errorCodeMessage(preview.couponError) ?? "هذا الكوبون لا يُطبَّق على الباقات المخصّصة"
      : null;

  const listPrice = customPrice(bundle, off);
  const featuresSaving = bundle.price - listPrice;
  const couponSaving = couponApplies ? preview!.discountAmount : 0;
  const price = Math.max(0, listPrice - couponSaving);
  const perMonth = Math.round(price / term);
  const fullPerMonth = Math.round(bundle.price / term);

  const termSaving = savingPercent(bundle.price, monthly?.price, term);
  // Struck through: the 1-month price when a longer term saves, otherwise
  // the plan's own price once features or a coupon brought it down.
  const struck = termSaving > 0 && monthly ? monthly.price : perMonth < fullPerMonth ? fullPerMonth : null;
  const perUnit = PER_UNIT_FEATURE[audience];
  const unitLimit = perUnit ? findFeature(bundle, perUnit.feature)?.limit : null;
  const muted = highlighted ? "text-blue-200" : "text-zinc-500 dark:text-zinc-400";

  const checkoutHref =
    `/subscription/checkout?bundleId=${bundle.id}` +
    (groupsParam ? `&groups=${groupsParam.join(",")}` : "") +
    (couponApplies ? `&coupon=${encodeURIComponent(coupon)}` : "");

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-3xl border p-8 transition",
        highlighted
          ? "border-blue-900 bg-blue-950 text-white shadow-xl md:scale-[1.03] dark:border-blue-800 dark:bg-blue-900"
          : "border-zinc-200 bg-white text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100",
        isCurrent && !highlighted && "ring-2 ring-emerald-500",
      )}
    >
      {highlighted && (
        <span className="absolute -top-3 right-6 rounded-full bg-amber-400 dark:bg-amber-600 px-3 py-1 text-xs font-bold text-zinc-900">
          الأكثر طلباً
        </span>
      )}
      {isCurrent && (
        <span
          className={cn(
            "absolute -top-3 rounded-full bg-emerald-500 dark:bg-emerald-700 px-3 py-1 text-xs font-bold text-white",
            highlighted ? "right-32" : "right-6",
          )}
        >
          باقتك الحالية
        </span>
      )}
      {termSaving > 0 && (
        <span className="absolute -top-3 left-6 rounded-full bg-emerald-500 dark:bg-emerald-700 px-3 py-1 text-xs font-bold text-white">
          وفّر {termSaving}٪
        </span>
      )}

      <h3 className="text-xl font-bold">{meta?.name ?? bundle.title}</h3>

      <div className="mt-6">
        {struck !== null && (
          <span className={cn("block text-sm line-through", highlighted ? "text-blue-300" : "text-zinc-400 dark:text-zinc-500")}>
            <AnimatedMoney value={struck} suffix=" ج.م" />
          </span>
        )}
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-extrabold tabular-nums">
            <AnimatedMoney value={perMonth} />
          </span>
          <span className="text-sm">ج.م / شهرياً</span>
        </div>
        <p className={cn("mt-1 text-xs", muted)}>
          يُدفع <AnimatedMoney value={price} /> ج.م {TERM_EVERY[term]}
        </p>
        {perUnit && unitLimit ? (
          <p className={cn("mt-1 text-xs", muted)}>
            ≈ <AnimatedMoney value={Math.round((perMonth / unitLimit) * 10) / 10} /> ج.م {perUnit.label}
          </p>
        ) : null}

        {/* What the choices on this card save, for the whole term. */}
        {(featuresSaving > 0 || couponSaving > 0) && (
          <div
            className={cn(
              "mt-3 flex flex-col gap-1 rounded-xl px-3 py-2 text-xs font-semibold",
              highlighted ? "bg-white/10 text-emerald-200" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
            )}
          >
            {featuresSaving > 0 && (
              <span className="flex items-center gap-1.5">
                <SlidersHorizontal size={13} /> وفّرت <AnimatedMoney value={featuresSaving} /> ج.م بإزالة ما لا تحتاجه
              </span>
            )}
            {couponSaving > 0 && (
              <span className="flex items-center gap-1.5">
                <TicketPercent size={13} /> الكوبون يوفّر <AnimatedMoney value={couponSaving} /> ج.م ({preview!.discountPercent}٪)
              </span>
            )}
          </div>
        )}
        {couponNote && <p className={cn("mt-2 text-xs", highlighted ? "text-amber-200" : "text-amber-700 dark:text-amber-400")}>{couponNote}</p>}
        {removable.length > 1 && off.length === 0 && (
          <p className={cn("mt-3 text-xs", muted)}>ألغِ تحديد ما لا تحتاجه من المميزات الرئيسية وادفع أقل.</p>
        )}
      </div>

      {buyDisabled ? (
        <span
          className={cn(
            "mt-6 w-full cursor-not-allowed rounded-full py-3 text-center font-semibold opacity-50",
            highlighted ? "bg-white text-blue-950" : "border border-blue-600 text-blue-600 dark:text-blue-400",
          )}
        >
          اختر الخطة
        </span>
      ) : (
        <Link
          href={checkoutHref}
          className={cn(
            "mt-6 w-full rounded-full py-3 text-center font-semibold transition",
            highlighted
              ? "bg-white text-blue-950 hover:bg-blue-50 dark:hover:bg-blue-500/10"
              : "border border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40",
          )}
        >
          {isCurrent ? "جدّد الخطة" : "اشترك"}
        </Link>
      )}

      {audience === "Student" ? (
        <StudentFeatureGroups
          bundle={bundle}
          highlighted={highlighted}
          removable={removable.map((g) => g.group)}
          off={off}
          canDrop={canDrop}
          onToggle={toggle}
        />
      ) : (
        <>
          {removable.length > 1 && (
            <div className="mt-6 flex flex-col gap-2 text-sm">
              <p className={cn("text-xs font-semibold", muted)}>المميزات الرئيسية</p>
              {removable.map((g) => (
                <GroupCheckbox
                  key={g.group}
                  label={FEATURE_GROUP_LABELS[g.group] ?? g.group}
                  checked={!off.includes(g.group)}
                  disabled={!canDrop(g.group)}
                  highlighted={highlighted}
                  onChange={() => toggle(g.group)}
                />
              ))}
            </div>
          )}
          <ul className="mt-6 flex flex-col gap-5 text-sm">
            {CARD_FEATURES[audience].map((key) => {
              const feature = findFeature(bundle, key);
              if (!feature) return null;
              const value = rowValue(feature, key, off.length > 0 && isLeftOut(bundle, off, key));
              return (
                <li key={key} className={cn("flex items-start gap-2", value && !value.on && "opacity-50")}>
                  {value?.on !== false ? (
                    <Check
                      className={cn("mt-0.5 size-4 shrink-0", highlighted ? "text-emerald-300" : "text-emerald-600 dark:text-emerald-400")}
                    />
                  ) : (
                    <X className="mt-0.5 size-4 shrink-0" />
                  )}
                  <span>
                    {featureLabel(key, feature.displayName)}
                    {feature.type !== "Access" && value && (
                      <span className={cn("font-bold", highlighted ? "text-white" : "text-zinc-900 dark:text-zinc-100")}>
                        {" "}
                        · {value.text}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

// A main feature's keep/drop box: checked = in the plan.
function GroupCheckbox({
  label,
  checked,
  disabled,
  highlighted,
  onChange,
  className,
}: {
  label: string;
  checked: boolean;
  disabled: boolean;
  highlighted: boolean;
  onChange: () => void;
  className?: string;
}) {
  return (
    <label
      className={cn("flex cursor-pointer items-center gap-2.5", disabled && "cursor-not-allowed", className)}
      title={disabled ? "يجب أن تبقى ميزة رئيسية واحدة على الأقل" : checked ? "إزالة من الباقة" : "إضافة إلى الباقة"}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className={cn(
          "size-[18px] shrink-0 cursor-pointer rounded disabled:cursor-not-allowed",
          highlighted ? "accent-white" : "accent-blue-600",
        )}
      />
      <span className={cn("font-bold", !checked && "line-through opacity-60")}>{label}</span>
    </label>
  );
}

// Whether a feature belongs to a main feature that's been taken off.
const isLeftOut = (bundle: Bundle, off: string[], key: string) =>
  (bundle.groups ?? []).some((g) => off.includes(g.group) && g.features.some((f) => f.feature === key));

// The row's value: the plan's limit — or, when its main feature is taken
// off, what's left of it (accessIfLeftOut). Performance tracking reads as
// "لأي فترة" (any range) vs the always-available basic report.
const rowValue = (feature: BundleFeature | undefined, key: FeatureKey | undefined, leftOut = false) => {
  if (!key || !feature) return null;
  const access = leftOut ? feature.accessIfLeftOut ?? "Off" : feature.access;
  const limit = leftOut ? feature.limitIfLeftOut ?? null : feature.limit;
  const on = access !== "Off" && (leftOut || isFeatureOn(feature));
  if (key === "PerformanceRange") return { text: on ? "لأي فترة" : "أساسي", on: true };
  return { text: featureValueText(feature.type, access, limit), on };
};

// Student plans: the features grouped by main feature (المخطط، التكرار
// المتباعد…). A group this plan can drop has a checkbox in its heading;
// unchecked, its rows show what's left without it.
function StudentFeatureGroups({
  bundle,
  highlighted,
  removable,
  off,
  canDrop,
  onToggle,
}: {
  bundle: Bundle;
  highlighted: boolean;
  removable: string[];
  off: string[];
  canDrop: (group: string) => boolean;
  onToggle: (group: string) => void;
}) {
  // A single removable group can't be dropped (one must stay), so no boxes.
  const choosable = removable.length > 1;
  return (
    <div className="mt-6 flex flex-col gap-5 text-sm">
      {STUDENT_CARD_GROUPS.map((group, index) => {
        const dropped = off.includes(group.group);
        return (
          <section
            key={group.title}
            className={cn(
              index > 0 && "border-t pt-5",
              highlighted ? "border-white/15" : "border-zinc-100 dark:border-zinc-800",
            )}
          >
            {choosable && removable.includes(group.group) ? (
              <GroupCheckbox
                label={group.title}
                checked={!dropped}
                disabled={!canDrop(group.group)}
                highlighted={highlighted}
                onChange={() => onToggle(group.group)}
                className={cn("mb-2.5 text-base", highlighted ? "text-white" : "text-zinc-900 dark:text-zinc-100")}
              />
            ) : (
              <h4 className={cn("mb-2.5 text-base font-bold", highlighted ? "text-white" : "text-zinc-900 dark:text-zinc-100")}>
                {group.title}
              </h4>
            )}
            <ul className="flex flex-col gap-2">
              {group.rows.map((row) => {
                const feature = row.feature ? findFeature(bundle, row.feature) : undefined;
                const value = rowValue(feature, row.feature, dropped && !!feature?.accessIfLeftOut);
                // Without its main feature, a row with no limit of its own is gone.
                const gone = dropped && (!value || !feature?.accessIfLeftOut);
                const off = gone || (value && !value.on);
                const label = Array.isArray(row.label) ? row.label.join(" ← ") : row.label;
                return (
                  <li key={label} className={cn("flex items-start gap-2 transition-opacity", off && "opacity-50")}>
                    {off ? (
                      <X className="mt-0.5 size-4 shrink-0" />
                    ) : (
                      <Check
                        className={cn("mt-0.5 size-4 shrink-0", highlighted ? "text-emerald-300" : "text-emerald-600 dark:text-emerald-400")}
                      />
                    )}
                    <span className="min-w-0 flex-1">
                      {Array.isArray(row.label) ? (
                        <>
                          <span dir={/[a-z]/i.test(row.label[0]) ? "ltr" : undefined}>{row.label[0]}</span>
                          <span className={cn("mx-1", highlighted ? "text-blue-200" : "text-zinc-400")} aria-label="إلى">←</span>
                          {row.label[1]}
                        </>
                      ) : (
                        <span dir={/^[a-z]/i.test(row.label) ? "ltr" : undefined}>{row.label}</span>
                      )}
                    </span>
                    {value && !gone && (
                      <span
                        className={cn(
                          "shrink-0 font-bold tabular-nums",
                          highlighted ? "text-white" : "text-zinc-900 dark:text-zinc-100",
                        )}
                      >
                        {value.text}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
