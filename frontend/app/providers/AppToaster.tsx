"use client";

import { Toaster } from "sonner";
import { useTheme } from "next-themes";

// sonner draws its own (light) palette unless told the theme, so richColors
// toasts stayed light in dark mode. Follow the resolved app theme instead.
export default function AppToaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      position="top-center"
      richColors
      expand
      dir="rtl"
      closeButton
      toastOptions={{
        classNames: {
          toast: "rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl max-w-[50vw]",
          title: "font-semibold text-[15px]",
          description: "text-sm",
          success: "bg-green-50 dark:bg-green-950",
          error: "bg-red-50 dark:bg-red-950",
          warning: "bg-yellow-50 dark:bg-yellow-950",
          info: "bg-blue-50 dark:bg-blue-950",
        },
      }}
    />
  );
}
