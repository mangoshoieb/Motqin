"use client";

import { useEffect, type ReactNode } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  CalendarCheck2,
  CloudUpload,
  Crown,
  Hourglass,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Timer,
  X,
  type LucideIcon,
} from "lucide-react";
import { AuthGate, authReturnPath, useAuthGate } from "@/app/lib/auth-gate.store";
import { GUEST_FREE_USES, guestFeatureLabel } from "@/app/lib/guest.store";
import { useGuestLogin } from "@/app/hooks/useGuestLogin";

type GateAction = "signup" | "signin" | "subscribe";

interface GateCopy {
  title: string;
  body: string;
  icon: LucideIcon;
  // Header gradient + the soft glow behind the icon badge.
  header: string;
  glow: string;
  primary: { label: string; action: GateAction };
  secondary?: { label: string; action: GateAction };
  extra?: ReactNode;
}

const PRIMARY_BTN =
  "flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 font-bold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300";
const SECONDARY_BTN =
  "flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-5 font-semibold text-zinc-800 transition hover:bg-zinc-50 active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:focus-visible:ring-zinc-700";

const Perk = ({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) => (
  <li className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-300">
    <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300">
      <Icon size={16} />
    </span>
    {children}
  </li>
);

// Three used-up pills — makes "the free uses are gone" read at a glance.
const UsageMeter = () => (
  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/60 dark:bg-amber-950/30">
    <div className="mb-2 flex items-center justify-between text-xs font-semibold text-amber-800 dark:text-amber-300">
      <span>المحاولات المجانية</span>
      <span className="tabular-nums">
        {GUEST_FREE_USES} / {GUEST_FREE_USES}
      </span>
    </div>
    <div className="flex gap-1.5">
      {Array.from({ length: GUEST_FREE_USES }).map((_, i) => (
        <motion.span
          key={i}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.25 + i * 0.12, duration: 0.35 }}
          className="h-2 flex-1 origin-right rounded-full bg-gradient-to-l from-amber-400 to-orange-500"
        />
      ))}
    </div>
  </div>
);

const Reassurance = () => (
  <p className="flex items-center justify-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
    <ShieldCheck size={14} className="text-emerald-500" />
    التسجيل مجاني، وكل ما أنجزته كزائر ينتقل معك تلقائياً
  </p>
);

const copyFor = (gate: AuthGate): GateCopy | null => {
  switch (gate.kind) {
    case "registration_required":
      return {
        title: gate.message || "أنشئ حسابك للمتابعة",
        body: "هذه الميزة متاحة لأصحاب الحسابات فقط. التسجيل يستغرق أقل من دقيقة.",
        icon: LockKeyhole,
        header: "from-blue-600 via-indigo-600 to-sky-500",
        glow: "bg-sky-300/40",
        primary: { label: "إنشاء حساب مجاني", action: "signup" },
        secondary: { label: "لدي حساب بالفعل", action: "signin" },
        extra: <Reassurance />,
      };

    case "guest_limit_reached": {
      const feature = guestFeatureLabel(gate.feature);
      return {
        title: "انتهت محاولاتك المجانية",
        body: feature
          ? `استخدمت كل ${feature} المجانية. أنشئ حسابك لتكمل بلا حدود.`
          : "استخدمت كل محاولاتك المجانية لهذه الميزة. أنشئ حسابك لتكمل بلا حدود.",
        icon: Hourglass,
        header: "from-amber-500 via-orange-500 to-rose-500",
        glow: "bg-yellow-200/40",
        primary: { label: "إنشاء حساب مجاني", action: "signup" },
        secondary: { label: "لدي حساب بالفعل", action: "signin" },
        extra: (
          <>
            <UsageMeter />
            <Reassurance />
          </>
        ),
      };
    }

    case "subscription_required":
      return {
        title: "ميزة للمشتركين",
        body:
          gate.message ||
          "اشترك في متقن لتفتح هذه الميزة وتستمتع بالمعلم الذكي والمخطط الذكي بلا حدود.",
        icon: Crown,
        header: "from-violet-600 via-purple-600 to-fuchsia-500",
        glow: "bg-fuchsia-300/40",
        primary: { label: "عرض خطط الاشتراك", action: "subscribe" },
      };

    case "save_progress":
      return {
        title: "احفظ ما أنجزته",
        body: "أنت تستخدم متقن كزائر. أنشئ حسابك المجاني حتى تبقى خططك وموادك محفوظة على كل أجهزتك.",
        icon: CloudUpload,
        header: "from-emerald-500 via-teal-500 to-cyan-500",
        glow: "bg-emerald-200/40",
        primary: { label: "إنشاء حساب مجاني", action: "signup" },
        secondary: { label: "لدي حساب بالفعل", action: "signin" },
        extra: <Reassurance />,
      };

    default:
      return null;
  }
};

// Colored header with a floating glass icon badge and a few twinkling
// sparkles — the "you hit a wall, but a friendly one" moment.
const GateHeader = ({ copy }: { copy: GateCopy }) => {
  const Icon = copy.icon;
  return (
    <div className={`relative h-40 overflow-hidden bg-gradient-to-br ${copy.header}`}>
      <div className="absolute -top-16 -left-10 size-48 rounded-full bg-white/15 blur-2xl" />
      <div className="absolute -bottom-20 -right-8 size-56 rounded-full bg-black/10 blur-2xl" />
      <svg className="absolute inset-0 size-full opacity-[0.12]" aria-hidden>
        <defs>
          <pattern id="gate-dots" width="18" height="18" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#gate-dots)" />
      </svg>

      {[
        { top: "22%", left: "22%", delay: 0 },
        { top: "62%", left: "30%", delay: 0.6 },
        { top: "30%", left: "74%", delay: 1.1 },
      ].map((s, i) => (
        <motion.span
          key={i}
          className="absolute text-white"
          style={{ top: s.top, left: s.left }}
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.1, 0.8] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: s.delay }}
        >
          <Sparkles size={i === 1 ? 14 : 18} />
        </motion.span>
      ))}

      <div className="absolute inset-0 grid place-items-center">
        <div className={`absolute size-28 rounded-full blur-2xl ${copy.glow}`} />
        <motion.div
          initial={{ scale: 0.6, rotate: -12, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1, y: [0, -6, 0] }}
          transition={{
            scale: { type: "spring", stiffness: 260, damping: 16, delay: 0.1 },
            rotate: { type: "spring", stiffness: 260, damping: 16, delay: 0.1 },
            opacity: { duration: 0.2, delay: 0.1 },
            y: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.6 },
          }}
          className="relative grid size-20 place-items-center rounded-3xl border border-white/40 bg-white/20 text-white shadow-2xl shadow-black/20 backdrop-blur-md"
        >
          <Icon size={36} strokeWidth={2.2} />
        </motion.div>
      </div>
    </div>
  );
};

const WelcomeHeader = () => (
  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 dark:from-sky-950 dark:via-blue-950 dark:to-indigo-950">
    <div className="absolute -top-12 -right-12 size-44 rounded-full bg-cyan-300/30 blur-3xl dark:bg-cyan-500/20" />
    <div className="absolute -bottom-16 -left-10 size-48 rounded-full bg-blue-400/30 blur-3xl dark:bg-blue-500/20" />
    <motion.div
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.15, duration: 0.45 }}
      className="absolute inset-x-0 -bottom-6 top-2"
    >
      <Image
        src="/Research paper-rafiki.svg"
        alt=""
        fill
        priority
        className="object-contain"
      />
    </motion.div>
  </div>
);

export default function AuthGateDialog() {
  const gate = useAuthGate((s) => s.gate);
  const close = useAuthGate((s) => s.close);
  const router = useRouter();
  const pathname = usePathname();
  const { mutate: startGuest, isPending: isStartingGuest } = useGuestLogin();

  const isOpen = gate !== null;

  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, close]);

  const run = (action: GateAction) => {
    // Bring them back here once they've signed in/up.
    authReturnPath.set(`${pathname}${window.location.search}`);
    close();
    router.push(
      action === "signup" ? "/sign-up" : action === "signin" ? "/sign-in" : "/subscription"
    );
  };

  const copy = gate ? copyFor(gate) : null;

  return (
    <AnimatePresence>
      {gate && (
        <motion.div
          key="auth-gate"
          className="fixed inset-0 z-[120] flex items-end justify-center bg-zinc-950/55 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-gate-title"
            dir="rtl"
            initial={{ y: 48, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 32, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-[2rem] bg-white shadow-2xl sm:max-w-md sm:rounded-[2rem] dark:bg-zinc-900 dark:ring-1 dark:ring-zinc-800"
          >
            {/* Grab handle — reads as a bottom sheet on phones */}
            <div className="absolute inset-x-0 top-2 z-10 flex justify-center sm:hidden">
              <span className="h-1.5 w-10 rounded-full bg-black/15 dark:bg-white/20" />
            </div>

            <button
              type="button"
              onClick={close}
              aria-label="إغلاق"
              className="absolute top-4 left-4 z-10 grid size-9 place-items-center rounded-full bg-black/10 text-zinc-700 backdrop-blur transition hover:bg-black/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
            >
              <X size={18} />
            </button>

            {gate.kind === "welcome" ? (
              <>
                <WelcomeHeader />
                <div className="flex flex-col gap-5 px-6 pt-6 pb-7 sm:px-8">
                  <div className="text-center">
                    <h2
                      id="auth-gate-title"
                      className="text-2xl font-extrabold text-zinc-900 dark:text-white"
                    >
                      أهلاً بك في <span className="text-blue-600 dark:text-blue-400">متقن</span>
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-zinc-500 dark:text-zinc-400">
                      سجّل دخولك ليبقى تقدّمك محفوظاً على كل أجهزتك، أو ابدأ التجربة الآن بدون حساب.
                    </p>
                  </div>

                  <ul className="flex flex-col gap-2.5">
                    <Perk icon={CalendarCheck2}>نظّم موادك ودروسك وخطة مذاكرتك</Perk>
                    <Perk icon={Timer}>
                      {GUEST_FREE_USES} جلسات مذاكرة و{GUEST_FREE_USES} مراجعات متباعدة مجاناً
                    </Perk>
                    <Perk icon={ShieldCheck}>أنشئ حسابك لاحقاً وكل ما أنجزته يبقى معك</Perk>
                  </ul>

                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" className={PRIMARY_BTN} onClick={() => run("signup")}>
                      إنشاء حساب
                    </button>
                    <button type="button" className={SECONDARY_BTN} onClick={() => run("signin")}>
                      تسجيل الدخول
                    </button>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-zinc-400">
                    <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                    أو
                    <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                  </div>

                  <button
                    type="button"
                    disabled={isStartingGuest}
                    onClick={() => startGuest()}
                    className="group flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/60 font-bold text-blue-700 transition hover:border-blue-400 hover:bg-blue-50 disabled:cursor-wait disabled:opacity-70 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:border-blue-700"
                  >
                    {isStartingGuest ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        جرّب التطبيق بدون حساب
                        <ArrowLeft
                          size={18}
                          className="transition-transform group-hover:-translate-x-1"
                        />
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              copy && (
                <>
                  <GateHeader copy={copy} />
                  <div className="flex flex-col gap-5 px-6 pt-6 pb-7 sm:px-8">
                    <div className="text-center">
                      <h2
                        id="auth-gate-title"
                        className="text-2xl font-extrabold text-zinc-900 dark:text-white"
                      >
                        {copy.title}
                      </h2>
                      <p className="mt-2 text-sm leading-7 text-zinc-500 dark:text-zinc-400">
                        {copy.body}
                      </p>
                    </div>

                    {copy.extra}

                    <div className="flex flex-col gap-3">
                      <button
                        type="button"
                        className={PRIMARY_BTN}
                        onClick={() => run(copy.primary.action)}
                      >
                        {copy.primary.label}
                      </button>
                      {copy.secondary && (
                        <button
                          type="button"
                          className={SECONDARY_BTN}
                          onClick={() => run(copy.secondary!.action)}
                        >
                          {copy.secondary.label}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={close}
                        className="mx-auto mt-1 text-sm font-medium text-zinc-500 transition hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                      >
                        ليس الآن
                      </button>
                    </div>
                  </div>
                </>
              )
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
