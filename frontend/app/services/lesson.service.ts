import { API_ROUTES } from "../constants/planner.constants";
import axiosInstance from "../lib/axios";



export const motqinService = {
  async getLessons(subjectId: string): Promise<Lessons> {
    const response = await axiosInstance.get<{
      success: boolean;
      data: Lessons;
      error: string | null;
    }>(API_ROUTES.LESSONS.GET_ALL, {
      params: {
        subjectId,
      },
    });

    return response.data.data;
  }
}

