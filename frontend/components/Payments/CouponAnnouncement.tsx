"use client";

import { Check, Sparkles, TicketPercent } from "lucide-react";
import { useAuthKind } from "@/app/hooks/useAuthKind";
import { COUPON_ANNOUNCEMENT } from "@/app/constants/payment.constants";

// The discount announcement under the wallet: a big "خصم" headline and a
// button that puts the coupon in the coupon field below, scrolls to the
// plans, and lets their prices count down to the discounted ones.
export function CouponAnnouncement({ applied, onApply }: { applied: string; onApply: (coupon: string) => void }) {
  const registered = useAuthKind() === "user";
  // Guests can't use coupons (buying needs an account).
  if (!COUPON_ANNOUNCEMENT || !registered) return null;
  const { code, percent, title, subtitle } = COUPON_ANNOUNCEMENT;
  const isApplied = applied === code;

  const use = () => {
    onApply(code);
    document.getElementById("plans")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="relative mx-auto mb-10 flex max-w-6xl flex-wrap items-center gap-6 overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-l from-amber-50 via-orange-50 to-rose-50 p-6 sm:p-8 dark:border-amber-500/20 dark:from-amber-500/10 dark:via-orange-500/10 dark:to-rose-500/10">
      <Sparkles className="pointer-events-none absolute -bottom-6 -left-6 size-32 text-amber-300/40 dark:text-amber-400/10" aria-hidden />

      <div className="relative flex items-baseline gap-2 text-orange-600 dark:text-orange-400">
        <span className="text-6xl font-black leading-none sm:text-7xl">خصم</span>
        <span className="text-5xl font-black leading-none tabular-nums sm:text-6xl">{percent}٪</span>
      </div>

      <div className="relative min-w-0 flex-1">
        <p className="text-xl font-extrabold text-zinc-900 sm:text-2xl dark:text-zinc-100">{title}</p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{subtitle}</p>
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-dashed border-orange-300 bg-white/70 px-3 py-1 text-sm dark:border-orange-500/40 dark:bg-zinc-900/60">
          <TicketPercent size={15} className="text-orange-600 dark:text-orange-400" />
          الكوبون <b dir="ltr" className="tracking-wider">{code}</b>
        </p>
      </div>

      <button
        type="button"
        onClick={use}
        disabled={isApplied}
        className="relative inline-flex items-center gap-2 rounded-full bg-orange-600 px-7 py-3.5 text-base font-bold text-white shadow-lg shadow-orange-500/25 transition hover:-translate-y-0.5 hover:bg-orange-700 disabled:translate-y-0 disabled:bg-emerald-600 disabled:shadow-none dark:bg-orange-700 dark:hover:bg-orange-800 dark:disabled:bg-emerald-700"
      >
        {isApplied ? (
          <>
            <Check size={18} /> تم تطبيق الكوبون
          </>
        ) : (
          "استخدم الكوبون"
        )}
      </button>
    </section>
  );
}
