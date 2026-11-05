"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/app/lib/utils";
import { useIncomingMentorRequests, useMentees } from "@/app/hooks/useMentorship";
import { awaitsApproval } from "@/app/lib/mentorship";
import {
  Settings as SettingsIcon,
  Palette,
  UserCog,
  CalendarClock,
  ListChecks,
  Bot,
  Bell,
  CreditCard,
  ShieldOff,
  UsersRound,
  GraduationCap,
  UserCheck,
  Handshake,
  type LucideIcon,
} from "lucide-react";
import { useTrackingAccess } from "@/app/hooks/useTrackingAccess";

interface SettingsNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  external?: boolean; // navigates away from the settings shell entirely
  // Shown only to some users (teachers, assistants).
  show?: (access: { isTeacher: boolean; assists: boolean }) => boolean;
}

const navItems: SettingsNavItem[] = [
  { label: "عام", href: "/settings", icon: SettingsIcon },
  { label: "المظهر", href: "/settings/appearance", icon: Palette },
  { label: "الحساب", href: "/settings/account", icon: UserCog },
  { label: "تفضيلات المخطط", href: "/settings/planner", icon: CalendarClock },
  { label: "تفضيلات متقن", href: "/settings/quiz", icon: ListChecks },
  { label: "تفضيلات دليل", href: "/settings/ai-teacher", icon: Bot },
  { label: "منع المشتتات", href: "/settings/blocker", icon: ShieldOff },
  { label: "المشرفون", href: "/settings/mentors", icon: UsersRound },
  { label: "طلابي", href: "/settings/mentees", icon: GraduationCap },
  {
    label: "مساعدو الجداول",
    href: "/settings/assistants",
    icon: UserCheck,
    show: ({ isTeacher }) => isTeacher,
  },
  {
    label: "أساعد المعلمين",
    href: "/settings/assisting",
    icon: Handshake,
    show: ({ assists }) => assists,
  },
  { label: "الإشعارات", href: "/settings/notifications", icon: Bell },
  { label: "الاشتراك", href: "/subscription", icon: CreditCard, external: true },
];

// What's waiting on the user as a mentor: requests to answer, changes to
// approve, and unlock codes to read out.
const useMenteesBadge = () => {
  const { data: incoming } = useIncomingMentorRequests();
  const { data: mentees } = useMentees({ poll: false });
  return (
    (incoming?.length ?? 0) +
    (mentees?.filter((mentee) => awaitsApproval(mentee) || mentee.unlockCode).length ?? 0)
  );
};

export const SettingsSidebar = () => {
  const pathname = usePathname();
  const menteesBadge = useMenteesBadge();
  const { isTeacher, links } = useTrackingAccess();
  const access = { isTeacher, assists: links.length > 0 };

  return (
    <nav className="flex flex-col gap-1 rounded-2xl bg-white border border-zinc-200 p-3 dark:bg-zinc-900 dark:border-zinc-800">
      {navItems.filter((item) => !item.show || item.show(access)).map((item) => {
        const Icon = item.icon;
        // Sub-pages (a student's detail) keep their section highlighted.
        const isActive =
          !item.external &&
          (pathname === item.href ||
            (item.href !== "/settings" && pathname.startsWith(`${item.href}/`)));
        const badge = item.href === "/settings/mentees" ? menteesBadge : 0;

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
            {badge > 0 && (
              <span className="ms-auto flex min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[11px] font-bold text-white">
                {badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
};
