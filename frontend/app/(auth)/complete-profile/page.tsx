"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { useCompleteProfile } from "@/app/hooks/useCompleteProfile";
import { useAuthStore } from "@/app/lib/auth.store";
import { AuthFieldErrors, authFieldErrors } from "@/app/lib/auth-field-errors";
import { otpErrorMessage } from "@/app/lib/otp-errors";
import SignupDetailsForm from "@/components/auth/SignupDetailsForm";

// Phone sign-up, last step: /verify-phone answered needsSignup, so the new
// account is made from «بياناتك» (POST /auth/phone-complete-signup).
export default function CompleteProfile() {
  const phoneNumber = useAuthStore((state) => state.phoneNumber);
  const { mutate: completeProfile, isPending } = useCompleteProfile();
  const [serverErrors, setServerErrors] = useState<AuthFieldErrors | null>(null);

  // The phone lives in memory only; wait a tick before deciding a reload
  // lost it.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const timeout = setTimeout(() => setReady(true), 0);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <main dir="rtl" className="min-h-screen flex bg-[var(--surface)]">
      <section className="w-full flex justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-2xl flex flex-col gap-3 bg-white dark:bg-zinc-900 rounded-3xl shadow-sm px-6 sm:px-8 py-8">
          <h1 className="text-3xl font-bold text-right">بياناتك</h1>

          {ready && !phoneNumber ? (
            <div className="flex flex-col gap-5">
              <p className="text-gray-500 leading-8">
                انتهت الجلسة قبل إكمال التسجيل. أدخل رقم هاتفك من جديد لنرسل لك رمزًا جديدًا.
              </p>
              <Link
                href="/sign-up"
                className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 dark:bg-blue-700 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 dark:hover:bg-blue-800"
              >
                <ArrowRight className="size-5" />
                العودة إلى إنشاء حساب
              </Link>
            </div>
          ) : (
            <>
              <p className="text-gray-500 leading-8 mb-2">
                لم يتبق سوى خطوة واحدة لإنشاء حسابك والبدء باستخدام
                <span className="font-semibold text-black dark:text-white"> متقن</span>.
              </p>

              <SignupDetailsForm
                submitLabel={isPending ? "جارٍ إنشاء الحساب..." : "إنشاء الحساب"}
                submitting={isPending}
                serverErrors={serverErrors}
                onSubmit={({ name, fields }) => {
                  if (!phoneNumber) return;
                  setServerErrors(null);
                  completeProfile(
                    { phoneNumber, name, ...fields },
                    {
                      onError: (error) => {
                        const fieldErrors = authFieldErrors(error);
                        if (fieldErrors) setServerErrors(fieldErrors);
                        else toast.error("تعذر إنشاء الحساب", { description: otpErrorMessage(error) });
                      },
                    },
                  );
                }}
              />
            </>
          )}
        </div>
      </section>
    </main>
  );
}
