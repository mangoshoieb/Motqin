"use client";

import { useSyncExternalStore } from "react";
import { authStorage } from "../lib/auth-storage";

// Who holds the stored token right now, re-rendering whenever tokens are
// written or cleared (this tab or another). "none" on the server.
export type AuthKind = "none" | "guest" | "user";

const getAuthKind = (): AuthKind => {
  if (!authStorage.getAccessToken()) return "none";
  return authStorage.isGuest() ? "guest" : "user";
};

export function useAuthKind(): AuthKind {
  return useSyncExternalStore(authStorage.subscribe, getAuthKind, () => "none");
}
