"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { authService } from "../services/auth.services";
import { useAuthStore } from "../lib/auth.store";

export function useLogInPhone() {
  const router = useRouter();
  const setPhone = useAuthStore(
    state => state.setPhone
);
  return useMutation({
    mutationFn: authService.logInPhone,

    onSuccess: (data, variables) => {
      console.log(data.message)
      console.log(data)
      setPhone(
          variables.phoneNumber
      );
  
      router.push("/verify-phone");
  },
    onError: (error) => {
      console.error(error);
    },
  });
}