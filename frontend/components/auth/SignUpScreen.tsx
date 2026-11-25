"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import CustomButton from "@/components/CustomButton";
import GoogleSignIn from "@/components/GoogleSignIn";
import PhoneField from "@/components/auth/PhoneField";
import InviterCodeField from "@/components/auth/InviterCodeField";
import { useGoogleLogin } from "@/app/hooks/useAuth";
import { useLogInPhone } from "@/app/hooks/useLoginPhone";
import { useGuestLogin } from "@/app/hooks/useGuestLogin";
import { useAuthKind } from "@/app/hooks/useAuthKind";
import { EMPTY_PHONE, PHONE_INVALID_MESSAGE, PhoneValue, toInternationalPhone } from "@/app/lib/phone";
import { AuthFieldErrors, authFieldErrors } from "@/app/lib/auth-field-errors";
import { getInviterCode } from "@/app/lib/invite-code";
import { AccountType, setAccountType } from "@/app/lib/account-type";

const without = (errors: AuthFieldErrors, key: string) => {
  const next = { ...errors };
  delete next[key];
  return next;
};

// The three sign-up pages and how each links to the others.
export const SIGN_UP_PAGES: Record<AccountType, { href: string; title: string; linkLabel: string }> = {
  Student: { href: "/sign-up", title: "إنشاء حساب", linkLabel: "إنشاء حساب طالب" },
  Teacher: { href: "/sign-up/teacher", title: "إنشاء حساب معلم", linkLabel: "للمدرسين" },
  Mentor: { href: "/sign-up/parent", title: "إنشاء حساب ولي أمر", linkLabel: "لأولياء الأمور والمشرفين" },
};

const INTROS: Partial<Record<AccountType, string>> = {
  Teacher: "تابع طلابك وجداولهم وأداءهم في مكان واحد.",
  Mentor: "تابع أبناءك أو من تشرف عليهم، واطمئن على تقدّمهم.",
};

/**
 * One sign-up screen for the three kinds of account. The page's type is
 * kept in sessionStorage (accountType) so the steps after it — the code,
 * «بياناتك», the Google steps — create that kind of account; landing on
 * /sign-up resets it to a student.
 */
export default function SignUpScreen({ accountType }: { accountType: AccountType }) {
  const { mutate: requestCode, isPending: isPhonePending } = useLogInPhone({ signUp: true });
  const { mutate: startGuest, isPending: isGuestPending } = useGuestLogin();
  // Already a guest? They're here to upgrade, not to start another trial.
  const isGuest = useAuthKind() === "guest";

  const { mutate: googleLogin } = useGoogleLogin();
  const [phone, setPhone] = useState<PhoneValue>(EMPTY_PHONE);
  const [errors, setErrors] = useState<AuthFieldErrors>({});

  useEffect(() => {
    setAccountType(accountType);
  }, [accountType]);

  const page = SIGN_UP_PAGES[accountType];
  const isStudent = accountType === "Student";
  const otherPages = (Object.keys(SIGN_UP_PAGES) as AccountType[]).filter((type) => type !== accountType);

  // The same call as sign-in, plus the invite code: the server checks it
  // for a new number before sending the code.
  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const phoneNumber = toInternationalPhone(phone.dialCode, phone.number);
    if (!phoneNumber) {
      setErrors({ PhoneNumber: phone.number.trim() ? PHONE_INVALID_MESSAGE : "أدخل رقم الهاتف" });
      return;
    }
    // Before the call, in case the page was opened in two tabs.
    setAccountType(accountType);
    const inviterCode = getInviterCode();
    requestCode(
      { phoneNumber, ...(inviterCode ? { inviterCode } : {}) },
      { onError: (error) => setErrors(authFieldErrors(error) ?? {}) },
    );
  };

  return (
    <main dir="rtl" className="min-h-screen lg:h-screen lg:overflow-hidden flex bg-[var(--surface)]">
      {/* Form */}
      <section className="w-full lg:w-[40%] flex justify-center items-center p-4 sm:p-6 lg:p-8 order-2 lg:order-1">
        <div className="w-full max-w-md max-h-full overflow-y-auto bg-white dark:bg-zinc-900 rounded-3xl shadow-sm px-6 sm:px-8 py-8">
          <h1 className="text-3xl font-bold text-right">{page.title}</h1>
          {INTROS[accountType] && (
            <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-zinc-400">{INTROS[accountType]}</p>
          )}

          <form noValidate onSubmit={onSubmit} className="mt-6 flex flex-col gap-6">
            <GoogleSignIn
              text="signup_with"
              onSuccess={(idToken) => {
                setAccountType(accountType);
                googleLogin({ idToken });
              }}
              onError={() => {
                toast.error("تعذّر تسجيل الدخول بجوجل", {
                  description: "اسمح بالنوافذ المنبثقة لهذا الموقع ثم حاول مرة أخرى، أو سجّل برقم هاتفك.",
                });
              }}
            />

            <div className="flex justify-center gap-2 text-sm sm:text-base font-medium">
              <span className="text-gray-600 dark:text-zinc-400">لديك حساب بالفعل؟</span>
              <Link href="/sign-in" className="text-blue-600 dark:text-blue-400 hover:underline">
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
            {isStudent && !isGuest && (
              <button
                type="button"
                onClick={() => startGuest("Student")}
                disabled={isGuestPending}
                className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
              >
                جرّب التطبيق بدون حساب
              </button>
            )}

            <div className="flex flex-col items-center gap-2 border-t border-gray-100 pt-5 dark:border-zinc-800">
              <span className="text-xs text-gray-500 dark:text-zinc-400">
                {isStudent ? "لست طالبًا؟ أنشئ حسابك من هنا" : "حساب من نوع آخر؟"}
              </span>
              <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
                {otherPages.map((type) => (
                  <Link
                    key={type}
                    href={SIGN_UP_PAGES[type].href}
                    className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {SIGN_UP_PAGES[type].linkLabel}
                  </Link>
                ))}
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* Illustration */}
      <section className="hidden lg:flex flex-1 justify-center mt-8 items-center order-1 lg:order-2">
        <div className="flex flex-col items-center w-full">
          <Image src="/متقن.svg" alt="متقن" width={320} height={80} priority className="-mb-20" />
          <div className="relative w-full max-w-3xl h-[580px]">
            <Image src="/Research paper-rafiki.svg" alt="متقن" fill priority className="object-contain" />
          </div>
        </div>
      </section>
    </main>
  );
}
