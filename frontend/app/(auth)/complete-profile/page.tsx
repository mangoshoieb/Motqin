"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { User, Globe } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import CustomButton from "@/components/CustomButton";
import CustomInput from "@/components/CustomInput";

import { completeProfileSchema } from "@/app/lib/validators/auth";
import { useCompleteProfile } from "@/app/hooks/useCompleteProfile";
import { useAuthStore } from "@/app/lib/auth.store";
import Skeleton from "@/components/ui/Skeleton";
import RegionSelect from "@/components/RegionSelect";

type FormData = z.infer<typeof completeProfileSchema>;

export default function CompleteProfile() {
  const router = useRouter();

  const phoneNumber = useAuthStore((state) => state.phoneNumber);

  const { mutate: completeProfile, isPending } = useCompleteProfile();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(completeProfileSchema),
  });

  const onSubmit = (data: FormData) => {
    if (!phoneNumber) {
      return;
    }

    completeProfile({
      phoneNumber,
      name: data.name,
      region: data.region,
    });
  };

  return (
    <main dir="rtl" className="min-h-screen flex bg-[var(--surface)]">
      {/* Form */}

      <section className="w-full flex justify-center  p-4 sm:p-6 lg:p-8 order-2 lg:order-1">
        <div className="w-full max-w-4xl flex flex-col gap-3 bg-white rounded-3xl shadow-sm px-6 sm:px-8 py-8">
          <h1 className="text-3xl font-bold text-right">أكمل بياناتك</h1>

          <p className="text-gray-500 leading-8 ">
            لم يتبق سوى خطوة واحدة لإنشاء حسابك والبدء باستخدام
            <span className="font-semibold text-black"> متقن</span>.
          </p>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-5"
          >
            <CustomInput
              label="الاسم"
              placeholder="مثال: محمد أحمد"
              icon={<User size={18} />}
              error={errors.name?.message}
              {...register("name")}
            />
            <Controller
              control={control}
              name="region"
              render={({ field }) => (
                <RegionSelect
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.region?.message}
                />
              )}
            />

            <Skeleton className="w-full h-[40vh]" />

            <CustomButton
              title="إنشاء الحساب"
              type="submit"
              disabled={isPending}
              className="w-full font-semibold"
            />
          </form>
        </div>
      </section>
    </main>
  );
}
