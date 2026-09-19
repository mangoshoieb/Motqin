"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Rocket, Settings2, Sparkles } from "lucide-react";

import { usePlannerPreferences } from "@/app/hooks/usePlannerPreferences";
import Skeleton from "@/components/ui/Skeleton";
import GoalsSection from "@/components/Planner/GoalsSection";
import NextWeekBusyTimesStep from "@/components/Planner/NextWeekBusyTimesStep";

interface AiPlanningSectionProps {
  onPlanned?: () => void;
}

/**
 * The "plan with AI" tab:
 *   no preferences yet  → intro card that sends the user to set them up
 *   preferences exist   → optional next-week busy-times step → goals form
 */
export default function AiPlanningSection({ onPlanned }: AiPlanningSectionProps) {
  const router = useRouter();
  const { hasPreferences, isLoading } = usePlannerPreferences();
  // Asked on every visit (optional — adding nothing and continuing is fine)
  // — it's the reminder to tell the planner about next week before listing
  // goals.
  const [busyStepDone, setBusyStepDone] = useState(false);

  if (isLoading) {
    return (
      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="mt-3 h-4 w-full max-w-xl" />
        <Skeleton className="mt-6 h-40 w-full" />
      </div>
    );
  }

  if (!hasPreferences) {
    return (
      <div
        dir="rtl"
        className="mt-6 overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-blue-100 p-8 text-center shadow-md shadow-indigo-500/10 dark:border-indigo-900/50 dark:from-indigo-950/30 dark:via-zinc-900 dark:to-blue-950/40 md:p-12"
      >
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-gradient-to-l from-indigo-600 to-blue-400 text-white shadow-lg shadow-indigo-500/30">
          <Sparkles size={30} />
        </span>

        <h2 className="mt-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          خطّط أسبوعك بالذكاء الاصطناعي
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
          نعتمد على أهم الدراسات في التخطيط بناءً على تفضيلاتك ومهامك خلال الأسبوع، لذلك
          يجب إدخال التفضيلات أولًا للحصول على تخطيط أفضل.
        </p>

        <button
          type="button"
          onClick={() =>
            router.push(`/settings/planner?return=${encodeURIComponent("/planner?tab=ai")}`)
          }
          className="mx-auto mt-8 flex items-center gap-2 rounded-2xl bg-gradient-to-l from-indigo-600 to-blue-400 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40"
        >
          <Rocket size={20} />
          ابدأ الرحلة
        </button>

        <p className="mt-4 flex items-center justify-center gap-1 text-xs text-zinc-400">
          <Settings2 size={12} />
          وقت النوم، ساعات الدراسة، مدة الجلسة، وأوقاتك المشغولة
        </p>
      </div>
    );
  }

  if (!busyStepDone) {
    return <NextWeekBusyTimesStep onContinue={() => setBusyStepDone(true)} />;
  }

  return <GoalsSection onPlanned={onPlanned} />;
}
