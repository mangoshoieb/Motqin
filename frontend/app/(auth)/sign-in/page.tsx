"use client";
import CustomButton from "@/components/CustomButton";
import CustomInput from "@/components/CustomInput";
import { Key, Mail } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FaFacebook } from "react-icons/fa";
import Link from "next/link";
import z from "zod";
import { signInSchema } from "@/app/lib/validators/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

type FormData = z.infer<typeof signInSchema>;

const SignIn = () => {

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = (data: FormData) => {
    console.log(data);
    router.replace("/");
  };

  return (
    <main className="min-h-screen w-full flex bg-[var(--surface)]">
      <div className=" w-[35VW] min-w-90 flex flex-col gap-7  m-8 px-10 py-6 bg-white rounded-3xl">
        <h1 className="text-3xl font-bold text-left">Login</h1>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 flex flex-col gap-1"
        >
          <CustomButton
            title="Login with Google"
            leftIcon={<FcGoogle size={24} />}
            variant="google"
            className="w-full text-md font-semibold"
          />
          <CustomButton
            title="Login with Facebook"
            leftIcon={<FaFacebook size={24} />}
            variant="facebook"
            className="w-full text-md font-semibold"
          />
          <CustomInput
            placeholder="example@gmail.com"
            label="Email"
            type="email"
            icon={<Mail size={18} />}
            error={errors.email?.message}
            {...register("email")}
          />
          <CustomInput
            label="Password"
            type="password"
            icon={<Key size={18} />}
            error={errors.password?.message}
            {...register("password")}
          />

          <CustomButton
            title="Sign In"
            type="submit"
            className="w-full text-md font-semibold"
          />

          <div className="my-1 text-sm flex justify-center items-center gap-2">
            <p className="text-gray-700">Are you new?</p>
            <Link href={"/sign-up"}>
              <span className="text-blue-600 ">Sign Up</span>
            </Link>
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

export default SignIn;
