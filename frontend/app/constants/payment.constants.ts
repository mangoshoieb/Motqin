import {
  BundleAudience,
  FeatureKey,
  PaymentStatus,
  PurchaseOperation,
  SubscriptionStatus,
  UserRole,
  WalletTransactionType,
} from "../types/payment.types";

export const PAYMENT_ROUTES = {
  BUNDLES: "/bundles",
  BUNDLE: (id: number) => `/bundles/${id}`,
  WALLET: "/wallet",
  WALLET_TRANSACTIONS: "/wallet/transactions",
  RECHARGE: "/payment/recharge-wallet",
  RECHARGE_STATUS: (reference: string) => `/payment/recharges/${encodeURIComponent(reference)}`,
  MY_SUBSCRIPTION: "/subscription/me",
  SUBSCRIPTION_HISTORY: "/subscription/history",
  PREVIEW: "/subscription/preview",
  PURCHASE: "/subscription/purchase",
  MY_PARTNER: "/partners/me",
};

export const ADMIN_PAYMENT_ROUTES = {
  BUNDLES: "/admin/bundles",
  BUNDLE: (id: number) => `/admin/bundles/${id}`,
  BUNDLE_FEATURES: (id: number) => `/admin/bundles/${id}/features`,
  DEACTIVATE_BUNDLE: (id: number) => `/admin/bundles/${id}/deactivate`,
  APPLY_CATALOGUE: "/admin/bundles/catalogue/apply",
  FEATURES: "/admin/features",
  COUPONS: "/admin/coupons",
  COUPON: (id: number) => `/admin/coupons/${id}`,
  COUPON_USAGE: (id: number) => `/admin/coupons/${id}/usage`,
  BATCHES: "/admin/coupons/batches",
  BATCH_USAGE: (id: number) => `/admin/coupons/batches/${id}/usage`,
  PARTNERS: "/admin/partners",
  PARTNER: (id: number) => `/admin/partners/${id}`,
  PARTNER_USER: (id: number) => `/admin/partners/${id}/user`,
  PARTNER_REPORT: (id: number) => `/admin/partners/${id}/report`,
  MISMATCHES: "/admin/payments/mismatches",
  ADMINS: "/admin/admins",
  ADMIN: (userId: string) => `/admin/admins/${userId}`,
  USER_ROLE: (userId: string) => `/admin/users/${userId}/role`,
};

// Server limits on a top-up.
export const RECHARGE_MIN = 10;
export const RECHARGE_PRESETS = [50, 100, 200, 500];
// How often an open top-up is re-checked, and for how long at that pace.
export const RECHARGE_POLL_MS = 3000;
export const RECHARGE_SLOW_POLL_MS = 10_000;
export const RECHARGE_FAST_POLL_FOR_MS = 3 * 60_000;

export const WALLET_PAGE_SIZE = 20;
export const COUPONS_PAGE_SIZE = 20;

// --- Who's who ---------------------------------------------------------------

// Accounts the plans list treats as teachers ("teacher and above").
export const TEACHER_ROLES: string[] = ["Teacher", "ContentManager", "SupportModerator", "Manager", "Admin", "Support"];
export const PARENT_ROLES: string[] = ["ParentOrMonitor", "Parent"];
// The admin dashboard: Manager and Admin; the admins screen: Admin only.
export const MANAGER_ROLES: string[] = ["Manager", "Admin"];
export const ADMIN_ROLES: string[] = ["Admin"];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  Student: "طالب",
  Teacher: "مدرس",
  ParentOrMonitor: "ولي أمر / مرشد",
  ContentManager: "مدير محتوى",
  SupportModerator: "دعم فني",
  Manager: "مدير",
  Admin: "مسؤول النظام",
};

export const AUDIENCES: { value: BundleAudience; label: string }[] = [
  { value: "Student", label: "طالب" },
  { value: "Teacher", label: "مدرس" },
  { value: "Mentor", label: "ولي أمر ومرشد" },
];

export const AUDIENCE_LABELS: Record<BundleAudience, string> = {
  Student: "الطلاب",
  Teacher: "المدرسون",
  Mentor: "أولياء الأمور والمرشدون",
};

// --- Plans -------------------------------------------------------------------

// Arabic names for the catalogue's tiers (the part of the code before the
// dash). The API's titles and descriptions are English.
export const TIER_META: Record<string, { name: string; tagline: string }> = {
  S1: { name: "بلس", tagline: "للطلاب الذين يحتاجون المخطط والمراجعة مع قليل من مساعدة الذكاء الاصطناعي" },
  S2: { name: "متقن", tagline: "للمذاكرة اليومية: أسئلة بالذكاء الاصطناعي من كل درس وملف، ومتابعة تقدمك طوال الترم" },
  S3: { name: "متقن Pro", tagline: "للطامحين للقمة: أكبر قدر من الذكاء الاصطناعي، محتوى خاص بلا حدود، ومشرفون أكثر" },
  T1: { name: "خصوصي", tagline: "لمدرس لديه مجموعات قليلة في البيت أو في سنتر صغير" },
  T2: { name: "سنتر", tagline: "لمدرس لديه عدة مجموعات في السنتر ومساعد أو اثنان" },
  T3: { name: "أكاديمية", tagline: "لكبار مدرسي الثانوية في أكثر من سنتر مع فريق مساعدين كامل" },
  M1: { name: "أسرة", tagline: "لأولياء الأمور لمتابعة حتى 3 أبناء. متابعة ابن واحد مجانية دائمًا" },
  M2: { name: "مرشد", tagline: "للمدرسين الخصوصيين والمرشدين لمتابعة حتى 15 طالبًا" },
  M3: { name: "مشرف", tagline: "للمدارس والسناتر والمشرفين لمتابعة حتى 100 طالب" },
};

// The middle plan of each audience gets the "most popular" card.
export const HIGHLIGHTED_TIERS = ["S2", "T2", "M2"];

export const TERM_MONTHS = [1, 6, 12] as const;
export type TermMonths = (typeof TERM_MONTHS)[number];

export const TERM_LABELS: Record<TermMonths, string> = {
  1: "شهر واحد",
  6: "6 أشهر",
  12: "12 شهرًا",
};

export const TERM_EVERY: Record<TermMonths, string> = {
  1: "كل شهر",
  6: "كل 6 أشهر",
  12: "كل سنة",
};

// Plan cards list these features, in this order; the comparison table shows
// all of the audience's features.
export const CARD_FEATURES: Record<BundleAudience, FeatureKey[]> = {
  Student: ["AiImageQuestion", "AiPdfQuestions", "AiStudyPlanner", "CustomQuestions", "PerformanceRange", "Mentors"],
  Teacher: ["TrackingTables", "TrackedStudents", "ParentMessages", "TableAssistants", "ExcelImports", "TablePerformance"],
  Mentor: ["Mentees"],
};

// "≈ X ج.م per student a month" under teacher and mentor cards.
export const PER_UNIT_FEATURE: Partial<Record<BundleAudience, { feature: FeatureKey; label: string }>> = {
  Teacher: { feature: "TrackedStudents", label: "للطالب شهريًا" },
  Mentor: { feature: "Mentees", label: "للطالب المتابَع شهريًا" },
};

export const FEATURE_META: Record<FeatureKey, { label: string; note?: string }> = {
  StudySessions: { label: "جلسات المذاكرة" },
  AiStudyPlanner: { label: "المخطط الذكي بالذكاء الاصطناعي", note: "كل استخدام = تخطيط أسبوع" },
  PerformanceRange: { label: "تقارير الأداء لأي فترة", note: "التقرير الأساسي متاح دائمًا" },
  SpacedRepetitionSessions: { label: "جلسات المراجعة المتباعدة" },
  AiImageQuestion: { label: "أسئلة من الصور بالذكاء الاصطناعي" },
  AiPdfQuestions: { label: "أسئلة من ملفات PDF بالذكاء الاصطناعي", note: "حتى 20 صفحة = استخدام واحد" },
  CustomSubjects: { label: "موادك الخاصة" },
  CustomLessons: { label: "دروسك الخاصة" },
  CustomQuestions: { label: "أسئلتك الخاصة", note: "الأسئلة المولدة بالذكاء الاصطناعي تُحسب أيضًا" },
  CustomReviewIntervals: { label: "فترات مراجعة مخصصة", note: "بدونها تُستخدم الفترات الافتراضية" },
  BlockerSchedules: { label: "جداول منع المشتتات المحفوظة" },
  BlockerSessions: { label: "جلسات منع المشتتات" },
  Mentors: { label: "المشرفون على الطالب" },
  TrackingTables: { label: "جداول المتابعة (المجموعات)" },
  TrackedStudents: { label: "الطلاب في كل الجداول" },
  TableAssistants: { label: "المساعدون" },
  ExcelImports: { label: "الاستيراد من Excel", note: "حتى 5 ميجا و1000 صف للملف" },
  TablePerformance: { label: "تحليل أداء الجدول" },
  ParentMessages: { label: "تقارير واتساب لأولياء الأمور", note: "تُحسب عند الإرسال فعلًا" },
  Mentees: { label: "الطلاب الذين تتابعهم" },
};

export const FEATURE_GROUP_LABELS: Record<string, string> = {
  StudyPlanner: "المخطط",
  SpacedRepetition: "المراجعة المتباعدة",
  DistractionBlocker: "منع المشتتات",
  Mentor: "الإشراف والمتابعة",
  TrackingTables: "جداول المتابعة",
};

// --- Subscription and wallet -----------------------------------------------

export const OPERATION_META: Record<PurchaseOperation, { label: string; hint: string }> = {
  Purchase: { label: "شراء", hint: "تبدأ الباقة الآن." },
  Renewal: { label: "تجديد", hint: "تبدأ عند انتهاء باقتك الحالية." },
  Upgrade: { label: "ترقية", hint: "تبدأ الآن وتنتهي مع باقتك الحالية، وتدفع الفرق عن الأيام المتبقية فقط." },
  Downgrade: { label: "تغيير لباقة أقل", hint: "تبدأ عند انتهاء باقتك الحالية." },
  Scheduled: { label: "باقة تالية", hint: "تبدأ عند انتهاء باقتك الحالية." },
};

export const SUBSCRIPTION_STATUS_META: Record<SubscriptionStatus, { label: string; className: string }> = {
  Active: { label: "نشطة", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" },
  Scheduled: { label: "تبدأ لاحقًا", className: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300" },
  Expired: { label: "منتهية", className: "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300" },
  Replaced: { label: "استُبدلت", className: "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300" },
};

export const TRANSACTION_TYPE_LABELS: Record<WalletTransactionType, string> = {
  Deposit: "شحن المحفظة",
  Subscribe: "اشتراك",
  Renewal: "تجديد",
  Upgrade: "ترقية",
  Downgrade: "تغيير الباقة",
};

export const PAYMENT_STATUS_META: Record<PaymentStatus, { label: string; className: string }> = {
  Pending: { label: "جاري المعالجة", className: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" },
  Succeeded: { label: "تم", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" },
  Failed: { label: "فشل", className: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300" },
  Expired: { label: "انتهت المهلة", className: "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300" },
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  card: "بطاقة",
  wallet: "محفظة موبايل",
  kiosk: "فوري",
};

// The guide's "Show" column, for codes the live error catalogue may lack.
export const PAYMENT_ERROR_DEFAULTS: Record<string, string> = {
  insufficient_balance: "رصيد المحفظة لا يكفي، اشحن المحفظة أولاً",
  amount_too_small: "المبلغ أقل من الحد الأدنى للشحن",
  amount_invalid: "المبلغ غير صحيح",
  method_unavailable: "طريقة الدفع هذه غير متاحة حالياً",
  recharge_failed: "تعذر بدء عملية الدفع، حاول مرة أخرى",
  coupon_invalid: "الكوبون غير صحيح",
  coupon_not_started: "الكوبون لم يبدأ بعد",
  coupon_expired: "انتهت صلاحية الكوبون",
  coupon_unavailable: "نفدت مرات استخدام الكوبون",
  coupon_not_applicable: "الكوبون لا ينطبق على هذه الباقة",
  coupon_already_used: "استخدمت هذا الكوبون من قبل",
  coupon_first_purchase_only: "الكوبون لأول عملية شراء فقط",
  coupon_not_for_upgrades: "لا يمكن استخدام كوبون عند الترقية",
  bundle_unavailable: "هذه الباقة غير متاحة للشراء",
  teacher_plan_only: "باقات المدرسين متاحة لحسابات المدرسين فقط",
  already_scheduled: "لديك باقة ستبدأ بعد انتهاء الحالية بالفعل",
  renew_first: "انتهت باقتك، جددها أولاً ثم غيّرها",
  purchase_failed: "تعذر إتمام الشراء، رصيدك لم يتغير",
  not_a_partner: "هذا الحساب غير مرتبط بأي شريك",
  audience_required: "حدد لمن هذه الباقة: طلاب أو مدرسين أو أولياء أمور",
  features_incomplete: "يجب أن تحدد الباقة كل الميزات",
  invalid_access: "هذه الميزة تُفعّل أو تُغلق فقط ولا تقبل حداً رقمياً",
  invalid_rate_limit: "إعدادات حد الاستخدام غير صحيحة",
  unknown_feature: "ميزة غير معروفة",
  duplicate_feature: "الميزة مكررة في الباقة",
  invalid_limit: "الحد يجب أن يكون رقماً أكبر من صفر",
  bundle_code_taken: "يوجد باقة أخرى بنفس الكود",
  invalid_partner: "الشريك غير صحيح",
  features_required: "يجب إضافة ميزة واحدة على الأقل للباقة",
  system_bundle: "لا يمكن تعديل هذا الجزء من باقة النظام",
  invalid_catalogue: "ملف الباقات غير صحيح",
  code_taken: "كود الكوبون مستخدم بالفعل",
  invalid_dates: "تواريخ الصلاحية غير صحيحة",
  invalid_bundles: "بعض الباقات المختارة غير صحيحة",
  max_below_used: "الحد الأقصى أقل من عدد مرات الاستخدام الحالية",
  already_linked: "هذا الحساب مرتبط بشريك آخر",
  cannot_revoke_self: "لا يمكنك إزالة صلاحية المدير من حسابك",
  last_admin: "يجب أن يبقى مدير واحد على الأقل",
  cannot_change_self: "لا يمكنك تغيير دور حسابك",
  guest_account: "يجب أن يسجل الزائر حساباً أولاً",
  unknown_role: "الدور غير معروف",
  role_change_failed: "تعذر تغيير الدور",
};

// Kept with every plan and period, per product spec.
export const REFUND_GUARANTEE_TEXT =
  "يمكنك استرداد كامل المبلغ المدفوع إذا لم تتجاوز نسبة استخدامك من رصيد الذكاء الاصطناعي المخصص للخطة 10%. في حال تجاوز هذه النسبة، لا يحق للمستخدم استرداد المبلغ.";
