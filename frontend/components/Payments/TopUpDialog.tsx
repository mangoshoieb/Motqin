"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, CreditCard, ExternalLink, Loader2, RotateCcw, Store, XCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/app/lib/utils";
import { getApiErrorMessage } from "@/app/lib/api-error";
import { formatEgp, formatMoney } from "@/app/lib/payments";
import { RECHARGE_MIN, RECHARGE_PRESETS } from "@/app/constants/payment.constants";
import { useRecharge, useStartRecharge } from "@/app/hooks/usePayments";
import { Modal, inputClass, primaryButton, secondaryButton } from "@/components/TrackingTables/ui";

const CHECKOUT_LIFETIME_MS = 60 * 60_000;

// Up to two decimals, Arabic digits accepted.
const parseAmount = (text: string) => {
  const normalized = text.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660)).replace(/[٫,]/g, ".").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return Number(normalized);
};

// Topping up the wallet through Paymob. Paymob's page opens in a new tab and
// does the card / mobile-wallet form; this dialog only learns the outcome by
// asking the server, since money arrives through Paymob's callback.
export function TopUpDialog({
  initialAmount,
  onClose,
  onPaid,
}: {
  initialAmount?: number;
  onClose: () => void;
  onPaid?: () => void;
}) {
  const [text, setText] = useState(initialAmount && initialAmount >= RECHARGE_MIN ? String(initialAmount) : "100");
  const [error, setError] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<{ reference: string; url: string; startedAt: number } | null>(null);
  const popupRef = useRef<Window | null>(null);
  const reported = useRef(false);
  const start = useStartRecharge();
  const { data: recharge, refetch, isFetching, dataUpdatedAt } = useRecharge(
    checkout?.reference ?? null,
    checkout?.startedAt ?? 0,
  );
  // Still pending a minute after it started: the money comes when confirmed.
  const waitedLong = !!checkout && dataUpdatedAt - checkout.startedAt > 60_000;

  const amount = parseAmount(text);
  const valid = amount !== null && amount >= RECHARGE_MIN;

  const begin = async () => {
    if (!valid || start.isPending) return;
    setError(null);
    // Opened now, inside the click, so the browser doesn't block it; it's
    // pointed at Paymob once the server answers.
    const popup = window.open("", "_blank");
    if (popup) popup.opener = null;
    try {
      const result = await start.mutateAsync(amount!);
      if (popup) popup.location.href = result.redirectUrl;
      popupRef.current = popup;
      reported.current = false;
      // A card checkout lasts an hour from when it started.
      const startedAt = new Date(result.expiresAt).getTime() - CHECKOUT_LIFETIME_MS;
      setCheckout({ reference: result.reference, url: result.redirectUrl, startedAt });
    } catch (err) {
      popup?.close();
      setError(getApiErrorMessage(err));
    }
  };

  const status = recharge?.status ?? (checkout ? "Pending" : null);

  // Once the money is in: say how much actually arrived, and move on.
  useEffect(() => {
    if (recharge?.status !== "Succeeded" || reported.current) return;
    reported.current = true;
    popupRef.current?.close();
    toast.success(`تم شحن محفظتك بمبلغ ${formatEgp(recharge.receivedAmount ?? recharge.requestedAmount)}`);
    onPaid?.();
  }, [recharge, onPaid]);

  const retry = () => {
    setCheckout(null);
    setError(null);
  };

  if (checkout) {
    return (
      <Modal title="شحن المحفظة" onClose={onClose}>
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          {status === "Succeeded" ? (
            <>
              <CheckCircle2 size={52} className="text-emerald-500" />
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                تم شحن محفظتك بمبلغ {formatEgp(recharge?.receivedAmount ?? recharge?.requestedAmount ?? 0)}
              </p>
              <button type="button" onClick={onClose} className={cn(primaryButton, "mt-2 w-full")}>
                تم
              </button>
            </>
          ) : status === "Failed" || status === "Expired" ? (
            <>
              <XCircle size={52} className="text-rose-500" />
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {status === "Failed" ? "لم تتم عملية الدفع" : "انتهت مهلة الدفع"}
              </p>
              <p className="text-sm text-zinc-500">لم يُخصم شيء من رصيدك. يمكنك المحاولة مرة أخرى.</p>
              <button type="button" onClick={retry} className={cn(primaryButton, "mt-2 w-full")}>
                <RotateCcw size={16} /> حاول مرة أخرى
              </button>
            </>
          ) : (
            <>
              <Loader2 size={44} className="animate-spin text-blue-600" />
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">جارٍ تأكيد الدفع…</p>
              <p className="max-w-sm text-sm leading-6 text-zinc-500">
                {waitedLong
                  ? "سنضيف المبلغ لمحفظتك فور تأكيده. يمكنك إغلاق هذه النافذة والرجوع لاحقًا."
                  : "أكمل الدفع في صفحة Paymob التي فُتحت في نافذة جديدة، ثم ارجع هنا. لا تعتمد على رسالة النجاح في صفحة الدفع، الرصيد يُضاف فقط بعد تأكيد Paymob."}
              </p>
              <div className="mt-2 flex w-full flex-col gap-2 sm:flex-row">
                <a href={checkout.url} target="_blank" rel="noopener noreferrer" className={cn(secondaryButton, "flex-1")}>
                  <ExternalLink size={16} /> فتح صفحة الدفع
                </a>
                <button type="button" onClick={() => void refetch()} disabled={isFetching} className={cn(secondaryButton, "flex-1")}>
                  {isFetching ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />} تحقق الآن
                </button>
              </div>
              <p className="text-xs text-zinc-400">
                يمكنك إغلاق هذه النافذة؛ ستجد العملية في سجل المحفظة بحالة &quot;جاري المعالجة&quot;.
              </p>
            </>
          )}
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title="شحن المحفظة"
      description="تُدفع الباقات من رصيد المحفظة."
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={cn(secondaryButton, "flex-1")}>
            إلغاء
          </button>
          <button type="button" onClick={() => void begin()} disabled={!valid || start.isPending} className={cn(primaryButton, "flex-1")}>
            {start.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
            {valid ? `متابعة للدفع · ${formatEgp(amount!)}` : "متابعة للدفع"}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-4 gap-2">
          {RECHARGE_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setText(String(preset))}
              className={cn(
                "rounded-xl border py-2.5 text-sm font-bold tabular-nums transition",
                amount === preset
                  ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                  : "border-zinc-200 text-zinc-700 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-200",
              )}
            >
              {formatMoney(preset)}
            </button>
          ))}
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">المبلغ (ج.م)</span>
          <input
            dir="ltr"
            inputMode="decimal"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void begin()}
            className={cn(inputClass, "text-center text-lg font-bold")}
          />
          {!valid && text.trim() !== "" && (
            <span className="text-xs text-rose-600">أقل مبلغ للشحن {RECHARGE_MIN} ج.م، وبحد أقصى رقمين بعد العلامة العشرية.</span>
          )}
        </label>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-2xl border border-blue-600 bg-blue-50 px-4 py-3 dark:bg-blue-500/10">
            <CreditCard size={20} className="text-blue-600" />
            <div>
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">بطاقة بنكية</p>
              <p className="text-xs text-zinc-500">فيزا أو ماستركارد</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 px-4 py-3 opacity-60 dark:border-zinc-700">
            <Store size={20} className="text-zinc-500" />
            <div>
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">فوري ومحافظ الموبايل</p>
              <p className="text-xs text-zinc-500">قريبًا</p>
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}
      </div>
    </Modal>
  );
}
