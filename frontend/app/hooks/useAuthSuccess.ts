"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authStorage } from "../lib/auth-storage";
import { authReturnPath } from "../lib/auth-gate.store";
import { useGuestStore } from "../lib/guest.store";
import { GuestUpgradeResult } from "../types/auth.types";

// Shared finish line for every sign-in/sign-up (Google, Facebook, phone):
// store the new tokens, drop whatever the cache held for the previous
// session (a guest, usually), and go back to where the popup sent them from.
export function useAuthSuccess() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return (
    tokens: { token: string; refreshToken: string },
    result?: GuestUpgradeResult
  ) => {
    authStorage.setTokens(tokens.token, tokens.refreshToken);
    useGuestStore.getState().clear();

    if (result?.guestDataDiscarded) {
      toast.warning("لم تُنقل بيانات التجربة", {
        description:
          "هذا الحساب مسجّل لدينا من قبل، فسجّلنا دخولك إليه. ما أنجزته كزائر لم يُنقل إلى هذا الحساب.",
        duration: 10_000,
      });
    }

    queryClient.resetQueries();
    router.replace(authReturnPath.take() ?? "/");
  };
}
