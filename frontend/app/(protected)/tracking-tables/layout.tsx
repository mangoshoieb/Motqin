"use client";

import Link from "next/link";
import { DirectionProvider } from "@base-ui/react/direction-provider";
import { Lock } from "lucide-react";
import Skeleton from "@/components/ui/Skeleton";
import { useTrackingAccess } from "@/app/hooks/useTrackingAccess";

// Tracking tables are for teachers (and the admins who support them), plus
// anyone a teacher added as an assistant. The backend checks access too;
// this only spares everyone else a broken page.
export default function TrackingTablesLayout({ children }: { children: React.ReactNode }) {
  const { canEnter, isLoading } = useTrackingAccess();

  let content = children;
  if (isLoading) {
    content = (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Skeleton className="h-10 w-64" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  } else if (!canEnter) {
    content = (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
        <div className="flex size-16 items-center justify-center rounded-3xl bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          <Lock size={28} />
        </div>
        <h1 className="mt-5 text-xl font-bold text-zinc-900 dark:text-zinc-100">جداول المتابعة للمعلمين</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          هذه الصفحة متاحة لحسابات المعلمين ومساعديهم. إذا كنت معلمًا تواصل مع الدعم لتفعيل حسابك، وإذا كنت
          مساعدًا اطلب من المعلم أن يضيفك برقم هاتفك.
        </p>
        <Link href="/" className="mt-6 rounded-xl bg-blue-600 dark:bg-blue-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 dark:hover:bg-blue-800">
          العودة للرئيسية
        </Link>
      </div>
    );
  }

  return (
    <DirectionProvider direction="rtl">
      <main dir="rtl" className="min-h-[calc(100vh-4rem)] w-full bg-zinc-100 dark:bg-zinc-950">
        {content}
      </main>
    </DirectionProvider>
  );
}
