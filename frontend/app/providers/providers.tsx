"use client";

import { ThemeProvider } from "next-themes";
import QueryProvider from "./queryProvider";
import GoogleProvider from "./googleProvider";
import FacebookProvider from "./FacebookProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <QueryProvider>
        <FacebookProvider>
          <GoogleProvider>{children}</GoogleProvider>
        </FacebookProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
