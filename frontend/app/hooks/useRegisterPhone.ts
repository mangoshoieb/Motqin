"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { authService } from "../services/auth.services";
import { useAuthStore } from "../lib/auth.store";

export function useRegisterPhone() {
  const router = useRouter();
  const setPhoneData = useAuthStore(
    state => state.setPhoneData
);
  return useMutation({
    mutationFn: authService.registerPhone,

    onSuccess: (data, variables) => {
      console.log(data.message)
      setPhoneData(
          variables.phoneNumber,
          variables.name
      );
  
      router.push("/verify-phone");
  },
    onError: (error) => {
      console.error(error);
    },
  });
}