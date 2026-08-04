"use client";

import Skeleton from "@/components/ui/Skeleton";
import { useDistractionControls } from "@/app/hooks/useDistractionControls";
import { EnforcementBanner } from "@/components/Focus/EnforcementBanner";
import { FocusSessionCard } from "@/components/Focus/FocusSessionCard";
import { BlockedAppsGrid } from "@/components/Focus/BlockedAppsGrid";
import { BlockingOptions } from "@/components/Focus/BlockingOptions";
import { SupervisorCard } from "@/components/Focus/SupervisorCard";

export default function FocusPage() {
  const { data: controls, isLoading, isError } = useDistractionControls();

  return (
    <main className="min-h-screen w-full bg-zinc-100 dark:bg-zinc-950" dir="rtl">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            منع المشتتات
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            اضبط سياسة الحجب وتابع استخدامك — وابدأ جلسة تركيز الآن من المتصفح مباشرة.
          </p>
        </header>

        {isLoading ? (
          <div className="space-y-5">
            <Skeleton className="h-28 w-full rounded-3xl" />
            <Skeleton className="h-72 w-full rounded-3xl" />
            <Skeleton className="h-80 w-full rounded-3xl" />
          </div>
        ) : isError || !controls ? (
          <div className="rounded-3xl border border-zinc-200 bg-white p-10 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-zinc-500 dark:text-zinc-400">
              تعذر تحميل إعدادات منع المشتتات. حاول تحديث الصفحة.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Leads the page: the student should know what is and isn't being
                enforced before reading a single setting below it. */}
            <EnforcementBanner state={controls.enforcement} />

            {/* Placed above the policy on purpose — it's the one thing here
                that works today, so it shouldn't sit at the bottom. */}
            <FocusSessionCard />

            <BlockedAppsGrid apps={controls.apps} />

            <BlockingOptions
              mode={controls.mode}
              windows={controls.windows}
              isActive={controls.isActive}
              blockedCount={controls.apps.filter((a) => a.blocked).length}
              hasDevice={controls.enforcement !== "noDevice"}
            />

            <SupervisorCard supervisor={controls.supervisor} />
          </div>
        )}
      </div>
    </main>
  );
}
