"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DirectionProvider } from "@base-ui/react/direction-provider";
import { AlertTriangle, BadgePercent, Handshake, LayoutGrid, Lock, ShieldCheck, type LucideIcon } from "lucide-react";
import { cn } from "@/app/lib/utils";
import Skeleton from "@/components/ui/Skeleton";
import { useAuth } from "@/app/(public)/context/auth.context";
import { isAdmin, isManager } from "@/app/lib/payments";

const NAV: { label: string; href: string; Icon: LucideIcon; adminOnly?: boolean }[] = [
  { label: "الباقات", href: "/admin/bundles", Icon: LayoutGrid },
  { label: "الكوبونات والقسائم", href: "/admin/coupons", Icon: BadgePercent },
  { label: "الشركاء", href: "/admin/partners", Icon: Handshake },
  { label: "مراجعة المدفوعات", href: "/admin/payments", Icon: AlertTriangle },
  { label: "المديرون والأدوار", href: "/admin/admins", Icon: ShieldCheck, adminOnly: true },
];

// The payments dashboard: Manager and Admin accounts. The server answers
// everyone else with 403; this only spares them a broken screen.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const admin = isAdmin(user);

  let content = children;
  if (isLoading) {
    content = <Skeleton className="h-96 rounded-3xl" />;
  } else if (!isManager(user) || (pathname.startsWith("/admin/admins") && !admin)) {
    content = (
      <div className="flex flex-col items-center px-4 py-24 text-center">
        <span className="flex size-16 items-center justify-center rounded-3xl bg-zinc-200 text-zinc-500 dark:bg-zinc-800">
          <Lock size={28} />
        </span>
        <h1 className="mt-5 text-xl font-bold text-zinc-900 dark:text-zinc-100">هذه الصفحة للإدارة فقط</h1>
        <p className="mt-2 text-sm text-zinc-500">
          {isManager(user) ? "إدارة المديرين والأدوار متاحة لمسؤول النظام فقط." : "تحتاج حساب مدير لفتح لوحة الإدارة."}
        </p>
      </div>
    );
  }

  return (
    <DirectionProvider direction="rtl">
      <div dir="rtl" className="min-h-screen bg-zinc-100 px-4 py-8 sm:px-8 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-8 lg:flex-row">
          {isManager(user) && (
            <aside className="w-full shrink-0 lg:sticky lg:top-6 lg:w-60">
              <p className="mb-3 px-2 text-xs font-bold text-zinc-500">لوحة الإدارة</p>
              <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-zinc-200 bg-white p-2 lg:flex-col dark:border-zinc-800 dark:bg-zinc-900">
                {NAV.filter((item) => !item.adminOnly || admin).map(({ label, href, Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                      pathname.startsWith(href)
                        ? "bg-blue-950 text-white dark:bg-blue-100 dark:text-blue-950"
                        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
                    )}
                  >
                    <Icon size={17} /> {label}
                  </Link>
                ))}
              </nav>
            </aside>
          )}
          <main className="w-full min-w-0 flex-1">{content}</main>
        </div>
      </div>
    </DirectionProvider>
  );
}
