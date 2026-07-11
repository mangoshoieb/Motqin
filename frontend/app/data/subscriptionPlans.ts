export interface SubscriptionPlan {
  id: string;
  name: string;
  tagline: string;
  monthlyPrice: number; // EGP, undiscounted 1-month price
  badge?: string;
  highlighted?: boolean;
  features: string[];
}

// Placeholder pricing (EGP) — tune once real numbers are decided.
// Feature lists map to Motqin's core modules: AI Teacher, App Blocker,
// Quiz & Spaced Repetition, Competitions, Smart Planner.
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "basic",
    name: "أساسي",
    tagline: "للبداية وتنظيم المذاكرة اليومية",
    monthlyPrice: 79,
    features: [
      "معلم ذكاء اصطناعي بعدد أسئلة محدود يومياً",
      "اختبارات أساسية بدون تكرار متباعد",
      "مخطط مذاكرة ذكي أساسي",
      "قافل تطبيقات مجدول بالوقت فقط",
    ],
  },
  {
    id: "premium",
    name: "بريميوم",
    tagline: "الأكثر طلباً بين الطلاب المجتهدين",
    monthlyPrice: 149,
    badge: "الأكثر طلباً",
    highlighted: true,
    features: [
      "معلم ذكاء اصطناعي بلا حدود مع شرح تكيّفي",
      "اختبارات ذكية مع نظام التكرار المتباعد الكامل",
      "مخطط مذاكرة تلقائي يكتشف أوقات تركيزك",
      "قافل تطبيقات بوضع المشرف الكامل",
      "المسابقات ولوحات الصدارة",
    ],
  },
  {
    id: "advanced",
    name: "متقدم",
    tagline: "لأولياء الأمور ومتابعة أكثر من طالب",
    monthlyPrice: 349,
    features: [
      "كل مزايا خطة بريميوم",
      "حتى 5 حسابات طلابية مرتبطة",
      "تقارير أداء متقدمة لولي الأمر",
      "أولوية في الاستجابة والدعم الفني",
    ],
  },
];

export interface PeriodOption {
  value: number; // months
  label: string;
  discount: number; // 0..1
}

export const PERIOD_OPTIONS: PeriodOption[] = [
  { value: 1, label: "شهر واحد", discount: 0 },
  { value: 3, label: "3 أشهر", discount: 0.1 },
  { value: 6, label: "6 أشهر", discount: 0.2 },
  { value: 12, label: "12 شهر", discount: 0.35 },
];

// Placeholder — not wired to anything yet, per spec.
export const ACCOUNT_TYPE_OPTIONS = [
  { value: "student", label: "طالب" },
  { value: "parent", label: "ولي أمر" },
  { value: "teacher", label: "معلم" },
] as const;
