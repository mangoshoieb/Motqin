"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { usePlannerPreferences } from "@/app/hooks/usePlannerPreferences";
import { useCoursesScheduleValidation } from "@/app/hooks/useCoursesSchedule";
import Skeleton from "@/components/ui/Skeleton";
import AiPlanningIntro from "@/components/Planner/AiPlanningIntro";
import GoalsSection from "@/components/Planner/GoalsSection";
import NextWeekBusyTimesStep from "@/components/Planner/NextWeekBusyTimesStep";
import PlannerStepper, { PlannerStep } from "@/components/Planner/PlannerStepper";

interface AiPlanningSectionProps {
  onPlanned?: () => void;
}

const settingsHref = (tab?: "courses") =>
  `/settings/planner?${tab ? `tab=${tab}&` : ""}return=${encodeURIComponent("/planner?tab=ai")}`;

/**
 * The "plan with AI" tab. The intro card always opens the flow — only its
 * button changes: it sends a user without preferences off to set them up, and
 * one who already has them straight on to the next stage.
 *
 *   intro → busy times (next week only) → goals
 */
export default function AiPlanningSection({ onPlanned }: AiPlanningSectionProps) {
  const router = useRouter();
  const { hasPreferences, isLoading } = usePlannerPreferences();
  // The planner also needs to know when the user's lessons are, or it has
  // no idea which hours of the week are already taken.
  const { isComplete: coursesScheduled, missingCount, isLoading: coursesLoading } =
    useCoursesScheduleValidation();
  const [stage, setStage] = useState<"intro" | "busy" | "goals">("intro");

  if (isLoading || coursesLoading) {
    return (
      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="mt-3 h-4 w-full max-w-xl" />
        <Skeleton className="mt-6 h-40 w-full" />
      </div>
    );
  }

  // Stage 1 is the whole of the settings page: the basic preferences *and*
  // the weekly lesson times. Either one missing sends the user back there.
  const setupDone = hasPreferences && coursesScheduled;
  const currentStep: PlannerStep =
    stage === "goals" ? 3 : stage === "busy" ? 2 : setupDone ? 2 : 1;
  const completed: PlannerStep[] = [
    ...(setupDone ? ([1] as PlannerStep[]) : []),
    ...(stage === "goals" ? ([2] as PlannerStep[]) : []),
  ];

  // Straight to the lessons tab when that's the part still missing.
  const setupHref = settingsHref(hasPreferences && !coursesScheduled ? "courses" : undefined);

  // Stage 1 lives on the settings page; stage 2 is a step in this flow.
  const goToStep = (step: PlannerStep) => {
    if (step === 1) router.push(setupHref);
    else if (step === 2) setStage("busy");
  };

  return (
    <>
      <PlannerStepper current={currentStep} completed={completed} onStepClick={goToStep} />

      {stage === "busy" ? (
        <NextWeekBusyTimesStep onContinue={() => setStage("goals")} />
      ) : stage === "goals" ? (
        <GoalsSection onPlanned={onPlanned} onBack={() => setStage("busy")} />
      ) : (
        <AiPlanningIntro
          hasPreferences={hasPreferences}
          coursesScheduled={coursesScheduled}
          missingCoursesCount={missingCount}
          onStart={() => (setupDone ? setStage("busy") : router.push(setupHref))}
        />
      )}
    </>
  );
}
