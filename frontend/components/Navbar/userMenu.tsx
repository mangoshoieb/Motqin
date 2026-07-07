"use client";

import Link from "next/link";
import {
  User,
  Palette,
  Settings,
  Bell,
  CreditCard,
  CircleHelp,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { useRef, useState } from "react";
import ThemeSubMenu from "../Navbar/ThemeMenu";
import { useLogout } from "@/app/hooks/useLogout";

type UserMenuProps = {
  isOpen: boolean;
  onClose: () => void;
};

const menuItems = [
  {
    label: "الملف الشخصي",
    href: "/profile",
    icon: User,
  },
  {
    label: "الإشعارات",
    href: "/notifications",
    icon: Bell,
  },
  {
    label: "المظهر",
    href: "#",
    icon: Palette,
    hasSubMenu: true,
  },
  {
    label: "الإعدادات",
    href: "/settings",
    icon: Settings,
  },
  {
    label: "الاشتراك",
    href: "/subscription",
    icon: CreditCard,
  },
  {
    label: "المساعدة",
    href: "/help",
    icon: CircleHelp,
  },
];

export default function UserMenu({ isOpen, onClose }: UserMenuProps) {
  const [activeSubMenu, setActiveSubMenu] = useState<"theme" | null>(null);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { mutate: logout, isPending } = useLogout();


  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      onClose();
    }, 250);
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };
  if (!isOpen) return null;
  return (
    <div
      className="absolute left-0 top-14 z-50 w-54 sm:w-66 rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900 origin-top-left fade-in zoom-in-95 duration-350"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Header */}
      <div className="border-b border-zinc-200 px-4 py-3 sm:px-5 sm:py-4 dark:border-zinc-800">
        <h3 className="font-semibold text-lg">Mono</h3>
        <p className="text-sm text-zinc-500">mono@example.com</p>
      </div>

      {/* Menu */}
      <div className="py-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          if (!item.hasSubMenu) {
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onClose}
                className="flex items-center justify-between px-4 py-2.5 sm:px-5 sm:py-3 transition hover:bg-zinc-200 dark:hover:bg-zinc-800"
              >
                <div className="flex items-center gap-3">
                  <Icon size={19} />

                  <span>{item.label}</span>
                </div>

                {item.hasSubMenu && <ChevronRight size={18} />}
              </Link>
            );
          } else {
            return (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => setActiveSubMenu("theme")}
                onMouseLeave={() => setActiveSubMenu(null)}
              >
                <button className="flex w-full items-center justify-between px-4 py-2.5 sm:px-5 sm:py-3 transition hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <div className="flex items-center gap-3">
                    <Palette size={19} />
                    <span>المظهر</span>
                  </div>

                  <ChevronRight size={18} />
                </button>

                {activeSubMenu === "theme" && <ThemeSubMenu />}
              </div>
            );
          }
        })}

        <div className="my-2 border-t border-zinc-200 dark:border-zinc-800" />

        <button className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 sm:px-5 sm:py-3 text-red-600 transition hover:bg-red-100 dark:hover:bg-red-950/30"
        onClick={()=> logout()}>
          <LogOut size={19} />
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
}
