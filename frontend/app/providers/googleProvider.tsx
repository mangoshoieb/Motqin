"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { ReactNode } from "react";

interface GoogleProviderProps {
  children: ReactNode;
}

export default function GoogleProvider({
  children,
}: GoogleProviderProps) {
  return (
    <GoogleOAuthProvider
      clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}
    >
      {children}
    </GoogleOAuthProvider>
  );
}