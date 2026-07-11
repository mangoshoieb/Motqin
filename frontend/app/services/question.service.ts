import { API_ROUTES } from "../constants/planner.constants";
import axiosInstance from "../lib/axios";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error: string | null;
}

export const questionService = {
  async getQuestionsByLesson(lessonId: string | number): Promise<Question[]> {
    const response = await axiosInstance.get<ApiEnvelope<Question[]>>(
      API_ROUTES.QUESTIONS.BY_LESSON,
      {
        params: { lessonId },
      }
    );

    return response.data.data ?? [];
  },

  async addMcqQuestion(input: AddMcqQuestionInput): Promise<UserAddedQuestion> {
    const response = await axiosInstance.post<ApiEnvelope<UserAddedQuestion>>(
      API_ROUTES.QUESTIONS.ADD_MCQ,
      input
    );

    return response.data.data;
  },

  async addFillQuestion(input: AddFillQuestionInput): Promise<UserAddedQuestion> {
    const response = await axiosInstance.post<ApiEnvelope<UserAddedQuestion>>(
      API_ROUTES.QUESTIONS.ADD_FILL,
      input
    );

    return response.data.data;
  },
};
