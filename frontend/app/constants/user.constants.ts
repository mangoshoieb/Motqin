// Backend enums (see Swagger GradeLevel / EducationalStage).
export const GRADE_LEVEL_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: "الصف الأول" },
  { value: 2, label: "الصف الثاني" },
  { value: 3, label: "الصف الثالث" },
  { value: 4, label: "الصف الرابع" },
  { value: 5, label: "الصف الخامس" },
  { value: 6, label: "الصف السادس" },
];

export const EDUCATIONAL_STAGE_LABELS: Record<number, string> = {
  1: "ابتدائي",
  2: "إعدادي",
  3: "ثانوي",
  4: "جامعي",
};

export const gradeLevelLabel = (value?: number | null) =>
  GRADE_LEVEL_OPTIONS.find((o) => o.value === value)?.label ?? (value ? String(value) : "—");

export const educationalStageLabel = (value?: number | null) =>
  (value && EDUCATIONAL_STAGE_LABELS[value]) || (value ? String(value) : "—");
