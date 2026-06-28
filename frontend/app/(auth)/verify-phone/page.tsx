"use client";

import CustomButton from "@/components/CustomButton";
import CustomInput from "@/components/CustomInput";
import { ArrowLeft} from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { verifyPhoneSchema } from "@/app/lib/validators/auth";
import { useVerifyPhone } from "@/app/hooks/useVerifyPhone";
import z from "zod";

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

  const onSubmit = (data: VerifyPhoneForm) => {
    console.log('hi')
    if (!phoneNumber) return;

    verifyPhone({
      phoneNumber,
      code: data.code,
    });
  };

  const searchParams = useSearchParams();

  const phoneNumber = searchParams.get("phone");
  return (
    <main className="min-h-screen w-full flex bg-[var(--surface)]">
      <div className=" w-[35VW] min-w-90 flex flex-col gap-7  m-8 px-10 py-6 bg-white rounded-3xl">
        <h1 className="text-3xl font-bold text-left">Forget password</h1>
        <p className="text-md font-semibold text-gray-500">
          Enter the 6-digit code sent to your phone number.
        </p>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 flex flex-col gap-4 mt-10"
        >
          <CustomInput
            placeholder="123456"
            label="Verification Code"
            type="text"
            error={errors.code?.message}
            {...register("code")}
          />

          <CustomButton
            title="Verify"
             type="submit"
            variant="facebook"
            className="w-full text-md font-semibold cursor-pointer"
            disabled={isPending}
          />
          <div
            className="flex cursor-pointer gap-3 m-auto "
            onClick={() => router.replace("/sign-in")}
          >
            {<ArrowLeft className="size-6 text-gray-700" />}

            <p className="font-semibold  text-gray-700">Back to log in</p>
          </div>
        </form>
      </div>
      <div className="hidden md:flex flex-1 justify-center items-center">
        <div className="flex flex-col items-center gap-6 w-full">
          <Image
            src="/متقن.svg"
            alt="Motqin Logo"
            width={300}
            height={70}
            priority
            className="-mb-30"
          />

          <div className="relative w-full max-w-[900px] h-[550px]">
            <Image
              src="/Research paper-rafiki.svg"
              alt="Motqin Illustration"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
      </div>
    </main>
  );
};

export default VerifyPhone;
