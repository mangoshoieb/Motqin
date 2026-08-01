"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/app/lib/utils";
import {
  Settings as SettingsIcon,
  Palette,
  UserCog,
  CalendarClock,
  ListChecks,
  Bot,
  Bell,
  CreditCard,
  type LucideIcon,
} from "lucide-react";

interface SettingsNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  external?: boolean; // navigates away from the settings shell entirely
}

const navItems: SettingsNavItem[] = [
  { label: "عام", href: "/settings", icon: SettingsIcon },
  { label: "المظهر", href: "/settings/appearance", icon: Palette },
  { label: "الحساب", href: "/settings/account", icon: UserCog },
  { label: "تفضيلات المخطط", href: "/settings/planner", icon: CalendarClock },
  { label: "تفضيلات متقن", href: "/settings/quiz", icon: ListChecks },
  { label: "تفضيلات دليل", href: "/settings/ai-teacher", icon: Bot },
  { label: "الإشعارات", href: "/settings/notifications", icon: Bell },
  { label: "الاشتراك", href: "/subscription", icon: CreditCard, external: true },
];

export const SettingsSidebar = () => {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 rounded-2xl bg-white border border-zinc-200 p-3 dark:bg-zinc-900 dark:border-zinc-800">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = !item.external && pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition",
              isActive
                ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            )}
          >
            <Icon size={18} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
};
