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
  Trophy,
  ShieldOff,
  CloudUpload,
} from "lucide-react";
import { useRef, useState } from "react";
import ThemeSubMenu from "../Navbar/ThemeMenu";
import { useLogout } from "@/app/hooks/useLogout";
import { useAuth } from "@/app/(public)/context/auth.context";
import { shortName } from "@/app/lib/user";
import UserAvatar from "@/components/ui/UserAvatar";
import { GUEST_FREE_USES, useGuestStore } from "@/app/lib/guest.store";
import { authReturnPath } from "@/app/lib/auth-gate.store";
import { usePathname } from "next/navigation";

// Trial status + the way out of it, pinned to the top of a guest's menu.
function GuestUpgradeCard({ onNavigate }: { onNavigate: () => void }) {
  const remaining = useGuestStore((s) => s.remaining);
  const pathname = usePathname();
  const counters = remaining
    ? [
        { label: "جلسات مذاكرة", value: remaining.studySessions },
        { label: "مراجعات متباعدة", value: remaining.spacedRepetitionSessions },
      ]
    : [];

  return (
    <div dir="rtl" className="m-3 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-4 text-white shadow-lg shadow-blue-600/20">
      <div className="flex items-center gap-2 font-bold">
        <CloudUpload size={18} />
        احفظ تقدّمك
      </div>
      <p className="mt-1 text-xs leading-5 text-blue-100">
        أنت تجرّب متقن كزائر. أنشئ حسابك وكل ما أنجزته ينتقل معك.
      </p>

      {counters.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {counters.map((c) => (
            <div key={c.label} className="rounded-xl bg-white/15 px-2.5 py-2">
              <div className="text-[11px] text-blue-100">{c.label}</div>
              <div className="font-bold tabular-nums">
                {c.value} <span className="text-xs font-normal text-blue-100">/ {GUEST_FREE_USES}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Link
        href="/sign-up"
        onClick={() => {
          authReturnPath.set(pathname);
          onNavigate();
        }}
        className="mt-3 flex h-9 items-center justify-center rounded-xl bg-white text-sm font-bold text-blue-700 transition hover:bg-blue-50"
      >
        إنشاء حساب مجاني
      </Link>
    </div>
  );
}

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
    label: "منع المشتتات",
    href: "/focus",
    icon: ShieldOff,
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
  const { user, isGuest } = useAuth();
  const displayName = shortName(user?.fullName);
  // Phone-registered users get a synthetic "@motqin.internal" email — show
  // the phone number for them instead. Guests have neither.
  const contact = isGuest
    ? "حساب تجريبي"
    : user?.email && !user.email.endsWith("@motqin.internal")
      ? user.email
      : user?.phoneNumber || user?.email || "";
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
      <div className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3 sm:px-5 sm:py-4 dark:border-zinc-800">
        <UserAvatar name={displayName} photoUrl={user?.photoUrl} size={44} />
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-lg">{displayName}</h3>
          {contact && (
            <p dir="ltr" className="truncate text-right text-sm text-zinc-500">{contact}</p>
          )}
        </div>
      </div>

      {isGuest && <GuestUpgradeCard onNavigate={onClose} />}

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
