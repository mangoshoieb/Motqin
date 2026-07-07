// useLogout.ts

import { useMutation } from "@tanstack/react-query";
import { authService } from "../services/auth.services";
import { logoutLocal } from "../lib/axios";
import { useRouter } from "next/navigation";

export function useLogout() {
  const router = useRouter();
  return useMutation({
    mutationFn: authService.logout,

    onSuccess: () => {
      logoutLocal();
      console.log("yooooooo");
      router.replace("/sign-in");
    },

    onError: () => {
      // Even if the request fails,
      // clear local tokens so the user is logged out.
      logoutLocal();
    },
  });
}
