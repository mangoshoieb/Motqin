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
import { EMPTY_PHONE, PHONE_INVALID_MESSAGE, PhoneValue, toInternationalPhone } from "@/app/lib/phone";
import { authFieldErrors } from "@/app/lib/auth-field-errors";

const SignIn = () => {
  const { mutate: logInPhone, isPending: isPhonePending } = useLogInPhone();
  const { mutate: startGuest, isPending: isGuestPending } = useGuestLogin();
  // Already a guest? They're here to upgrade, not to start another trial.
  const isGuest = useAuthKind() === "guest";

  const { mutate: googleLogin } = useGoogleLogin();
  const [phone, setPhone] = useState<PhoneValue>(EMPTY_PHONE);
  const [phoneError, setPhoneError] = useState<string>();

  // Any country: "+" + dialCode + the number without its leading 0. The
  // server's own message (details.PhoneNumber) goes under the field.
  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const phoneNumber = toInternationalPhone(phone.dialCode, phone.number);
    if (!phoneNumber) {
      setPhoneError(phone.number.trim() ? PHONE_INVALID_MESSAGE : "أدخل رقم الهاتف");
      return;
    }
    logInPhone(
      { phoneNumber },
      { onError: (error) => setPhoneError(authFieldErrors(error)?.PhoneNumber) },
    );
  };

  return (
    <main
      dir="rtl"
      className="max-h-screen overflow-hidden flex bg-[var(--surface)]"
    >
      {/* Form */}
      <section className="w-full lg:w-[40%] h-[95vh] flex justify-center items-center p-4 sm:p-6 lg:p-8 order-2 lg:order-1">
        <div className="w-full h-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-sm px-6 sm:px-8 py-8">
          <h1 className="text-3xl font-bold text-right mb-6">تسجيل الدخول</h1>

          <form noValidate onSubmit={onSubmit} className="flex flex-col gap-6">
            <GoogleSignIn
              text="continue_with"
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
              <span className="text-gray-600 dark:text-zinc-400">ليس لديك حساب.</span>
              <Link href="/sign-up" className="text-blue-600 dark:text-blue-400 hover:underline">
                إنشاء حساب
              </Link>
            </div>

            <PhoneField
              value={phone}
              onChange={(next) => {
                setPhone(next);
                setPhoneError(undefined);
              }}
              error={phoneError}
            />

            <CustomButton
              title="تسجيل دخول"
              type="submit"
              className="w-full font-semibold"
              disabled={isPhonePending}
            />

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

export default SignIn;
