"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import CustomButton from "@/components/CustomButton";
import CustomInput from "@/components/CustomInput";
import PhoneField from "@/components/auth/PhoneField";
import WhatsAppDebugBox from "@/components/auth/WhatsAppDebugBox";
import { authService } from "@/app/services/auth.services";
import { authStorage } from "@/app/lib/auth-storage";
import { useAuthStore } from "@/app/lib/auth.store";
import { authFieldErrors } from "@/app/lib/auth-field-errors";
import { otpErrorMessage, otpRetryAfterSeconds } from "@/app/lib/otp-errors";
import { EMPTY_PHONE, PHONE_INVALID_MESSAGE, PhoneValue, toInternationalPhone } from "@/app/lib/phone";

interface ChangePhoneDialogProps {
  // true: the account has no number yet («أضف رقم هاتفك»).
  adding: boolean;
  onClose: () => void;
}

/**
 * Adds or changes the account's phone: a WhatsApp code to the new number
 * (POST /auth/change-phone-request), then the code
 * (POST /auth/change-phone-confirm), which answers a new token pair.
 */
export default function ChangePhoneDialog({ adding, onClose }: ChangePhoneDialogProps) {
  const queryClient = useQueryClient();
  const setWhatsAppDebug = useAuthStore((state) => state.setWhatsAppDebug);

  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState<PhoneValue>(EMPTY_PHONE);
  const [newPhoneNumber, setNewPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [resendsRemaining, setResendsRemaining] = useState(1);

  const request = useMutation({ mutationFn: authService.changePhoneRequest });
  const confirm = useMutation({ mutationFn: authService.changePhoneConfirm });
  const busy = request.isPending || confirm.isPending;

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => Math.max(c - 1, 0)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // The test-only code box belongs to this dialog while it's open.
  useEffect(() => () => setWhatsAppDebug(null), [setWhatsAppDebug]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, busy]);

  const sendCode = async (number: string) => {
    setError(null);
    try {
      const data = await request.mutateAsync(number);
      setNewPhoneNumber(number);
      setCooldown(data.resendCooldownSeconds);
      setResendsRemaining(data.resendsRemaining);
      setWhatsAppDebug(data.whatsApp);
      setStep("code");
      toast.success("أرسلنا رمز التحقق عبر واتساب");
    } catch (err) {
      const retryAfter = otpRetryAfterSeconds(err);
      if (retryAfter) setCooldown(retryAfter);
      setError(authFieldErrors(err)?.NewPhoneNumber ?? otpErrorMessage(err));
    }
  };

  const submitPhone = () => {
    const number = toInternationalPhone(phone.dialCode, phone.number);
    if (!number) {
      setError(phone.number.trim() ? PHONE_INVALID_MESSAGE : "أدخل رقم الهاتف");
      return;
    }
    void sendCode(number);
  };

  const submitCode = async () => {
    if (!/^\d{6}$/.test(code)) {
      setError("رمز التحقق 6 أرقام.");
      return;
    }
    setError(null);
    try {
      const data = await confirm.mutateAsync({ newPhoneNumber, code });
      authStorage.setTokens(data.token.token, data.token.refreshToken);
      await queryClient.invalidateQueries({ queryKey: ["current-user"] });
      toast.success(adding ? "تمت إضافة رقم هاتفك" : "تم تغيير رقم هاتفك");
      onClose();
    } catch (err) {
      setError(otpErrorMessage(err));
    }
  };

  return (
    <div
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-phone-title"
      onClick={() => !busy && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white shadow-xl dark:bg-zinc-900"
      >
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
          <h2 id="change-phone-title" className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {adding ? "أضف رقم هاتفك" : "تغيير رقم الهاتف"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="إغلاق"
            className="flex size-8 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <X size={18} />
          </button>
        </div>

        {step === "phone" ? (
          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              submitPhone();
            }}
            className="flex flex-col gap-5 px-6 py-5"
          >
            <p className="text-sm leading-7 text-zinc-500 dark:text-zinc-400">
              سنرسل رمز تحقق إلى واتساب على الرقم الجديد.
            </p>
            <PhoneField
              label={adding ? "رقم الهاتف" : "الرقم الجديد"}
              value={phone}
              autoFocus
              onChange={(next) => {
                setPhone(next);
                setError(null);
              }}
              error={error ?? undefined}
            />
            <CustomButton
              title={request.isPending ? "جارٍ الإرسال..." : "إرسال الرمز عبر واتساب"}
              type="submit"
              className="w-full font-semibold"
              disabled={request.isPending || cooldown > 0}
            />
            {cooldown > 0 && (
              <p className="-mt-2 text-center text-sm text-zinc-500">يمكنك طلب رمز بعد {cooldown} ثانية</p>
            )}
          </form>
        ) : (
          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              void submitCode();
            }}
            className="flex flex-col gap-5 px-6 py-5"
          >
            <p className="text-sm leading-7 text-zinc-500 dark:text-zinc-400">
              أدخل الرمز المكوّن من 6 أرقام الذي أرسلناه عبر واتساب إلى{" "}
              <span dir="ltr" className="font-semibold text-zinc-700 dark:text-zinc-300">
                {newPhoneNumber}
              </span>
              .
            </p>
            <CustomInput
              label="رمز التحقق"
              placeholder="123456"
              inputMode="numeric"
              autoComplete="one-time-code"
              dir="ltr"
              autoFocus
              value={code}
              onChange={(event) => {
                setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                setError(null);
              }}
              error={error ?? undefined}
            />
            <WhatsAppDebugBox />
            <CustomButton
              title={confirm.isPending ? "جارٍ التحقق..." : "تأكيد"}
              type="submit"
              className="w-full font-semibold"
              disabled={confirm.isPending}
            />
            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => void sendCode(newPhoneNumber)}
                disabled={request.isPending || cooldown > 0 || resendsRemaining <= 0}
                className="font-medium text-blue-600 hover:underline disabled:cursor-not-allowed disabled:text-zinc-400 disabled:no-underline dark:text-blue-400"
              >
                {resendsRemaining <= 0
                  ? "تم استنفاد عدد المحاولات"
                  : cooldown > 0
                    ? `إعادة الإرسال بعد ${cooldown} ثانية`
                    : "إعادة إرسال الرمز"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setCode("");
                  setError(null);
                }}
                className="font-semibold text-zinc-700 hover:text-blue-600 dark:text-zinc-300 dark:hover:text-blue-300"
              >
                تغيير الرقم
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
