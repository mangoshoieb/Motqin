"use client";

import {
  BrainCircuit,
  GraduationCap,
  PencilLine,
  Rocket,
  Settings2,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";

import { cn } from "@/app/lib/utils";

// The three selling points, each on its own line with its own icon.
const highlights: { icon: typeof BrainCircuit; text: string }[] = [
  { icon: BrainCircuit, text: "نعتمد على أهم الدراسات في التخطيط" },
  { icon: SlidersHorizontal, text: "بناءً على تفضيلاتك ومهامك خلال الأسبوع" },
  { icon: PencilLine, text: "مع القدرة على التعديل والإضافة في أي وقت" },
];

interface AiPlanningIntroProps {
  /** Decides the call to action: start the journey, or carry on with it. */
  hasPreferences: boolean;
  /** Whether every subject's lesson times are on the weekly schedule. */
  coursesScheduled?: boolean;
  /** How many subjects are still missing theirs, for the hint below. */
  missingCoursesCount?: number;
  onStart: () => void;
}

/**
 * The card that opens the AI planning flow — shown on every visit, with the
 * button pointing at whatever the user still has to do.
 */
export default function AiPlanningIntro({
  hasPreferences,
  coursesScheduled = true,
  missingCoursesCount = 0,
  onStart,
}: AiPlanningIntroProps) {
  // The preferences are saved but the lessons aren't — the one case the
  // hint below is a thing left to do rather than a description.
  const needsCourses = hasPreferences && !coursesScheduled;
  const hint = !hasPreferences
    ? "وقت النوم، ساعات الدراسة، مدة الجلسة، وأوقاتك المشغولة"
    : needsCourses
      ? missingCoursesCount > 0
        ? `بقي أن تضيف مواعيد الدروس لـ ${missingCoursesCount} من موادك`
        : "بقي أن تضيف مواعيد دروسك الأسبوعية"
      : "تفضيلاتك جاهزة — تابع بإضافة أوقاتك المشغولة ثم أهدافك";

  return (
    <div
      dir="rtl"
      className="mt-4 overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-blue-100 p-8 text-center shadow-md shadow-indigo-500/10 dark:border-indigo-900/50 dark:from-indigo-950/30 dark:via-zinc-900 dark:to-blue-950/40 md:p-12"
    >
      <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-gradient-to-l from-indigo-600 to-blue-400 text-white shadow-lg shadow-indigo-500/30">
        <Sparkles size={30} />
      </span>

      <h2 className="mt-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        خطّط أسبوعك بالذكاء الاصطناعي
      </h2>

      <ul className="mx-auto mt-6 flex max-w-md flex-col gap-3 text-right">
        {highlights.map(({ icon: Icon, text }) => (
          <li
            key={text}
            className="flex items-center gap-3 rounded-xl border border-white/70 bg-white/70 px-4 py-3 text-sm font-medium leading-relaxed text-zinc-700 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-200 sm:text-base"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600/10 text-indigo-600 dark:bg-blue-400/10 dark:text-blue-400">
              <Icon size={17} />
            </span>
            {text}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onStart}
        className="mx-auto mt-8 flex items-center gap-2 rounded-2xl bg-gradient-to-l from-indigo-600 to-blue-400 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40"
      >
        <Rocket size={20} />
        {hasPreferences ? "أكمل الرحلة" : "ابدأ الرحلة"}
      </button>

      <p
        className={cn(
          "mt-4 flex items-center justify-center gap-1 text-xs",
          needsCourses ? "text-amber-600 dark:text-amber-400" : "text-zinc-400",
        )}
      >
        {needsCourses ? <GraduationCap size={13} /> : <Settings2 size={12} />}
        {hint}
      </p>
    </div>
  );
}
