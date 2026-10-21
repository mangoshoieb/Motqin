import axiosInstance from "../lib/axios";
import { COMPETITION_LIVE_ROUTES } from "../constants/competition.constants";
import {
  AchievementLeader,
  MyInvite,
  ReferralLeader,
  StreakLeader,
} from "../types/competition.types";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

// my-invite answers in the { success, data } envelope while the leaderboards
// are documented as bare arrays — accept either for every call.
const unwrap = <T>(body: ApiEnvelope<T> | T): T =>
  body && typeof body === "object" && "data" in body && "success" in body
    ? (body as ApiEnvelope<T>).data
    : (body as T);

const leaderboard = async <T>(url: string): Promise<T[]> => {
  const { data } = await axiosInstance.get<ApiEnvelope<T[]> | T[]>(url);
  const rows = unwrap<T[]>(data);
  return Array.isArray(rows) ? rows : [];
};

export const competitionService = {
  async getMyInvite(): Promise<MyInvite> {
    const { data } = await axiosInstance.get<ApiEnvelope<MyInvite> | MyInvite>(
      COMPETITION_LIVE_ROUTES.MY_INVITE,
    );
    return unwrap<MyInvite>(data);
  },

  getStreakLeaders: (n: number) =>
    leaderboard<StreakLeader>(COMPETITION_LIVE_ROUTES.STREAK_TOP(n)),

  getReferralLeaders: (n: number) =>
    leaderboard<ReferralLeader>(COMPETITION_LIVE_ROUTES.REFERRAL_TOP(n)),

  getAchievementLeaders: (n: number) =>
    leaderboard<AchievementLeader>(COMPETITION_LIVE_ROUTES.ACHIEVEMENT_TOP(n)),
};
