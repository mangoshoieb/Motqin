// Plans, wallet, Paymob top-ups, subscriptions and partners. Shapes follow
// the backend's "Motqin Payments Front Guide" (captured from the dev server).
// Money is EGP; dates are UTC (some come without a zone — see toUtcDate).

export type BundleKind = "Guest" | "Free" | "Paid";
export type BundleAudience = "Student" | "Teacher" | "Mentor";
export type FeatureAccess = "Off" | "Limited" | "Unlimited";
export type FeatureType = "Usage" | "Allowance" | "Access";

export type FeatureKey =
  | "StudySessions"
  | "AiStudyPlanner"
  | "PerformanceRange"
  | "SpacedRepetitionSessions"
  | "AiImageQuestion"
  | "AiPdfQuestions"
  | "CustomSubjects"
  | "CustomLessons"
  | "CustomQuestions"
  | "CustomReviewIntervals"
  | "BlockerSchedules"
  | "BlockerSessions"
  | "Mentors"
  | "TrackingTables"
  | "TrackedStudents"
  | "TableAssistants"
  | "ExcelImports"
  | "TablePerformance"
  | "ParentMessages"
  | "Mentees";

export interface BundleFeature {
  feature: FeatureKey | string;
  displayName: string;
  group: string;
  type: FeatureType;
  access: FeatureAccess;
  limit: number | null;
  rateLimitCount: number | null;
  rateLimitWindowMinutes: number | null;
  cooldownMinutes: number | null;
  // What's kept if the feature's main feature is taken off (half of Free,
  // rounded up); null when it can't be taken off.
  accessIfLeftOut?: FeatureAccess | null;
  limitIfLeftOut?: number | null;
}

// A main feature: the unit a student can take off a customisable plan.
export type MainFeature = "StudyPlanner" | "SpacedRepetition" | "DistractionBlocker" | "TrackingTables" | "Mentor";

export interface BundleGroup {
  group: MainFeature | string;
  removable: boolean;
  discountPercent: number | null; // % off when taken off
  saving: number | null; // EGP saved taking off only this one, for this term
  features: BundleFeature[];
}

// GET /bundles, /bundles/{id}, /admin/bundles
export interface Bundle {
  id: number;
  title: string; // "Plus · 1 month" (English, from the catalogue)
  description: string | null;
  price: number;
  durationDays: number;
  kind: BundleKind;
  audience: BundleAudience | null;
  code: string | null; // "S2-6M"
  quotaPeriod: "Monthly" | "Lifetime" | string;
  isHidden: boolean;
  isActive: boolean;
  partnerId: number | null;
  features: BundleFeature[];
  // "اشتراكك على كيفك": true when main features can be taken off (S plans).
  customizable?: boolean;
  groupDiscounts?: Record<string, number>;
  groups?: BundleGroup[];
}

// --- Wallet ------------------------------------------------------------------

export interface Wallet {
  balance: number;
  updatedAt: string;
}

export type WalletTransactionType = "Deposit" | "Subscribe" | "Renewal" | "Upgrade" | "Downgrade";
export type PaymentStatus = "Pending" | "Succeeded" | "Failed" | "Expired";

export interface WalletTransaction {
  id: number;
  amount: number; // + top-up, - spending
  type: WalletTransactionType;
  status: PaymentStatus;
  paymentMethod: string | null;
  reference: string | null;
  userSubscriptionId: number | null;
  createdAt: string;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// POST /payment/recharge-wallet
export interface RechargeStart {
  redirectUrl: string;
  reference: string;
  expiresAt: string;
}

// GET /payment/recharges/{reference}
export interface Recharge {
  reference: string;
  status: PaymentStatus;
  requestedAmount: number;
  receivedAmount: number | null;
  paymentMethod: string | null;
  createdAt: string;
  expiresAt: string;
}

// --- Subscription --------------------------------------------------------------

export type SubscriptionStatus = "Scheduled" | "Active" | "Expired" | "Replaced";

export interface UserSubscription {
  id: number;
  bundleId: number;
  bundleTitle: string;
  kind: BundleKind;
  status: SubscriptionStatus;
  replacedReason: "Upgrade" | "Superseded" | null;
  startDate: string | null;
  endDate: string | null;
  inGrace: boolean;
  graceEndsAt: string | null;
  listPrice: number; // after taking features off, before the coupon
  discountAmount: number;
  pricePaid: number;
  couponCode: string | null;
  groups?: string[] | null; // main features kept; null = the whole plan
}

export interface Quota {
  feature: FeatureKey | string;
  displayName: string;
  group: string;
  type: FeatureType;
  access: FeatureAccess;
  limit: number | null;
  used: number;
  remaining: number | null; // null = unlimited
  resetsAt: string | null;
  lifetime: boolean;
  // false: its main feature was taken off the plan (half of Free is left).
  included?: boolean;
}

// GET /subscription/me
export interface MySubscription {
  current: UserSubscription;
  scheduled: UserSubscription | null;
  quotas: Quota[];
}

export type PurchaseOperation = "Purchase" | "Renewal" | "Upgrade" | "Downgrade" | "Scheduled";

// POST /subscription/preview — always 200; problems in couponError / blockedReason.
// The price comes in steps: fullPrice − featuresDiscount = listPrice, then
// the coupon's discountAmount comes off listPrice.
export interface PurchasePreview {
  operation: PurchaseOperation | null;
  fullPrice?: number;
  featuresDiscountPercent?: number;
  featuresDiscount?: number;
  groups?: string[] | null;
  listPrice: number;
  discountPercent: number;
  discountAmount: number;
  amountDue: number;
  walletBalance: number;
  suggestedRechargeAmount: number;
  couponError: string | null;
  blockedReason: string | null;
  startsAt: string | null;
  endsAt: string | null;
}

// POST /subscription/purchase
export interface PurchaseResult {
  operation: PurchaseOperation;
  subscription: UserSubscription;
  amountCharged: number;
  walletBalance: number;
}

// --- Partners ------------------------------------------------------------------

export type PartnerType = "Teacher" | "Center";

export interface Partner {
  id: number;
  name: string;
  type: PartnerType;
  contactPhone: string | null;
  commissionPercent: number;
  isActive: boolean;
  linkedUserId: string | null;
  createdAt: string;
}

export interface SalesLine {
  name: string;
  count: number;
  revenue: number;
  commission: number;
}

export interface RecentSale {
  studentName: string;
  bundleTitle: string;
  pricePaid: number;
  commission: number;
  couponCode: string | null;
  purchasedAt: string;
}

// GET /partners/me and /admin/partners/{id}/report
export interface PartnerReport {
  partner: Partner;
  from: string | null;
  to: string | null;
  sales: number;
  students: number;
  revenue: number;
  commission: number;
  byMonth: SalesLine[];
  byBundle: SalesLine[];
  byCode: SalesLine[];
  recent: RecentSale[];
}

// --- Admin ---------------------------------------------------------------------

// GET /admin/features — the 20 keys a bundle must state.
export interface FeatureCatalogueItem {
  feature: FeatureKey | string;
  displayName: string;
  group: string;
  type: FeatureType;
  checkedWhen: string;
  countedWhen: string;
  givenBackWhen: string;
  cap: number | null;
}

export interface BundleFeatureInput {
  feature: string;
  access: FeatureAccess;
  limit: number | null;
  rateLimitCount?: number | null;
  rateLimitWindowMinutes?: number | null;
  cooldownMinutes?: number | null;
}

export interface SaveBundleBody {
  title: string;
  description: string | null;
  price: number;
  durationDays: number;
  audience: BundleAudience;
  isHidden: boolean;
  partnerId: number | null;
  code: string | null;
  features: BundleFeatureInput[] | null; // null keeps them on edit
  // Main features students may take off, with % off each. {} = sold whole;
  // null (on edit) keeps the current ones.
  groupDiscounts?: Record<string, number> | null;
}

export interface CatalogueEntry {
  code: string;
  title: string;
  bundleId: number | null;
  status: "Unchanged" | "Updated" | "Created" | string;
  changes: string[];
}

export interface CatalogueReport {
  dryRun: boolean;
  systemBundles: CatalogueEntry[];
  plans: CatalogueEntry[];
  notInCatalogue: { bundleId: number; title: string; code: string | null; isActive: boolean; retired: boolean }[];
}

export interface Coupon {
  id: number;
  code: string;
  discountPercent: number;
  maxRedemptions: number | null;
  redemptionCount: number;
  validFrom: string | null;
  validUntil: string | null;
  firstPurchaseOnly: boolean;
  isActive: boolean;
  partnerId: number | null;
  batchId: number | null;
  bundleIds: number[];
  createdAt: string;
  // false: refused when the student took main features off.
  allowOnCustomized?: boolean;
}

export interface SaveCouponBody {
  code?: string | null; // create only
  discountPercent: number;
  maxRedemptions: number | null;
  validFrom: string | null;
  validUntil: string | null;
  firstPurchaseOnly: boolean;
  isActive: boolean;
  partnerId: number | null;
  bundleIds: number[];
  // Every field is replaced on update: always send it.
  allowOnCustomized: boolean;
}

export interface CouponQuery {
  active?: boolean;
  batchId?: number;
  partnerId?: number;
  page?: number;
  pageSize?: number;
}

export interface VoucherBatchBody {
  name: string;
  count: number;
  discountPercent: number;
  bundleIds: number[];
  validFrom: string | null;
  validUntil: string | null;
  partnerId: number | null;
  allowOnCustomized: boolean;
}

export interface VoucherBatch {
  id: number;
  name: string;
  count: number;
  discountPercent: number;
  partnerId: number | null;
  createdAt: string;
  codes: string[];
}

export interface CouponRedemptionItem {
  code: string;
  userId: string;
  studentName: string;
  bundleId: number;
  bundleTitle: string;
  listPrice: number;
  discountAmount: number;
  pricePaid: number;
  redeemedAt: string;
}

export interface CouponUsage {
  coupon: Coupon | null;
  batchName: string | null;
  codesInBatch: number | null;
  redemptions: number;
  distinctStudents: number;
  totalDiscount: number;
  revenue: number;
  byBundle: SalesLine[];
  items: CouponRedemptionItem[];
}

export interface SavePartnerBody {
  name: string;
  type: PartnerType;
  contactPhone: string | null;
  commissionPercent: number;
  isActive: boolean;
}

export interface AdminUser {
  userId: string;
  fullName: string;
  phoneNumber: string | null;
  role?: string;
}

export interface PaymentMismatch {
  transactionId: number;
  reference: string;
  paymobTransactionId: string | null;
  userId: string;
  requestedAmount: number;
  receivedAmount: number;
  paymentMethod: string | null;
  createdAt: string;
}

export type UserRole =
  | "Student"
  | "Teacher"
  | "ParentOrMonitor"
  | "ContentManager"
  | "SupportModerator"
  | "Manager"
  | "Admin";
