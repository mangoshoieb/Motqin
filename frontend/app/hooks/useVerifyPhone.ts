"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { authService } from "../services/auth.services";
import { AxiosError } from "axios";
import { ApiError } from "next/dist/server/api-utils";
import { toast } from "sonner";
import { useAuthSuccess } from "./useAuthSuccess";

export function useVerifyPhone() {
  const router = useRouter();
  const completeAuth = useAuthSuccess();
  return useMutation({
    mutationFn: authService.verifyPhone,

    onSuccess: (data) => {
      if (data.needsSignup) {
        router.replace("/complete-profile");
        return;
      }

      if (!data.token) {
        console.error("Token is missing.");
        return;
      }

      completeAuth(data.token, data);
    },

    onError: (error: AxiosError<ApiError>) => {
      console.log("error");
      const message = error.response?.data.message;
      console.log(error);

      switch (message) {
        case "Invalid or expired verification code.":
          toast.error("رمز التحقق غير صحيح", {
            className: "!bg-red-200/80 ",
          });
          break;

        case "Verification code has expired.":
          toast.error("انتهت صلاحية رمز التحقق", {
            className: "!bg-red-200/80 ",
          });
          break;

        default:
          toast.error("حدث خطأ غير متوقع", {
            className: "!bg-red-200/80 ",
          });
      }
    },
  });
}
