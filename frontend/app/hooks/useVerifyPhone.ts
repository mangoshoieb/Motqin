"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { authService } from "../services/auth.services";
import { authStorage } from "../lib/auth-storage";
import { AxiosError } from "axios";
import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";

export function useVerifyPhone() {
  const router = useRouter();
  return useMutation({
    mutationFn: authService.verifyPhone,

    onSuccess: (data) => {
      console.log("SUCCESS");
      console.log(data);

      authStorage.setTokens(data.token.accessToken, data.token.refreshToken);

      console.log("Tokens saved");

      router.replace("/");

      console.log("Redirect called");
    },

    onError: (error: AxiosError<ApiError>) => {
      console.log("error");
      const message = error.response?.data.message;
      console.log(message);

      switch (message) {
        case "Invalid or expired verification code.":
          toast.error("رمز التحقق غير صحيح");
          break;

        case "Verification code has expired.":
          toast.error("انتهت صلاحية رمز التحقق");
          break;

        default:
          toast.error("حدث خطأ غير متوقع");
      }
    },
  });
}
