import { useMutation } from "@tanstack/react-query";

import { useEffect } from "react";
interface Props {
  onSuccess: (idToken: string) => void;
}

import { authService } from "../services/auth.services";
import { authStorage } from "../lib/auth-storage";
import { toast } from "sonner";
import { useAuthSuccess } from "./useAuthSuccess";

export function useGoogleLogin() {
  const completeAuth = useAuthSuccess();

  return useMutation({
    mutationFn: authService.googleLogin,

    onSuccess: (data) => {
      completeAuth(data, data);
    },

    onError: (error) => {
      console.error(error);
      // toast.error("حدث خطأ ما", {
      //   className: "!bg-red-200/80 ",
      // });
    },
  });
}

export function useAuth() {
  const token = authStorage.getAccessToken();

  return {
    isAuthenticated: !!token,
    token,
  };
}
