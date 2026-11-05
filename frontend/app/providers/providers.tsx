"use client";

import { ThemeProvider } from "next-themes";
import QueryProvider from "./queryProvider";
import GoogleProvider from "./googleProvider";
import AuthProvider from "./authProvider";
import ErrorCodesLoader from "./ErrorCodesLoader";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <QueryProvider>
        <ErrorCodesLoader />
        <GoogleProvider>
          <AuthProvider>{children}</AuthProvider>
        </GoogleProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
