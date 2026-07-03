"use client";
import CustomButton from "@/components/CustomButton";
import CustomInput from "@/components/CustomInput";
import { Phone, User } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import Image from "next/image";
import { useRef } from "react";
import { FaFacebook } from "react-icons/fa";
import Link from "next/link";
import { z } from "zod";
import { signUpSchema } from "@/app/lib/validators/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGoogleLogin } from "@/app/hooks/useAuth";
import GoogleSignIn from "@/components/GoogleSignIn";
import { useFacebookLogin } from "@/app/hooks/useFacebookLogin";
import { signInWithFacebook } from "@/app/services/facebook-auth.services";
import { useRegisterPhone } from "@/app/hooks/useRegisterPhone";
type FormData = z.infer<typeof signUpSchema>;

const SignUp = () => {
  const { mutate: registerPhone, isPending: isPhonePending } =
    useRegisterPhone();

  const { mutate: facebookLogin, isPending: isFacebookPending } =
    useFacebookLogin();

  const { mutate: googleLogin, isPending: isGooglePending } = useGoogleLogin();
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = (data: FormData) => {
    registerPhone({
      phoneNumber: data.phoneNumber,
      name: data.username,
    });
  };

  const handleFacebookLogin = async () => {
    try {
      console.log("facebook button pressed");
      const accessToken = await signInWithFacebook();

      facebookLogin({
        accessToken,
      });
      console.log(accessToken);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <main
      dir="rtl"
      className="min-h-screen flex bg-[var(--surface)]"
    >
      {/* Form */}
      <section className="w-full lg:w-[40%] flex justify-center items-center p-4 sm:p-6 lg:p-8 order-2 lg:order-1">
        <div className="w-full h-full max-w-md bg-white rounded-3xl shadow-sm px-6 sm:px-8 py-8">
          <h1 className="text-3xl font-bold text-right mb-6">
            إنشاء حساب
          </h1>
  
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
          >
            <CustomButton
              title="المتابعة باستخدام فيسبوك"
              leftIcon={<FaFacebook size={22} />}
              onClick={handleFacebookLogin}
              variant="facebook"
              className="w-full font-semibold"
              disabled={isFacebookPending}
            />
  
            <div className="relative w-full h-12">
              <div className="absolute inset-0 opacity-0">
                <GoogleSignIn
                  onSuccess={(idToken) => {
                    googleLogin({ idToken });
                  }}
                  onError={() => {
                    console.log("Google Login Failed");
                  }}
                />
              </div>
  
              <CustomButton
                title="المتابعة باستخدام جوجل"
                leftIcon={<FcGoogle size={22} />}
                variant="google"
                className="w-full h-12 font-semibold"
              />
            </div>
  
            <div className="flex justify-center gap-2 text-sm sm:text-base font-medium">
              <Link
                href="/sign-in"
                className="text-blue-600 hover:underline"
              >
                تسجيل الدخول
              </Link>
  
              <span className="text-gray-600">
                لديك حساب بالفعل؟
              </span>
            </div>
  
            <CustomInput
              label="رقم الهاتف"
              placeholder="+20 10XXXXXXXX"
              type="tel"
              icon={<Phone size={18} />}
              error={errors.phoneNumber?.message}
              {...register("phoneNumber")}
            />
  
            <CustomInput
              label="اسم المستخدم"
              placeholder="مثال: محمد أحمد"
              type="text"
              icon={<User size={18} />}
              error={errors.username?.message}
              {...register("username")}
            />
  
            <CustomButton
              title="إنشاء الحساب"
              type="submit"
              className="w-full font-semibold"
              disabled={isPhonePending}
            />
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

export default SignUp;
