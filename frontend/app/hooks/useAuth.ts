import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { useEffect } from "react";
interface Props {
  onSuccess: (idToken: string) => void;
}

import { authService } from "../services/auth.services";
import { authStorage } from "../lib/auth-storage";
import { toast } from "sonner";

export function useGoogleLogin() {
  const router = useRouter();

  return useMutation({
    mutationFn: authService.googleLogin,

    onSuccess: (data) => {
      console.log("DATA =", data);
      console.log("typeof data.token =", typeof data.token);
      console.log("data.token =", data.token);
    
      if (typeof data.token === "string") {
        console.log("Returned AuthTokens directly");
    
        authStorage.setTokens(
          data.token,
          data.refreshToken,
        );
      } else {
        console.log("Returned GoogleLoginResponse");
    
        authStorage.setTokens(
          data.token,
          data.refreshToken
        );
      }
    
      console.log("Stored:", localStorage.getItem("accessToken"));
    
      router.replace("/");
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
