"use client";

import CustomButton from "@/components/CustomButton";
import CustomInput from "@/components/CustomInput";
import { ArrowRight} from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { verifyPhoneSchema } from "@/app/lib/validators/auth";
import { useVerifyPhone } from "@/app/hooks/useVerifyPhone";
import { useResendOtp } from "@/app/hooks/useResendOtp";
import z from "zod";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/app/lib/auth.store";

type VerifyPhoneForm = z.infer<typeof verifyPhoneSchema>;

const VerifyPhone = () => {
  const { mutate: verifyPhone, isPending } = useVerifyPhone();
  const { mutate: resendOtp, isPending: isResending } = useResendOtp();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VerifyPhoneForm>({
    resolver: zodResolver(verifyPhoneSchema),
  });


    const phoneNumber = useAuthStore(
      state => state.phoneNumber
  );
  const resendCooldownSeconds = useAuthStore(
    state => state.resendCooldownSeconds
  );
  const resendsRemaining = useAuthStore(
    state => state.resendsRemaining
  );
  const setResendInfo = useAuthStore(
    state => state.setResendInfo
  );

  // Local ticking countdown, seeded from the cooldown the backend returned
  // with the last OTP send (initial send or resend).
  const [cooldown, setCooldown] = useState(resendCooldownSeconds);

  useEffect(() => {
    setCooldown(resendCooldownSeconds);
  }, [resendCooldownSeconds]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => Math.max(c - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const onSubmit = (data: VerifyPhoneForm) => {
    if (!phoneNumber) return;
    verifyPhone({
      phoneNumber,
      code: data.code,
    });
  };

  const handleResend = () => {
    if (!phoneNumber || cooldown > 0 || resendsRemaining <= 0) return;

    resendOtp(
      { phoneNumber },
      {
        onSuccess: (data) => {
          setResendInfo(data.resendCooldownSeconds, data.resendsRemaining);
        },
      }
    );
  };

  const resendLabel =
    resendsRemaining <= 0
      ? "تم استنفاد عدد المحاولات، حاول لاحقًا"
      : cooldown > 0
      ? `إعادة الإرسال بعد ${cooldown} ثانية`
      : isResending
      ? "جارٍ الإرسال..."
      : "إعادة إرسال الرمز";
  return (
    <main dir="rtl" className="min-h-screen flex bg-[var(--surface)]">
      {/* Form */}
      <section className="w-full lg:w-[40%] flex justify-center items-center p-4 sm:p-6 lg:p-8 order-2 lg:order-1">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-sm px-6 sm:px-8 py-8">
          <h1 className="text-3xl font-bold text-right mb-4">
            تأكيد رقم الهاتف
          </h1>
  
          <p className="text-gray-500 text-sm sm:text-base leading-7 mb-6">
            أدخل رمز التحقق المكون من 6 أرقام الذي تم إرساله إلى رقم هاتفك.
          </p>
  
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-5"
          >
            <CustomInput
              label="رمز التحقق"
              placeholder="123456"
              type="text"
              error={errors.code?.message}
              {...register("code")}
            />
  
            <CustomButton
              title="تأكيد"
              type="submit"
              variant="facebook"
              className="w-full font-semibold"
              disabled={isPending}
            />

            <button
              type="button"
              onClick={handleResend}
              disabled={
                isResending ||
                cooldown > 0 ||
                resendsRemaining <= 0 ||
                !phoneNumber
              }
              className="text-sm font-medium text-blue-600 hover:underline disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline transition-colors"
            >
              {resendLabel}
            </button>

            <button
              type="button"
              onClick={() => router.replace("/sign-in")}
              className="flex items-center justify-center gap-2 text-gray-700 font-semibold hover:text-blue-600 transition-colors cursor-pointer"
            >
              <ArrowRight className="size-5" />
              <span>العودة إلى تسجيل الدخول</span>
            </button>
          </form>
        </div>
      </section>
  
      {/* Illustration */}
      <section className="hidden lg:flex flex-1 justify-center items-center order-1 lg:order-2">
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

export default VerifyPhone;
