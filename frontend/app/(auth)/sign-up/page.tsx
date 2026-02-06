"use client";
import CustomButton from "@/components/CustomButton";
import CustomInput from "@/components/CustomInput";
import { Key, Mail, User } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaFacebook } from "react-icons/fa";
import Link from "next/link";
import {z} from "zod";
import { signUpSchema } from "@/app/lib/validators/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

type FormData = z.infer<typeof signUpSchema>;

const SignUp = () => {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = (data: FormData) => {
    console.log(data);
    router.replace('/')
  };

  return (
    <main className="min-h-screen w-full flex bg-[var(--surface)]">
      <div className="w-130 min-w-100 flex flex-col h-[88vh] m-10 px-10 py-8 bg-white rounded-3xl">
        <h1 className="text-3xl mb-7 font-bold text-left">Sign up</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 flex flex-col gap-2">
          <CustomInput
            placeholder="example@gmail.com"
            label="Email"
            type="email"
            icon={<Mail size={18} />}
            error={errors.email?.message}
            {...register("email")}
          />
          <CustomInput
            placeholder="mono"
            label="UserName"
            type="text"
            error={errors.username?.message}
            {...register("username")}
            icon={<User size={18} />}
          />
          <CustomInput
            label="Password"
            type="password"
            error={errors.password?.message}
            {...register("password")}
            icon={<Key size={18} />}
          />

          <CustomButton
            title="sign up"
            type="submit"
            className="w-full text-md font-semibold"
          />

          <div className="my-2 text-sm flex justify-center items-center gap-2">
            <p className="text-gray-700">Already have an account.</p>
            <Link href={"/sign-in"}>
              <span className="text-blue-600 ">Sign in</span>
            </Link>
          </div>

          <CustomButton
            title="Continue with Google"
            leftIcon={<FcGoogle size={24} />}
            href="/api/auth/google"
            variant="google"
            className="w-full text-md font-semibold"
          />
          <CustomButton
            title="Continue with Facebook"
            leftIcon={<FaFacebook size={24} />}
            href="/api/auth/facebook"
            variant="facebook"
            className="w-full text-md font-semibold"
          />
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
            className="-mb-20"
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

export default SignUp;
