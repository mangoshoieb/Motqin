import { API_ROUTES } from "../constants/planner.constants";
import axiosInstance from "../lib/axios";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error: string | null;
}

export const questionService = {
  // Current shape: one row per piece of information, each carrying up to three
  // cards (info / MCQ / fill-in-the-blank). See LessonInformation.
  async getInformationByLesson(
    lessonId: string | number
  ): Promise<LessonInformation[]> {
    const response = await axiosInstance.get<ApiEnvelope<LessonInformation[]>>(
      API_ROUTES.QUESTIONS.BY_LESSON,
      {
        params: { lessonId },
      }
    );

    return response.data.data ?? [];
  },

  // Same payload, filtered server-side by informationCategory. The category is
  // Arabic text — axios percent-encodes it into the query string for us.
  async getInformationByCategoryAndLesson(
    lessonId: string | number,
    category: string
  ): Promise<LessonInformation[]> {
    const response = await axiosInstance.get<ApiEnvelope<LessonInformation[]>>(
      API_ROUTES.QUESTIONS.BY_CATEGORY_AND_LESSON,
      {
        params: { category, lessonId },
      }
    );

    return response.data.data ?? [];
  },

  // LEGACY — kept only for the not-yet-migrated session/quiz flow. This hits
  // the same endpoint as getInformationByLesson, so it now receives the new
  // Information payload and will not map cleanly onto `Question`. Migrate
  // useLessonSession before relying on it again.
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
