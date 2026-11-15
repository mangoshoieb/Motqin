import { HomeFeatureStats } from "../types/home.types";

// TODO(api): replace with the real endpoint once the backend sends it, e.g.
//   const { data } = await axiosInstance.get("/home/feature-stats");
//   return data.data;
// Until then this returns fixed mock numbers so the home page can be built.
const MOCK_STATS: HomeFeatureStats = {
  planner: { todaySessions: 3, completedSessions: 1 },
  competitions: { rank: 12 },
  quiz: { lastScorePercent: 85 },
  blocker: { activeUntil: "21:00" },
};

export const homeService = {
  async getFeatureStats(): Promise<HomeFeatureStats> {
    return MOCK_STATS;
  },
};
