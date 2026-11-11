"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export const ThemeToggle = () => {
  const { resolvedTheme, setTheme } = useTheme();

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="
        p-2 rounded-full
        transition-colors duration-300
        hover:bg-zinc-100 dark:hover:bg-zinc-800
      "
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-yellow-400" />
      ) : (
        <Moon className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
      )}
    </button>
  );
};
