import { API_ROUTES } from "../constants/planner.constants";
import axiosInstance from "../lib/axios";

// A lesson the student adds for themselves, under a subject they can see
// (a system subject of their curriculum, or one of their own).
export interface CustomLessonPayload {
  title: string;
  // Minutes.
  estimatedDuration?: number | null;
  notes?: string[] | null;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: unknown;
}

export const motqinService = {
  // GET /lessons/customized-user-lessons answers with a flat list of the
  // subject's system lessons plus the student's own, each flagged with
  // isMine. Reshaped into the old { subjectId, totalCount, lessons } so every
  // picker that reads `data.lessons` keeps working.
  async getLessons(subjectId: string): Promise<Lessons> {
    const response = await axiosInstance.get<ApiResponse<Lesson[] | null>>(
      API_ROUTES.LESSONS.USER_LESSONS,
      {
        params: {
          subjectId,
        },
      },
    );

    const lessons = Array.isArray(response.data?.data) ? response.data.data : [];
    return {
      subjectId: Number(subjectId),
      totalCount: lessons.length,
      lessons,
    };
  },

  async createCustomLesson(
    subjectId: number,
    payload: CustomLessonPayload,
  ): Promise<Lesson> {
    const response = await axiosInstance.post<ApiResponse<Lesson>>(
      API_ROUTES.LESSONS.CUSTOMIZED,
      { subjectID: subjectId, ...payload },
    );

    return response.data.data;
  },

  async updateCustomLesson(id: number, payload: CustomLessonPayload): Promise<Lesson> {
    const response = await axiosInstance.put<ApiResponse<Lesson>>(
      API_ROUTES.LESSONS.CUSTOMIZED_BY_ID(id),
      payload,
    );

    return response.data.data;
  },

  // Soft delete on the backend — the lesson leaves the list, but sessions,
  // plans and questions pointing at it keep working.
  async removeCustomLesson(id: number): Promise<void> {
    await axiosInstance.delete(API_ROUTES.LESSONS.CUSTOMIZED_BY_ID(id));
  },
}
