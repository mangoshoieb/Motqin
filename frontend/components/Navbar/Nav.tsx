"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, CalendarCheck, House, type LucideIcon } from "lucide-react";
import { cn } from "@/app/lib/utils";
import UserAvatar from "@/components/ui/UserAvatar";
import { shortName } from "@/app/lib/user";
import UserMenu from "./userMenu";
import { SessionBreadcrumb } from "./SessionBreadcrumb";
import { Suspense, useState } from "react";
import { useAuth } from "@/app/(public)/context/auth.context";
import { useCurrentUser } from "@/app/hooks/useCurrentUser";
import { useLogout } from "@/app/hooks/useLogout";

export const dynamic = "force-dynamic";

// Each feature link takes its feature's own color: a light box of it on
// hover, a slightly stronger one on its own pages. (The /about page still
// exists; it's just not linked from the navbar.)
const navLinks: {
  label: string;
  href: string;
  icon: LucideIcon;
  isActive: (pathname: string) => boolean;
  tone: { hover: string; active: string };
}[] = [
  {
    label: "الرئيسية",
    href: "/",
    icon: House,
    isActive: (p) => p === "/",
    tone: {
      hover: "hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
      active: "border-zinc-300 bg-zinc-100 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100",
    },
  },
  {
    label: "المخطط",
    // Opens today's plan first.
    href: "/planner/today",
    icon: CalendarCheck,
    isActive: (p) => p.startsWith("/planner"),
    tone: {
      hover: "hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-700 dark:hover:border-blue-400/30 dark:hover:bg-blue-400/10 dark:hover:text-blue-300",
      active: "border-blue-500/40 bg-blue-500/15 text-blue-700 dark:border-blue-400/40 dark:bg-blue-400/15 dark:text-blue-300",
    },
  },
  {
    label: "متقن",
    href: "/subjects",
    icon: BookOpen,
    isActive: (p) => p.startsWith("/spaced-repetition"),
    tone: {
      hover: "hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:border-emerald-400/30 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-300",
      active: "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-400/15 dark:text-emerald-300",
    },
  },
];

const Nav = () => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  // const { data, isPending, error } = useCurrentUser();

  // console.log("-------------")
  // console.log(data,isPending,error)
  // console.log("-------------")

  const pathname = usePathname();
  // Temporary user object until auth is connected
  const { user, isLoading, isGuest } = useAuth();
  // First two words of the full name, e.g. "Amgad Mahmoud".
  const displayName = shortName(user?.fullName);
  return (
    <nav className="w-full border-b border-zinc-200 bg-[var(--background)] transition-colors duration-300 print:hidden dark:border-zinc-800">
      <div className="mx-auto h-16 max-w-7xl flex items-center px-3">
        {/* Left Section */}
        <div className="flex items-center justify-start">
          {user || isLoading ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-3 rounded-full px-2 py-1 transition hover:bg-zinc-200 dark:hover:bg-zinc-800"
              >
                <UserAvatar name={displayName} photoUrl={user?.photoUrl} size={40} />

                <span className="font-medium">{displayName}</span>

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  {/* <path d="m6 9 6 6 6-6" /> */}
                </svg>
              </button>

              <UserMenu
                isOpen={isUserMenuOpen}
                onClose={() => setIsUserMenuOpen(false)}
              />
            </div>
          ) : (
            <div />
          )}
        </div>

        {/* Center: breadcrumb — desktop only, only on subject/lesson pages */}
        <div className="flex-1 flex justify-center">
          <Suspense fallback={null}>
            <SessionBreadcrumb />
          </Suspense>
        </div>

        {/* Right Section */}
        <div className="flex items-center justify-end gap-3">
          {/* Center Navigation */}
          <div dir="rtl" className="flex items-center gap-1 sm:gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = link.isActive(pathname);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-label={link.label}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border border-transparent px-2.5 py-1.5 text-base font-bold transition-colors duration-200 sm:px-3.5",
                    active ? link.tone.active : cn("text-zinc-700 dark:text-zinc-300", link.tone.hover),
                  )}
                >
                  <Icon size={18} className="shrink-0" />
                  <span className="hidden sm:inline">{link.label}</span>
                </Link>
              );
            })}
          </div>
          {/* Guests keep these too — signing up from a guest session keeps
              their trial work. */}
          {!user || isGuest ? (
            <>
              <Link href="/sign-in" className="outline_btn">
                تسجيل الدخول
              </Link>

              <Link href="/sign-up" className="black_btn">
                إنشاء حساب
              </Link>
            </>
          ) : (
            <div />
          )}
        </div>
      </div>
    </nav>
  );
};

export default Nav;
