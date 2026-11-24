"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authService } from "../services/auth.services";
import { authStorage } from "../lib/auth-storage";
import { authReturnPath, useAuthGate } from "../lib/auth-gate.store";
import { useGuestStore } from "../lib/guest.store";
import { toastApiError } from "../lib/api-error";
import { AccountType, setAccountType } from "../lib/account-type";

const WELCOME: Record<AccountType, string> = {
  Student: "جرّب كل شيء بحرية، وأنشئ حسابك متى شئت دون أن تفقد ما أنجزته.",
  Teacher: "جرّب متقن كمعلم، وأنشئ حسابك متى شئت دون أن تفقد ما أنجزته.",
  Mentor: "جرّب متقن كولي أمر أو مشرف، وأنشئ حسابك متى شئت دون أن تفقد ما أنجزته.",
};

// "Try without an account" — starts a guest session and treats its tokens
// exactly like a login's (same storage, same refresh flow). The sign-up
// page offers it as a student, a teacher or a parent; the type is kept so
// the account they make later is that type too.
export function useGuestLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (accountType: AccountType = "Student") => authService.signInAsGuest({ accountType }),

    onSuccess: (data, accountType = "Student") => {
      authStorage.setTokens(data.token, data.refreshToken);
      setAccountType(accountType);
      useGuestStore.getState().setRemaining(data.guest.remaining);
      useAuthGate.getState().close();
      queryClient.resetQueries();

      toast.success("أهلاً بك في متقن!", { description: WELCOME[accountType] });

      router.replace(authReturnPath.take() ?? "/");
    },

    onError: (error) => toastApiError("تعذر بدء التجربة", error),
  });
}
