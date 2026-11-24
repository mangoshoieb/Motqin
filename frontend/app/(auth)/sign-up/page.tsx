"use client";
import { toast } from "sonner";
import CustomButton from "@/components/CustomButton";
import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { useGoogleLogin } from "@/app/hooks/useAuth";
import GoogleSignIn from "@/components/GoogleSignIn";
import { useLogInPhone } from "@/app/hooks/useLoginPhone";
import { useGuestLogin } from "@/app/hooks/useGuestLogin";
import { useAuthKind } from "@/app/hooks/useAuthKind";
import PhoneField from "@/components/auth/PhoneField";
import InviterCodeField from "@/components/auth/InviterCodeField";
import { EMPTY_PHONE, PHONE_INVALID_MESSAGE, PhoneValue, toInternationalPhone } from "@/app/lib/phone";
import { AuthFieldErrors, authFieldErrors } from "@/app/lib/auth-field-errors";
import { getInviterCode } from "@/app/lib/invite-code";

const without = (errors: AuthFieldErrors, key: string) => {
  const next = { ...errors };
  delete next[key];
  return next;
};

const SignUp = () => {
  const { mutate: requestCode, isPending: isPhonePending } = useLogInPhone({ signUp: true });
  const { mutate: startGuest, isPending: isGuestPending } = useGuestLogin();
  // Already a guest? They're here to upgrade, not to start another trial.
  const isGuest = useAuthKind() === "guest";

  const { mutate: googleLogin } = useGoogleLogin();
  const [phone, setPhone] = useState<PhoneValue>(EMPTY_PHONE);
  const [errors, setErrors] = useState<AuthFieldErrors>({});

  // The same call as sign-in, plus the invite code: the server checks it
  // for a new number before sending the code.
  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const phoneNumber = toInternationalPhone(phone.dialCode, phone.number);
    if (!phoneNumber) {
      setErrors({ PhoneNumber: phone.number.trim() ? PHONE_INVALID_MESSAGE : "أدخل رقم الهاتف" });
      return;
    }
    const inviterCode = getInviterCode();
    requestCode(
      { phoneNumber, ...(inviterCode ? { inviterCode } : {}) },
      { onError: (error) => setErrors(authFieldErrors(error) ?? {}) },
    );
  };

  return (
    <main
      dir="rtl"
      className="min-h-screen lg:h-screen lg:overflow-hidden flex bg-[var(--surface)]"
    >
      {/* Form */}
      <section className="w-full lg:w-[40%] flex justify-center items-center p-4 sm:p-6 lg:p-8 order-2 lg:order-1">
        <div className="w-full max-w-md max-h-full overflow-y-auto bg-white dark:bg-zinc-900 rounded-3xl shadow-sm px-6 sm:px-8 py-8">
          <h1 className="text-3xl font-bold text-right mb-6">
            إنشاء حساب
          </h1>

          <form noValidate onSubmit={onSubmit} className="flex flex-col gap-6">
            <GoogleSignIn
              text="signup_with"
              onSuccess={(idToken) => {
                googleLogin({ idToken });
              }}
              onError={() => {
                toast.error("تعذّر تسجيل الدخول بجوجل", {
                  description: "اسمح بالنوافذ المنبثقة لهذا الموقع ثم حاول مرة أخرى، أو سجّل برقم هاتفك.",
                });
              }}
            />

            <div className="flex justify-center gap-2 text-sm sm:text-base font-medium">
              <span className="text-gray-600 dark:text-zinc-400">
                لديك حساب بالفعل؟
              </span>
              <Link
                href="/sign-in"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                تسجيل الدخول
              </Link>
            </div>

            <PhoneField
              value={phone}
              onChange={(next) => {
                setPhone(next);
                setErrors((prev) => without(prev, "PhoneNumber"));
              }}
              error={errors.PhoneNumber}
            />

            <InviterCodeField
              error={errors.InviterCode}
              onChange={() => setErrors((prev) => without(prev, "InviterCode"))}
            />

            <CustomButton
              title="إنشاء الحساب"
              type="submit"
              className="w-full font-semibold"
              disabled={isPhonePending}
            />

            {/* The no-account trial is for students only. */}
            {!isGuest && (
              <button
                type="button"
                onClick={() => startGuest("Student")}
                disabled={isGuestPending}
                className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
              >
                جرّب التطبيق بدون حساب
              </button>
            )}
          </form>
        </div>
      </section>

      {/* Illustration */}
      <section className="hidden lg:flex flex-1 justify-center mt-8 items-center order-1 lg:order-2">
        <div className="flex flex-col items-center w-full">
          <Image
            src="/متقن.svg"
            alt="متقن"
            width={320}
            height={80}
            priority
            className="-mb-20"
          />

          <div className="relative w-full max-w-3xl h-[580px]">
            <Image
              src="/Research paper-rafiki.svg"
              alt="متقن"
              fill
              priority
              className="object-contain"
            />
          </div>
        </div>
      </section>
    </main>
  );
};

export default SignUp;
