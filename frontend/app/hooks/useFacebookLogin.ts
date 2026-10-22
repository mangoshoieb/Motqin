"use client";

import { useMutation } from "@tanstack/react-query";
import { authService } from "../services/auth.services";
import { toast } from "sonner";
import { useAuthSuccess } from "./useAuthSuccess";


export function useFacebookLogin() {
  const completeAuth = useAuthSuccess();

  return useMutation({
    mutationFn: authService.facebookLogin,

    onSuccess: (data) => {
      completeAuth(data, data);
    },

    onError: (error) => {
      console.error(error);
      // toast.error('somthing went wrong', {
      //   className: "!bg-red-200/80 ",
      // })
    },
  });
}