"use client";

import { createContext, useContext } from "react";

interface AuthContextType {
  user: CurrentUserResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refetch: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}