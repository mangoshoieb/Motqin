"use client";

import { AuthContext } from "../(public)/context/auth.context";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useAutoRefresh } from "../hooks/useAutoRefresh";
import { useAuthKind } from "../hooks/useAuthKind";
import AuthGateDialog from "@/components/auth/AuthGateDialog";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useAutoRefresh();

  const authKind = useAuthKind();
  const { data, isFetching, refetch } = useCurrentUser();
  // The query keeps its last data after logout; no token means no user.
  const user = authKind === "none" ? null : data ?? null;

  return (
    <AuthContext.Provider
      value={{
        user,
        // isPending stays true forever when the query is disabled (no
        // token), which used to make the navbar think auth was always
        // "loading" and render the avatar even when logged out.
        // isFetching is only true while a request is actually in flight.
        isLoading: isFetching,
        isAuthenticated: !!user,
        isGuest: authKind === "guest",
        refetch,
      }}
    >
      {children}
      <AuthGateDialog />
    </AuthContext.Provider>
  );
}
