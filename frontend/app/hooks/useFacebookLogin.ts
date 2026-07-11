"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authStorage } from "../lib/auth-storage";
import { authService } from "../services/auth.services";
import { toast } from "sonner";


export function useFacebookLogin() {
  const router = useRouter();

  return useMutation({
    mutationFn: authService.facebookLogin,

    onSuccess: (data) => {
      console.log("from hook")
      authStorage.setTokens(
        data.token,
        data.refreshToken,
      );

      router.replace("/");
    },

    onError: (error) => {
      console.error(error);
      // toast.error('somthing went wrong', {
      //   className: "!bg-red-200/80 ",
      // })
    },
  });
}