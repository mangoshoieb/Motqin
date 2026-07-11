"use client";

import { AuthContext } from "../(public)/context/auth.context";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useAutoRefresh } from "../hooks/useAutoRefresh";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useAutoRefresh();

  const { data, isFetching, refetch } = useCurrentUser();
  console.log(data)

  return (
    <AuthContext.Provider
      value={{
        user: data ?? null,
        // isPending stays true forever when the query is disabled (no
        // token), which used to make the navbar think auth was always
        // "loading" and render the avatar even when logged out.
        // isFetching is only true while a request is actually in flight.
        isLoading: isFetching,
        isAuthenticated: !!data,
        refetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}