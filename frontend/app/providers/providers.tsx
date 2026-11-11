"use client";

import { ThemeProvider } from "next-themes";
import QueryProvider from "./queryProvider";
import GoogleProvider from "./googleProvider";
import AuthProvider from "./authProvider";
import ErrorCodesLoader from "./ErrorCodesLoader";
import AppearanceSync from "./AppearanceSync";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    // enableSystem: the theme menus offer "match the system".
    // disableTransitionOnChange: without it every element with a
    // transition-colors class fades at its own speed, so switching the theme
    // ripples across the page instead of flipping at once.
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <AppearanceSync />
      <QueryProvider>
        <ErrorCodesLoader />
        <GoogleProvider>
          <AuthProvider>{children}</AuthProvider>
        </GoogleProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
