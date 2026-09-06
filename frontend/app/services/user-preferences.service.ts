import axiosInstance from "@/app/lib/axios";
import { API_ROUTES } from "@/app/constants/planner.constants";
import { PlannerPreferences } from "@/app/types/planner-preferences.types";
interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error: string | null;
}

function formatTimeForApi(time: string): string {
  if (!time) return time;

  // Already in API format
  if (time.length > 5) {
    return time;
  }

  // "02:06" -> "02:06:00.0000000"
  return `${time}:00.0000000`;
}

function preparePreferences(data: PlannerPreferences): PlannerPreferences {
  return {
    ...data,
    startSleepTime: formatTimeForApi(data.startSleepTime),
    endSleepTime: formatTimeForApi(data.endSleepTime),
  };
}

export const userPreferencesService = {
  async getPreferences(): Promise<PlannerPreferences | null> {
    const response = await axiosInstance.get<
      ApiEnvelope<PlannerPreferences | null>
    >(API_ROUTES.USER_PREFERENCES.GET);

    return response.data.data;
  },

  async createPreferences(
    data: PlannerPreferences,
  ): Promise<PlannerPreferences | null> {
    const response = await axiosInstance.post<ApiEnvelope<PlannerPreferences>>(
      API_ROUTES.USER_PREFERENCES.POST,
      preparePreferences(data),
    );

    return response.data.data;
  },

  async updatePreferences(
    data: PlannerPreferences,
  ): Promise<PlannerPreferences | null> {
    const response = await axiosInstance.put<ApiEnvelope<PlannerPreferences>>(
      API_ROUTES.USER_PREFERENCES.UPDATE,
      preparePreferences(data),
    );

    return response.data.data;
  },

  async deletePreferences(): Promise<void> {
    await axiosInstance.delete(API_ROUTES.USER_PREFERENCES.DELETE);
  },
};
