"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { toast } from "sonner";
import CustomButton from "@/components/CustomButton";
import CustomInput from "@/components/CustomInput";
import PhoneField from "@/components/auth/PhoneField";
import InviterCodeField from "@/components/auth/InviterCodeField";
import WhatsAppDebugBox from "@/components/auth/WhatsAppDebugBox";
import SignupDetailsForm, { SignupDetailsResult } from "@/components/auth/SignupDetailsForm";
import { GoogleProfile, useAuthStore } from "@/app/lib/auth.store";
import {
  useGooglePhoneRequest,
  useGooglePhoneVerify,
  useGoogleProfileSubmit,
} from "@/app/hooks/useGooglePhone";
import { isGoogleTokenInvalid, otpErrorMessage, otpRetryAfterSeconds } from "@/app/lib/otp-errors";
import { AuthFieldErrors, authFieldErrors } from "@/app/lib/auth-field-errors";
import { EMPTY_PHONE, PHONE_INVALID_MESSAGE, PhoneValue, toInternationalPhone } from "@/app/lib/phone";

type Step = "profile" | "phone" | "code";

const toFormValues = (profile: GoogleProfile | null): SignupDetailsResult | null => {
  if (!profile) return null;
  const { fullName, ...fields } = profile;
  return { name: fullName, fields };
};

// Google sign-up after the first POST /auth/google:
// · needsProfile (a new user): «بياناتك» first; the second call answers a
//   token (done, no phone) or needsPhone (a Secondary student, a teacher or
//   a parent).
// · needsPhone: confirm a phone by WhatsApp (the number, then the code).
// The Google ID token rides along on every call, and the form values go
// again with google/phone-verify, which makes the account.
const GooglePhone = () => {
  const idToken = useAuthStore((state) => state.googleIdToken);
  const needsProfile = useAuthStore((state) => state.googleNeedsProfile);
  const googleFullName = useAuthStore((state) => state.googleFullName);
  const googleProfile = useAuthStore((state) => state.googleProfile);
  const storedPhone = useAuthStore((state) => state.phoneNumber);
  const resendCooldownSeconds = useAuthStore((state) => state.resendCooldownSeconds);
  const resendsRemaining = useAuthStore((state) => state.resendsRemaining);
  const setResendInfo = useAuthStore((state) => state.setResendInfo);
  const setGoogleIdToken = useAuthStore((state) => state.setGoogleIdToken);
  const setGoogleProfile = useAuthStore((state) => state.setGoogleProfile);

  const submitProfile = useGoogleProfileSubmit();
  const requestCode = useGooglePhoneRequest();
  const verifyCode = useGooglePhoneVerify();

  const [step, setStep] = useState<Step>(() => (needsProfile ? "profile" : "phone"));
  const [phone, setPhone] = useState<PhoneValue>(EMPTY_PHONE);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [profileErrors, setProfileErrors] = useState<AuthFieldErrors | null>(null);
  const [inviterError, setInviterError] = useState<string>();
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

  const formValues = useMemo(() => toFormValues(googleProfile), [googleProfile]);

  // Returns true when the error was the expired Google token.
  const tokenExpired = (err: unknown) => {
    if (!isGoogleTokenInvalid(err)) return false;
    setGoogleIdToken("");
    setExpired(true);
    return true;
  };

  const fail = (err: unknown) => {
    if (tokenExpired(err)) return;
    const retryAfter = otpRetryAfterSeconds(err);
    if (retryAfter) setResendInfo(retryAfter, resendsRemaining);
    setError(authFieldErrors(err)?.PhoneNumber ?? otpErrorMessage(err));
  };

  // «التالي»: the second auth/google call, with the form.
  const onProfile = async ({ name, fields }: SignupDetailsResult) => {
    const profile: GoogleProfile = { fullName: name, ...fields };
    setProfileErrors(null);
    try {
      const data = await submitProfile.mutateAsync({ idToken, ...profile });
      if (data.needsPhone) {
        setGoogleProfile(profile);
        setError(null);
        // Back here from a form error on the code step: the code is kept.
        setStep(code && storedPhone ? "code" : "phone");
      }
      // A token: useGoogleProfileSubmit signs in.
    } catch (err) {
      if (tokenExpired(err)) return;
      const fieldErrors = authFieldErrors(err);
      if (fieldErrors) setProfileErrors(fieldErrors);
      else toast.error("تعذر إكمال التسجيل", { description: otpErrorMessage(err) });
    }
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
    const normalized = toInternationalPhone(phone.dialCode, phone.number);
    if (!normalized) {
      setError(phone.number.trim() ? PHONE_INVALID_MESSAGE : "أدخل رقم الهاتف");
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
    setInviterError(undefined);
    try {
      await verifyCode.mutateAsync({ idToken, phoneNumber: storedPhone, code, ...(googleProfile ?? {}) });
    } catch (err) {
      if (tokenExpired(err)) return;
      // A form field or the invite code was refused; the code wasn't used up.
      const fieldErrors = authFieldErrors(err);
      if (fieldErrors) {
        const { InviterCode, ...rest } = fieldErrors;
        if (InviterCode) setInviterError(InviterCode);
        if (Object.keys(rest).length) {
          setProfileErrors(rest);
          setStep("profile");
        }
        return;
      }
      fail(err);
    }
  };

  const restart = !idToken || expired;
  const title = step === "profile" ? "بياناتك" : "تأكيد رقم الهاتف";

  return (
    <main dir="rtl" className="min-h-screen flex bg-[var(--surface)]">
      <section className="w-full lg:w-[45%] flex justify-center items-center p-4 sm:p-6 lg:p-8 order-2 lg:order-1">
        <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-sm px-6 sm:px-8 py-8">
          <div className="mb-4 flex items-center gap-2">
            <FcGoogle size={28} />
            <h1 className="text-3xl font-bold text-right">{title}</h1>
          </div>
          {!restart && needsProfile && (
            <p className="mb-4 text-xs font-semibold text-blue-600 dark:text-blue-400">
              {step === "profile" ? "الخطوة 1: أكمل بياناتك" : "الخطوة 2: أكّد رقم هاتفك"}
            </p>
          )}

          {restart ? (
            <div className="flex flex-col gap-5">
              <p className="text-gray-500 text-sm sm:text-base leading-7">
                {expired
                  ? "انتهت جلسة تسجيل الدخول بجوجل. ابدأ من جديد من زر جوجل."
                  : "ابدأ تسجيل الدخول بجوجل أولًا، ثم أكمل بياناتك هنا."}
              </p>
              <Link
                href="/sign-in"
                className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 dark:bg-blue-700 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 dark:hover:bg-blue-800"
              >
                <ArrowRight className="size-5" />
                العودة إلى تسجيل الدخول
              </Link>
            </div>
          ) : step === "profile" ? (
            <div className="flex flex-col gap-4">
              <p className="text-gray-500 text-sm sm:text-base leading-7">
                أهلًا بك في متقن! أخبرنا عنك قليلًا لنجهّز حسابك.
              </p>
              <SignupDetailsForm
                initialName={googleFullName}
                initial={formValues}
                submitLabel={submitProfile.isPending ? "جارٍ الحفظ..." : "التالي"}
                submitting={submitProfile.isPending}
                serverErrors={profileErrors}
                inviterCodeField="noPhoneStep"
                phoneStepHint
                onSubmit={(result) => void onProfile(result)}
              />
            </div>
          ) : step === "phone" ? (
            <form
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                submitPhone();
              }}
              className="flex flex-col gap-5"
            >
              <p className="text-gray-500 text-sm sm:text-base leading-7">
                آخر خطوة لإنشاء حسابك: أدخل رقم هاتفك، وسنرسل رمز تحقق إلى واتساب. يحتاجه المعلم أو ولي الأمر
                ليجدك ويتابعك.
              </p>
              <PhoneField
                value={phone}
                autoFocus
                onChange={(next) => {
                  setPhone(next);
                  setError(null);
                }}
                error={error ?? undefined}
              />
              {needsProfile && (
                <InviterCodeField error={inviterError} onChange={() => setInviterError(undefined)} />
              )}
              <CustomButton
                title={requestCode.isPending ? "جارٍ الإرسال..." : "إرسال الرمز عبر واتساب"}
                type="submit"
                className="w-full font-semibold"
                disabled={requestCode.isPending || cooldown > 0}
              />
              {cooldown > 0 && (
                <p className="text-center text-sm text-gray-500">يمكنك طلب رمز بعد {cooldown} ثانية</p>
              )}
              {needsProfile && (
                <button
                  type="button"
                  onClick={() => setStep("profile")}
                  className="text-sm font-semibold text-gray-700 dark:text-zinc-300 transition-colors hover:text-blue-600 dark:hover:text-blue-300"
                >
                  تعديل بياناتك
                </button>
              )}
            </form>
          ) : (
            <form
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                void submitCode();
              }}
              className="flex flex-col gap-5"
            >
              <p className="text-gray-500 text-sm sm:text-base leading-7">
                أدخل الرمز المكوّن من 6 أرقام الذي أرسلناه عبر واتساب إلى{" "}
                <span dir="ltr" className="font-semibold text-gray-700 dark:text-zinc-300">
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
                dir="ltr"
                value={code}
                onChange={(event) => {
                  setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                  setError(null);
                }}
                error={error ?? undefined}
              />
              <WhatsAppDebugBox />
              {inviterError && (
                <InviterCodeField error={inviterError} onChange={() => setInviterError(undefined)} />
              )}
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
                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline transition-colors"
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
                className="text-sm font-semibold text-gray-700 dark:text-zinc-300 transition-colors hover:text-blue-600 dark:hover:text-blue-300"
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
