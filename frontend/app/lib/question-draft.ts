// The editable form of one question — what the add-question popup and each
// card on the AI review page hold while the student works on it, before it
// becomes an AddUserQuestionInput.

import {
  QUESTION_CATEGORIES,
  isQuestionCategory,
  type QuestionCategoryValue,
} from "../constants/question.constants";
import { base64ToJpegFile } from "./image";

export const MIN_OPTIONS = 2;

export interface QuestionDraft {
  category: QuestionCategoryValue;
  title: string;
  description: string;
  explanation: string;
  image: File | null;
  audio: File | null;
  mcqText: string;
  options: string[];
  // Index into `options`; the answer is sent as that option's text.
  correctIndex: number | null;
  // The fill-in-the-blank card is optional and sits behind a toggle.
  withFib: boolean;
  fibText: string;
  correctTexts: string[];
  caseSensitive: boolean;
}

export const emptyQuestionDraft = (category: QuestionCategoryValue): QuestionDraft => ({
  category,
  title: "",
  description: "",
  explanation: "",
  image: null,
  audio: null,
  mcqText: "",
  options: ["", "", "", ""],
  correctIndex: null,
  withFib: false,
  fibText: "",
  correctTexts: [""],
  caseSensitive: false,
});

export type QuestionDraftErrors = Partial<
  Record<"description" | "explanation" | "mcqText" | "options" | "fibText" | "correctTexts", string>
>;

const filled = (values: string[]) => values.map((v) => v.trim()).filter(Boolean);

export function validateQuestionDraft(draft: QuestionDraft): QuestionDraftErrors {
  const errors: QuestionDraftErrors = {};
  const options = filled(draft.options);
  const correct = draft.correctIndex !== null ? draft.options[draft.correctIndex]?.trim() : "";

  if (!draft.description.trim()) errors.description = "الوصف مطلوب.";
  if (!draft.explanation.trim()) errors.explanation = "الشرح مطلوب.";
  if (!draft.mcqText.trim()) errors.mcqText = "نص السؤال مطلوب.";

  if (options.length < MIN_OPTIONS) errors.options = "أضف خيارين على الأقل.";
  else if (new Set(options).size !== options.length) errors.options = "لا يمكن تكرار نفس الخيار.";
  else if (!correct) errors.options = "اختر الإجابة الصحيحة بالضغط على الدائرة بجانبها.";

  if (draft.withFib) {
    if (!draft.fibText.trim()) errors.fibText = "نص سؤال أكمل الفراغ مطلوب.";
    if (filled(draft.correctTexts).length === 0)
      errors.correctTexts = "أضف إجابة مقبولة واحدة على الأقل.";
  }

  return errors;
}

export const hasDraftErrors = (errors: QuestionDraftErrors) => Object.keys(errors).length > 0;

export function questionDraftToInput(
  draft: QuestionDraft,
  lessonId: number,
  displayOrder: number
): AddUserQuestionInput {
  return {
    lessonID: lessonId,
    questionCategory: draft.category,
    displayOrder,
    title: draft.title.trim() || undefined,
    description: draft.description.trim(),
    explanation: draft.explanation.trim(),
    image: draft.image,
    audio: draft.audio,
    mcqText: draft.mcqText.trim(),
    answerOptions: filled(draft.options),
    correctAnswer: draft.correctIndex !== null ? draft.options[draft.correctIndex].trim() : "",
    ...(draft.withFib && {
      fibText: draft.fibText.trim(),
      correctText: filled(draft.correctTexts),
      caseSensitive: draft.caseSensitive,
    }),
  };
}

// One question as POST /ai/fill-questions-from-pdf returns it — the same
// fields as a regular question, plus where in the PDF it came from. Any of
// them may be missing or null; a missing one just leaves its field empty.
export interface AiGeneratedQuestion {
  questionCategory?: string | null;
  displayOrder?: number | null;
  title?: string | null;
  description?: string | null;
  explanation?: string | null;
  mcqText?: string | null;
  answerOptions?: string[] | null;
  correctAnswer?: string | null;
  fibText?: string | null;
  correctText?: string[] | null;
  caseSensitive?: boolean | null;
  pageNumber?: number | null;
  region?: number | null;
  imageBase64?: string | null;
}

export async function aiQuestionToDraft(
  question: AiGeneratedQuestion,
  index: number
): Promise<QuestionDraft> {
  const options = (question.answerOptions ?? []).map((o) => o ?? "");
  while (options.length < MIN_OPTIONS) options.push("");
  const correct = question.correctAnswer?.trim();
  const correctIndex = correct ? options.findIndex((o) => o.trim() === correct) : -1;

  const correctTexts = (question.correctText ?? []).filter((t) => t?.trim());
  const withFib = !!question.fibText?.trim() || correctTexts.length > 0;

  let image: File | null = null;
  if (question.imageBase64) {
    // A broken image shouldn't cost the student the whole question.
    image = await base64ToJpegFile(question.imageBase64, `question-${index + 1}.jpg`).catch(
      () => null
    );
  }

  return {
    category: isQuestionCategory(question.questionCategory)
      ? question.questionCategory
      : QUESTION_CATEGORIES[0].value,
    title: question.title ?? "",
    description: question.description ?? "",
    explanation: question.explanation ?? "",
    image,
    audio: null,
    mcqText: question.mcqText ?? "",
    options,
    correctIndex: correctIndex >= 0 ? correctIndex : null,
    withFib,
    fibText: question.fibText ?? "",
    correctTexts: correctTexts.length ? correctTexts : [""],
    caseSensitive: !!question.caseSensitive,
  };
}
