"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  achievements as achievementsMock,
  challenges as challengesMock,
  myLeague as myLeagueMock,
  myRankCard as myRankCardMock,
} from "@/app/data/competitions";
import {
  Achievement,
  Challenge,
  League,
  MyRankCard,
} from "@/app/types/competition.types";

// Mock for now — the backend has the Competition/CompetitionEntry models but
// no CompetitionsController yet. Each queryFn below is the single seam to
// replace with a real fetch (the expected paths are already written down in
// COMPETITION_API_ROUTES); the shapes returned here are what the components
// consume, so swapping them shouldn't require touching any UI.

const COMPETITION_KEYS = {
  myCard: ["competitions", "my-card"] as const,
  league: ["competitions", "league"] as const,
  challenges: ["competitions", "challenges"] as const,
  achievements: ["competitions", "achievements"] as const,
};

async function fetchMyRankCard(): Promise<MyRankCard> {
  return myRankCardMock;
}

async function fetchMyLeague(): Promise<League> {
  return myLeagueMock;
}

async function fetchChallenges(): Promise<Challenge[]> {
  return challengesMock;
}

async function fetchAchievements(): Promise<Achievement[]> {
  return achievementsMock;
}

export const useMyRankCard = () =>
  useQuery({ queryKey: COMPETITION_KEYS.myCard, queryFn: fetchMyRankCard });

export const useMyLeague = () =>
  useQuery({ queryKey: COMPETITION_KEYS.league, queryFn: fetchMyLeague });

export const useChallenges = () =>
  useQuery({ queryKey: COMPETITION_KEYS.challenges, queryFn: fetchChallenges });

export const useAchievements = () =>
  useQuery({ queryKey: COMPETITION_KEYS.achievements, queryFn: fetchAchievements });

// Joining is optimistic against the query cache only — POST
// /competitions/{id}/entries doesn't exist yet, so nothing is persisted and a
// refresh resets it. Kept as a mutation (rather than local state in the card)
// so wiring the real endpoint is a one-line change to mutationFn.
export const useJoinChallenge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (competitionId: number) => competitionId,
    onSuccess: (competitionId) => {
      queryClient.setQueryData<Challenge[]>(COMPETITION_KEYS.challenges, (prev) =>
        prev?.map((c) =>
          c.competitionId === competitionId
            ? {
                ...c,
                status: "joined",
                participants: c.participants + 1,
                myEntry: {
                  entryId: -competitionId, // placeholder until the server assigns one
                  competitionId,
                  userId: "me",
                  score: 0,
                  rank: c.participants + 1,
                },
              }
            : c
        )
      );
    },
  });
};
