// Question categories are fixed per the product spec. `value` must match the
// backend's informationCategory / QuestionCategory string verbatim.
export const QUESTION_CATEGORIES = [
  { value: "أساسيات", label: "أساسي" },
  { value: "معلومات إضافية", label: "إضافية" },
  { value: "معلومات مهمة", label: "متقدم" },
] as const;

export type QuestionCategoryValue = (typeof QUESTION_CATEGORIES)[number]["value"];
