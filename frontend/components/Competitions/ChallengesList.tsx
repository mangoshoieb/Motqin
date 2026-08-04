"use client";

import { useState } from "react";
import { cn } from "@/app/lib/utils";
import { useJoinChallenge } from "@/app/hooks/useCompetitions";
import { Challenge } from "@/app/types/competition.types";
import { ChallengeCard } from "./ChallengeCard";

type ChallengeFilter = "active" | "official" | "duels" | "ended";

const FILTERS: { value: ChallengeFilter; label: string }[] = [
  { value: "active", label: "الجارية" },
  { value: "official", label: "مسابقات متقن" },
  { value: "duels", label: "تحديات ثنائية" },
  { value: "ended", label: "المنتهية" },
];

const applyFilter = (challenges: Challenge[], filter: ChallengeFilter) => {
  switch (filter) {
    case "active":
      return challenges.filter((c) => c.status !== "ended");
    case "official":
      return challenges.filter((c) => c.kind === "official" && c.status !== "ended");
    case "duels":
      return challenges.filter((c) => c.kind === "duel");
    case "ended":
      return challenges.filter((c) => c.status === "ended");
  }
};

interface ChallengesListProps {
  challenges: Challenge[];
}

export const ChallengesList = ({ challenges }: ChallengesListProps) => {
  const [filter, setFilter] = useState<ChallengeFilter>("active");
  const { mutate: join, isPending, variables } = useJoinChallenge();

  const visible = applyFilter(challenges, filter);

  return (
    <section className="space-y-5" dir="rtl">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition",
              filter === f.value
                ? "bg-blue-600 text-white shadow-sm"
                : "border border-zinc-300 text-zinc-600 hover:bg-white dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
          <p className="text-zinc-500 dark:text-zinc-400">لا توجد تحديات في هذا القسم حاليًا</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {visible.map((challenge) => (
            <ChallengeCard
              key={challenge.competitionId}
              challenge={challenge}
              onJoin={join}
              isJoining={isPending && variables === challenge.competitionId}
            />
          ))}
        </div>
      )}
    </section>
  );
};
