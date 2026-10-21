// Question categories are fixed per the product spec. `value` must match the
// backend's informationCategory / QuestionCategory string verbatim.
export const QUESTION_CATEGORIES = [
  { value: "أساسيات", label: "أساسي" },
  { value: "معلومات إضافية", label: "إضافية" },
  { value: "معلومات مهمة", label: "متقدم" },
] as const;

export type QuestionCategoryValue = (typeof QUESTION_CATEGORIES)[number]["value"];

export const isQuestionCategory = (value: unknown): value is QuestionCategoryValue =>
  QUESTION_CATEGORIES.some((category) => category.value === value);

// Question endpoints added with student-owned lessons. Kept here rather
// than in API_ROUTES while planner.constants.ts has unrelated work in
// progress — move them over with the rest when convenient.
export const QUESTION_API_ROUTES = {
  // A lesson's questions in one category: the system ones plus the ones
  // this student added. Query: category (Arabic, verbatim), lessonId.
  CUSTOMIZED_BY_CATEGORY_AND_LESSON: "/questions/customized-by-category-and-lesson",
  // multipart: Pdf (required), Notes, Language (QuestionLanguage). Answers
  // with the generated questions; nothing is saved server-side.
  FILL_QUESTIONS_FROM_PDF: "/ai/fill-questions-from-pdf",
  // The Language choices above, with Arabic labels.
  INFORMATION_LANGUAGES: "/lookups/information-languages",
} as const;

// QuestionLanguage — 0 lets the AI answer in the PDF's own language.
export const AUTO_QUESTION_LANGUAGE = 0;
