"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { usePlannerPreferences } from "@/app/hooks/usePlannerPreferences";
import Skeleton from "@/components/ui/Skeleton";
import AiPlanningIntro from "@/components/Planner/AiPlanningIntro";
import GoalsSection from "@/components/Planner/GoalsSection";
import NextWeekBusyTimesStep from "@/components/Planner/NextWeekBusyTimesStep";
import PlannerStepper, { PlannerStep } from "@/components/Planner/PlannerStepper";

interface AiPlanningSectionProps {
  onPlanned?: () => void;
}

const SETTINGS_RETURN = `/settings/planner?return=${encodeURIComponent("/planner?tab=ai")}`;

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
  const [stage, setStage] = useState<"intro" | "busy" | "goals">("intro");

  if (isLoading) {
    return (
      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="mt-3 h-4 w-full max-w-xl" />
        <Skeleton className="mt-6 h-40 w-full" />
      </div>
    );
  }

  // Stage 1 counts as done the moment the preferences exist, so a returning
  // user lands on the intro already pointed at stage 2.
  const currentStep: PlannerStep =
    stage === "goals" ? 3 : stage === "busy" ? 2 : hasPreferences ? 2 : 1;
  const completed: PlannerStep[] = [
    ...(hasPreferences ? ([1] as PlannerStep[]) : []),
    ...(stage === "goals" ? ([2] as PlannerStep[]) : []),
  ];

  // Stage 1 lives on the settings page; stage 2 is a step in this flow.
  const goToStep = (step: PlannerStep) => {
    if (step === 1) router.push(SETTINGS_RETURN);
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
          onStart={() => (hasPreferences ? setStage("busy") : router.push(SETTINGS_RETURN))}
        />
      )}
    </>
  );
}
