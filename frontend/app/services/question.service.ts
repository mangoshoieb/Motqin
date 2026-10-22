import { API_ROUTES } from "../constants/planner.constants";
import { QUESTION_API_ROUTES, QUESTION_CATEGORIES } from "../constants/question.constants";
import axiosInstance from "../lib/axios";
import { toJpegFile } from "../lib/image";
import type { AiGeneratedQuestion } from "../lib/question-draft";

export interface GenerateQuestionsFromPdfInput {
  pdf: File;
  notes?: string;
  // QuestionLanguage value from GET /lookups/information-languages.
  language: number;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error: string | null;
}

export const questionService = {
  // One category of a lesson: the system questions plus the ones this
  // student added. One row per piece of information, each carrying up to
  // three cards (info / MCQ / fill-in-the-blank) — see LessonInformation.
  // The category is Arabic text; axios percent-encodes it for us.
  async getCustomizedInformation(
    lessonId: string | number,
    category: string
  ): Promise<LessonInformation[]> {
    const response = await axiosInstance.get<ApiEnvelope<LessonInformation[] | null>>(
      QUESTION_API_ROUTES.CUSTOMIZED_BY_CATEGORY_AND_LESSON,
      {
        params: { category, lessonId },
      }
    );

    return response.data?.data ?? [];
  },

  // The batch a quiz session runs on — see SESSION_QUESTIONS. Only the
  // lesson and category are sent; the backend's defaults cover the rest.
  async getSessionQuestions(
    lessonId: string | number,
    category?: string
  ): Promise<LessonInformation[]> {
    const response = await axiosInstance.get<ApiEnvelope<LessonInformation[] | null>>(
      QUESTION_API_ROUTES.SESSION_QUESTIONS,
      {
        params: { lessonId, ...(category && { category }) },
      }
    );

    return response.data?.data ?? [];
  },

  // The endpoint is per category, so the whole lesson is one call per
  // category, merged.
  async getAllCustomizedInformation(lessonId: string | number): Promise<LessonInformation[]> {
    const perCategory = await Promise.all(
      QUESTION_CATEGORIES.map((c) => questionService.getCustomizedInformation(lessonId, c.value))
    );
    return perCategory.flat();
  },

  // LEGACY — unused; nothing calls it. /questions/by-lesson now returns the
  // Information payload, which will not map cleanly onto `Question`, and the
  // app reads questions through getCustomizedInformation instead.
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
    // The backend takes question images as JPEG only.
    if (input.image) form.append("Image", await toJpegFile(input.image));
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

  // The AI reads the PDF and answers with one question per piece of
  // information, in the PDF's order. Nothing is saved: the student reviews
  // them first, then each one goes through addUserQuestion. Takes about a
  // minute, so there's deliberately no client-side timeout.
  async generateFromPdf(input: GenerateQuestionsFromPdfInput): Promise<AiGeneratedQuestion[]> {
    const form = new FormData();
    form.append("Pdf", input.pdf);
    if (input.notes?.trim()) form.append("Notes", input.notes.trim());
    form.append("Language", String(input.language));

    const response = await axiosInstance.post<
      ApiEnvelope<{ questions?: AiGeneratedQuestion[] | null } | null>
    >(QUESTION_API_ROUTES.FILL_QUESTIONS_FROM_PDF, form, {
      headers: { "Content-Type": undefined },
    });

    const questions = response.data?.data?.questions;
    return Array.isArray(questions) ? questions : [];
  },
};
