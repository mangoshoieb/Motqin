"use client";

import { useState } from "react";
import { Check, Loader2, TicketPercent, X } from "lucide-react";
import { cn } from "@/app/lib/utils";

// Coupons are stored without dashes or spaces, in capitals.
export const normalizeCoupon = (text: string) => text.replace(/[\s-]+/g, "").toUpperCase();

// What the coupon does across the plans shown, worked out by PlansSection
// from a preview of each plan: how many take it, and the error to show when
// none does.
export interface CouponStatus {
  checking: boolean;
  accepted: number; // plans with a saving
  error: string | null; // only when no plan takes it
}

// The coupon field next to the term picker. Each plan card shows what the
// coupon saves on it, or why it doesn't apply there; this field only says
// whether any plan takes it. Only signed-up accounts can buy, so guests see
// it disabled.
export function CouponBox({
  applied,
  onApply,
  status,
  disabled,
}: {
  applied: string;
  onApply: (coupon: string) => void;
  status: CouponStatus;
  disabled: boolean;
}) {
  const [text, setText] = useState(applied);
  const error = applied && !status.checking ? status.error : null;
  const valid = !!applied && !status.checking && status.accepted > 0;

  const apply = (e: React.FormEvent) => {
    e.preventDefault();
    const code = normalizeCoupon(text);
    if (code) onApply(code);
  };

  const clear = () => {
    setText("");
    onApply("");
  };

  return (
    <form onSubmit={apply} className="flex flex-col gap-2">
      <label htmlFor="coupon" className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
        كوبون الخصم
      </label>
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          {/* Physical sides on purpose: the input is LTR (codes are Latin)
              while the page is RTL, so start/end would point opposite ways. */}
          <TicketPercent size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            id="coupon"
            dir="ltr"
            value={text}
            disabled={disabled}
            onChange={(e) => setText(e.target.value)}
            placeholder={disabled ? "سجّل حسابك لاستخدام كوبون" : "أدخل الكوبون"}
            className={cn(
              "w-full rounded-xl border bg-white py-3 pl-4 pr-10 text-sm font-semibold uppercase tracking-wider text-zinc-800 outline-none transition placeholder:font-normal placeholder:normal-case placeholder:tracking-normal focus:border-blue-400 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-blue-500",
              error ? "border-rose-300 dark:border-rose-500/50" : valid ? "border-emerald-400 dark:border-emerald-500/60" : "border-zinc-200 dark:border-zinc-700",
            )}
            style={{ textAlign: "right" }}
          />
        </div>
        {applied && normalizeCoupon(text) === applied ? (
          <button
            type="button"
            onClick={clear}
            title="إزالة الكوبون"
            className="flex shrink-0 items-center gap-1 rounded-xl border border-zinc-200 px-3 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <X size={15} /> إزالة
          </button>
        ) : (
          <button
            type="submit"
            disabled={disabled || !text.trim()}
            className="shrink-0 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-800"
          >
            تطبيق
          </button>
        )}
      </div>
      <p className="min-h-5 text-xs" aria-live="polite">
        {applied && status.checking ? (
          <span className="inline-flex items-center gap-1 text-zinc-500">
            <Loader2 size={12} className="animate-spin" /> جاري التحقق...
          </span>
        ) : error ? (
          <span className="text-rose-600 dark:text-rose-400">{error}</span>
        ) : valid ? (
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
            <Check size={13} /> الكوبون مطبّق — التوفير ظاهر على {status.accepted === 1 ? "الباقة التي يشملها" : "الباقات التي يشملها"}
          </span>
        ) : null}
      </p>
    </form>
  );
}
