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
import z from "zod";
import { useAuthStore } from "@/app/lib/auth.store";

type VerifyPhoneForm = z.infer<typeof verifyPhoneSchema>;

const VerifyPhone = () => {
  const { mutate: verifyPhone, isPending } = useVerifyPhone();
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
  const onSubmit = (data: VerifyPhoneForm) => {
    console.log('hi')
    if (!phoneNumber) return;
    console.log(phoneNumber) 
    verifyPhone({
      phoneNumber,
      code: data.code,
    });
  };
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
