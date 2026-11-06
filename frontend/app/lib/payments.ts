import {
  ADMIN_ROLES,
  FEATURE_META,
  MANAGER_ROLES,
  PARENT_ROLES,
  TEACHER_ROLES,
  TERM_LABELS,
  TERM_MONTHS,
  TIER_META,
  type TermMonths,
} from "../constants/payment.constants";
import {
  Bundle,
  BundleAudience,
  BundleFeature,
  FeatureAccess,
  FeatureKey,
  FeatureType,
} from "../types/payment.types";

// --- Roles -------------------------------------------------------------------

type RoleCarrier = { role?: string | null; roles?: string[] } | null | undefined;

const rolesOf = (user: RoleCarrier) => [...(user?.roles ?? []), ...(user?.role ? [user.role] : [])];

export const hasAnyRole = (user: RoleCarrier, roles: string[]) => rolesOf(user).some((r) => roles.includes(r));

export const isTeacherAccount = (user: RoleCarrier) => hasAnyRole(user, TEACHER_ROLES);
export const isManager = (user: RoleCarrier) => hasAnyRole(user, MANAGER_ROLES);
export const isAdmin = (user: RoleCarrier) => hasAnyRole(user, ADMIN_ROLES);

// The plans an account sees first — the server's own default for /bundles.
export const audienceForUser = (user: RoleCarrier): BundleAudience =>
  isTeacherAccount(user) ? "Teacher" : hasAnyRole(user, PARENT_ROLES) ? "Mentor" : "Student";

// --- Dates and money -----------------------------------------------------------

// createdAt / updatedAt come without a zone but are UTC.
export const toUtcDate = (iso: string | null | undefined) => {
  if (!iso) return null;
  const hasZone = /([zZ]|[+-]\d\d:?\d\d)$/.test(iso);
  const date = new Date(hasZone ? iso : `${iso}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const dayFormat = new Intl.DateTimeFormat("ar-EG", { day: "numeric", month: "long", year: "numeric" });
const dateTimeFormat = new Intl.DateTimeFormat("ar-EG", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export const formatDay = (iso: string | null | undefined) => {
  const date = toUtcDate(iso);
  return date ? dayFormat.format(date) : "—";
};

export const formatDateTime = (iso: string | null | undefined) => {
  const date = toUtcDate(iso);
  return date ? dateTimeFormat.format(date) : "—";
};

const moneyFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

export const formatMoney = (amount: number) => moneyFormat.format(amount);
export const formatEgp = (amount: number) => `${formatMoney(amount)} ج.م`;

// --- Plans ---------------------------------------------------------------------

// "S2-6M" → "S2". Plans without a catalogue code (made in the dashboard)
// have no tier.
export const tierOf = (bundle: Pick<Bundle, "code">) => bundle.code?.split("-")[0] ?? null;

export const termOf = (bundle: Pick<Bundle, "code" | "durationDays">): TermMonths | null => {
  const suffix = bundle.code?.split("-")[1];
  const fromCode = suffix ? Number(suffix.replace(/m$/i, "")) : NaN;
  if (TERM_MONTHS.includes(fromCode as TermMonths)) return fromCode as TermMonths;
  const months = Math.round(bundle.durationDays / 30);
  return TERM_MONTHS.includes(months as TermMonths) ? (months as TermMonths) : months >= 12 ? 12 : null;
};

export const durationLabel = (bundle: Pick<Bundle, "code" | "durationDays">) => {
  const term = termOf(bundle);
  return term ? TERM_LABELS[term] : `${bundle.durationDays} يوم`;
};

// "متقن · 6 أشهر"; free/guest and dashboard-made plans fall back sensibly.
export const bundleName = (bundle: Pick<Bundle, "code" | "durationDays" | "kind" | "title">) => {
  if (bundle.kind === "Free") return "الباقة المجانية";
  if (bundle.kind === "Guest") return "تجربة الزائر";
  const tier = tierOf(bundle);
  const meta = tier ? TIER_META[tier] : undefined;
  return meta ? `${meta.name} · ${durationLabel(bundle)}` : arabicPlanTitle(bundle.title);
};

export const tierName = (tier: string) => TIER_META[tier]?.name ?? tier;

// Sales and usage lists carry the catalogue's English title only
// ("Motqin · 1 month"); read it back into the Arabic name.
const ENGLISH_TIERS: Record<string, string> = {
  plus: "S1",
  motqin: "S2",
  "motqin pro": "S3",
  private: "T1",
  center: "T2",
  academy: "T3",
  family: "M1",
  mentor: "M2",
  supervisor: "M3",
};

export const arabicPlanTitle = (title: string) => {
  const [name, term] = title.split(" · ");
  const tier = ENGLISH_TIERS[name?.trim().toLowerCase() ?? ""];
  const months = Number(term?.match(/\d+/)?.[0]);
  if (!tier) return title;
  const label = TERM_MONTHS.includes(months as TermMonths) ? TERM_LABELS[months as TermMonths] : term;
  return label ? `${TIER_META[tier].name} · ${label}` : TIER_META[tier].name;
};

export interface PlanTier {
  tier: string; // "S2"
  terms: Partial<Record<TermMonths, Bundle>>;
}

// Free, then the audience's plans as tiers with their three terms.
export const groupPlans = (bundles: Bundle[]) => {
  const free = bundles.find((b) => b.kind === "Free") ?? null;
  const byTier = new Map<string, PlanTier>();
  for (const bundle of bundles) {
    if (bundle.kind !== "Paid") continue;
    const tier = tierOf(bundle);
    const term = termOf(bundle);
    if (!tier || !term) continue;
    const entry = byTier.get(tier) ?? { tier, terms: {} };
    entry.terms[term] = bundle;
    byTier.set(tier, entry);
  }
  const tiers = [...byTier.values()].sort((a, b) => a.tier.localeCompare(b.tier));
  return { free, tiers };
};

// The saving of a longer term against paying the 1-month price every month.
export const savingPercent = (price: number, monthlyPrice: number | undefined, months: number) => {
  if (!monthlyPrice || months <= 1) return 0;
  return Math.max(0, Math.round((1 - price / (monthlyPrice * months)) * 100));
};

// --- Features ------------------------------------------------------------------

export const featureLabel = (key: string, fallback?: string) =>
  FEATURE_META[key as FeatureKey]?.label ?? fallback ?? key;

export const featureNote = (key: string) => FEATURE_META[key as FeatureKey]?.note;

export const isFeatureOn = (feature: Pick<BundleFeature, "access">) => feature.access !== "Off";

// "100 شهريًا", "حتى 15", "بلا حدود", "متاح".
export const featureValueText = (type: FeatureType, access: FeatureAccess, limit: number | null) => {
  if (access === "Off") return "غير متاح";
  if (type === "Access") return "متاح";
  if (access === "Unlimited" || limit === null) return "بلا حدود";
  return type === "Usage" ? `${formatMoney(limit)} شهريًا` : `حتى ${formatMoney(limit)}`;
};

// "at most 3 per hour, then a 60 min wait"
export const rateLimitText = (feature: Pick<BundleFeature, "rateLimitCount" | "rateLimitWindowMinutes" | "cooldownMinutes">) => {
  if (!feature.rateLimitCount || !feature.rateLimitWindowMinutes) return null;
  const window = feature.rateLimitWindowMinutes === 60 ? "ساعة" : `${feature.rateLimitWindowMinutes} دقيقة`;
  const wait = feature.cooldownMinutes ? `، ثم انتظار ${feature.cooldownMinutes} دقيقة` : "";
  return `حتى ${feature.rateLimitCount} كل ${window}${wait}`;
};

export const findFeature = (bundle: Bundle | null | undefined, key: string) =>
  bundle?.features.find((f) => f.feature === key);

// --- Files ---------------------------------------------------------------------

export const downloadText = (text: string, filename: string, type = "text/csv;charset=utf-8") => {
  // BOM so Excel reads Arabic correctly.
  const blob = new Blob(["﻿", text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// <input type="datetime-local"> ↔ the API's ISO times.
export const toLocalInput = (iso: string | null | undefined) => {
  const date = toUtcDate(iso);
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const fromLocalInput = (value: string) => (value ? new Date(value).toISOString() : null);
