"use client";

import { Monitor, Moon, Sun, Check } from "lucide-react";
import { useTheme } from "next-themes";

const themes = [
  {
    value: "light",
    label: "فاتح",
    icon: Sun,
  },
  {
    value: "dark",
    label: "داكن",
    icon: Moon,
  },
  {
    value: "system",
    label: "مطابقة النظام",
    icon: Monitor,
  },
] as const;

export default function ThemeSubMenu() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="absolute left-full top-0 ml-1 w-56 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
      <div className="py-2">
        {themes.map((item) => {
          const Icon = item.icon;
          const selected = theme === item.value;

          return (
            <button
              key={item.value}
              onClick={() => setTheme(item.value)}
              className="flex w-full items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <div className="flex items-center gap-3">
                <Icon size={18} />
                <span>{item.label}</span>
              </div>

              {selected && (
                <Check
                  size={18}
                  className="text-blue-600"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}