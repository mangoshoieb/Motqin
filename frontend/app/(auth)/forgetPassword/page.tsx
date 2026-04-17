"use client";

import CustomButton from "@/components/CustomButton";
import CustomInput from "@/components/CustomInput";
import { ArrowBigLeft, ArrowLeft, Mail } from "lucide-react";
import Image from "next/image";
import { FcGoogle } from "react-icons/fc";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgetPassSchema } from "@/app/lib/validators/auth";

type ForgotPasswordForm = {
  email: string;
};

const ForgetPassword = () => {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgetPassSchema),
  });

  const onSubmit = (data: ForgotPasswordForm) => {
    console.log(data);
    router.replace("/");
  };
  return (
    <main className="min-h-screen w-full flex bg-[var(--surface)]">
      <div className=" w-[35VW] min-w-90 flex flex-col gap-7  m-8 px-10 py-6 bg-white rounded-3xl">
        <h1 className="text-3xl font-bold text-left">Forget password</h1>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 flex flex-col gap-4 mt-10"
        >
          <CustomInput
            placeholder="example@gmail.com"
            label="Email"
            type="email"
            icon={<Mail size={18} />}
            error={errors.email?.message}
            {...register("email")}
          />

          <CustomButton
            title="Reset password"
            // leftIcon={<FcGoogle size={24} />}
            variant='facebook'
            className="w-full text-md font-semibold cursor-pointer"
          />
          <div className="flex cursor-pointer gap-3 m-auto " onClick={()=> router.replace('/sign-in')}>
            {<ArrowLeft className="size-6 text-gray-700"/>}
          
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

export default ForgetPassword;
