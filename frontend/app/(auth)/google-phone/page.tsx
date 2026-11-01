"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { toast } from "sonner";
import CustomButton from "@/components/CustomButton";
import CustomInput from "@/components/CustomInput";
import { useAuthStore } from "@/app/lib/auth.store";
import { useGooglePhoneRequest, useGooglePhoneVerify } from "@/app/hooks/useGooglePhone";
import { isGoogleTokenInvalid, otpErrorMessage, otpRetryAfterSeconds } from "@/app/lib/otp-errors";
import { normalizeEgyptianPhone } from "@/app/lib/phone";

// Google sign-up for an account with no confirmed phone: POST /auth/google
// answered needsPhone, so the user confirms a phone by WhatsApp here (step 2:
// the number, step 3: the code). The Google ID token from the first step
// rides along on both calls.
const GooglePhone = () => {
  const idToken = useAuthStore((state) => state.googleIdToken);
  const storedPhone = useAuthStore((state) => state.phoneNumber);
  const resendCooldownSeconds = useAuthStore((state) => state.resendCooldownSeconds);
  const resendsRemaining = useAuthStore((state) => state.resendsRemaining);
  const setResendInfo = useAuthStore((state) => state.setResendInfo);
  const setGoogleIdToken = useAuthStore((state) => state.setGoogleIdToken);

  const requestCode = useGooglePhoneRequest();
  const verifyCode = useGooglePhoneVerify();

  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  // The Google token lasts about an hour; once rejected, start over.
  const [expired, setExpired] = useState(false);

  // Ticks down from whatever cooldown the last send (or a 429) set.
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    const timeout = setTimeout(() => setCooldown(resendCooldownSeconds), 0);
    return () => clearTimeout(timeout);
  }, [resendCooldownSeconds]);
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => Math.max(c - 1, 0)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const fail = (err: unknown) => {
    if (isGoogleTokenInvalid(err)) {
      setGoogleIdToken("");
      setExpired(true);
      return;
    }
    const retryAfter = otpRetryAfterSeconds(err);
    if (retryAfter) setResendInfo(retryAfter, resendsRemaining);
    setError(otpErrorMessage(err));
  };

  const sendCode = async (phoneNumber: string) => {
    setError(null);
    try {
      await requestCode.mutateAsync({ idToken, phoneNumber });
      setStep("code");
      toast.success("أرسلنا رمز التحقق عبر واتساب");
    } catch (err) {
      fail(err);
    }
  };

  const submitPhone = () => {
    const normalized = normalizeEgyptianPhone(phone);
    if (!normalized) {
      setError("أدخل رقم موبايل مصري صحيح: 01 ثم 9 أرقام.");
      return;
    }
    void sendCode(normalized);
  };

  const submitCode = async () => {
    if (!/^\d{6}$/.test(code)) {
      setError("رمز التحقق 6 أرقام.");
      return;
    }
    setError(null);
    try {
      await verifyCode.mutateAsync({ idToken, phoneNumber: storedPhone, code });
    } catch (err) {
      fail(err);
    }
  };

  const restart = !idToken || expired;

  return (
    <main dir="rtl" className="min-h-screen flex bg-[var(--surface)]">
      <section className="w-full lg:w-[40%] flex justify-center items-center p-4 sm:p-6 lg:p-8 order-2 lg:order-1">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-sm px-6 sm:px-8 py-8">
          <div className="mb-4 flex items-center gap-2">
            <FcGoogle size={28} />
            <h1 className="text-3xl font-bold text-right">تأكيد رقم الهاتف</h1>
          </div>

          {restart ? (
            <div className="flex flex-col gap-5">
              <p className="text-gray-500 text-sm sm:text-base leading-7">
                {expired
                  ? "انتهت جلسة تسجيل الدخول بجوجل. ابدأ من جديد من زر جوجل."
                  : "ابدأ تسجيل الدخول بجوجل أولًا، ثم أكّد رقم هاتفك هنا."}
              </p>
              <Link
                href="/sign-in"
                className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                <ArrowRight className="size-5" />
                العودة إلى تسجيل الدخول
              </Link>
            </div>
          ) : step === "phone" ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                submitPhone();
              }}
              className="flex flex-col gap-5"
            >
              <p className="text-gray-500 text-sm sm:text-base leading-7">
                آخر خطوة لإنشاء حسابك: أدخل رقم هاتفك، وسنرسل رمز تحقق إلى واتساب. إن كان للرقم حساب في متقن
                نربط جوجل به.
              </p>
              <CustomInput
                label="رقم الهاتف"
                placeholder="01XXXXXXXXX"
                type="tel"
                dir="ltr"
                inputMode="tel"
                icon={<Phone size={18} />}
                value={phone}
                onChange={(event) => {
                  setPhone(event.target.value);
                  setError(null);
                }}
                error={error ?? undefined}
              />
              <CustomButton
                title={requestCode.isPending ? "جارٍ الإرسال..." : "إرسال الرمز عبر واتساب"}
                type="submit"
                className="w-full font-semibold"
                disabled={requestCode.isPending || cooldown > 0}
              />
              {cooldown > 0 && (
                <p className="text-center text-sm text-gray-500">يمكنك طلب رمز بعد {cooldown} ثانية</p>
              )}
            </form>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void submitCode();
              }}
              className="flex flex-col gap-5"
            >
              <p className="text-gray-500 text-sm sm:text-base leading-7">
                أدخل الرمز المكوّن من 6 أرقام الذي أرسلناه عبر واتساب إلى{" "}
                <span dir="ltr" className="font-semibold text-gray-700">
                  {storedPhone}
                </span>
                .
              </p>
              <CustomInput
                label="رمز التحقق"
                placeholder="123456"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(event) => {
                  setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                  setError(null);
                }}
                error={error ?? undefined}
              />
              <CustomButton
                title={verifyCode.isPending ? "جارٍ التحقق..." : "تأكيد"}
                type="submit"
                className="w-full font-semibold"
                disabled={verifyCode.isPending}
              />
              <button
                type="button"
                onClick={() => void sendCode(storedPhone)}
                disabled={requestCode.isPending || cooldown > 0 || resendsRemaining <= 0}
                className="text-sm font-medium text-blue-600 hover:underline disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline transition-colors"
              >
                {resendsRemaining <= 0
                  ? "تم استنفاد عدد المحاولات، حاول لاحقًا"
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
                className="text-sm font-semibold text-gray-700 transition-colors hover:text-blue-600"
              >
                تغيير رقم الهاتف
              </button>
            </form>
          )}
        </div>
      </section>

      <section className="hidden lg:flex flex-1 justify-center items-center order-1 lg:order-2">
        <div className="flex flex-col items-center w-full">
          <Image src="/متقن.svg" alt="متقن" width={320} height={80} priority className="-mb-20" />
          <div className="relative w-full max-w-3xl h-[580px]">
            <Image src="/Research paper-rafiki.svg" alt="متقن" fill priority className="object-contain" />
          </div>
        </div>
      </section>
    </main>
  );
};

export default GooglePhone;
