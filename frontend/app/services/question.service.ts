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

  // multipart/form-data, field names as the backend binds them. Arrays go
  // over as the same key repeated (AnswerOptions=a&AnswerOptions=b), which is
  // how ASP.NET binds a List<string> from a form.
  async addUserQuestion(input: AddUserQuestionInput): Promise<void> {
    const form = new FormData();
    form.append("LessonID", String(input.lessonID));
    form.append("QuestionCategory", input.questionCategory);
    if (input.displayOrder !== undefined) form.append("DisplayOrder", String(input.displayOrder));
    if (input.title) form.append("Title", input.title);
    form.append("Description", input.description);
    form.append("Explanation", input.explanation);
    if (input.image) form.append("Image", input.image);
    if (input.audio) form.append("Audio", input.audio);
    form.append("McqText", input.mcqText);
    input.answerOptions.forEach((option) => form.append("AnswerOptions", option));
    form.append("CorrectAnswer", input.correctAnswer);

    if (input.fibText) {
      form.append("FibText", input.fibText);
      (input.correctText ?? []).forEach((text) => form.append("CorrectText", text));
      form.append("CaseSensitive", String(!!input.caseSensitive));
    }

    // Let the browser set the multipart boundary.
    await axiosInstance.post(API_ROUTES.QUESTIONS.ADD_USER_QUESTION, form, {
      headers: { "Content-Type": undefined },
    });
  },

  // POST /uploads — the lesson material (a PDF or a photo of it) the AI
  // generates questions from. Swagger documents the response as a bare
  // object, so callers refetch the questions instead of reading it.
  async uploadForAiQuestions(file: File): Promise<unknown> {
    const form = new FormData();
    form.append("file", file);

    const response = await axiosInstance.post<ApiEnvelope<unknown>>(
      API_ROUTES.UPLOADS.POST,
      form,
      { headers: { "Content-Type": undefined } }
    );

    return response.data?.data;
  },
};
