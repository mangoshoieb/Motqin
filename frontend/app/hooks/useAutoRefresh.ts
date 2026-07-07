"use client";

import { useEffect } from "react";
import { authStorage } from "../lib/auth-storage";
import { refreshTokens } from "../lib/axios";

export function useAutoRefresh() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const schedule = () => {
      if (timer) clearTimeout(timer);

      const expiry = authStorage.getAccessTokenExpiry();
      if (!expiry) return;

      const delay = Math.max(expiry - Date.now() - 60_000, 0);

      timer = setTimeout(async () => {
        try {
          await refreshTokens();
        } catch {
          return; // refreshTokens() already logs out + redirects on failure
        }
        schedule();
      }, delay);
    };

    schedule();

    const onVisible = () => {
      if (document.visibilityState === "visible") schedule();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
}