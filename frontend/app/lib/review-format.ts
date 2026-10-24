import { QUESTION_CATEGORIES } from "@/app/constants/question.constants";

// Wording and links shared by the subjects page's review section and the
// full review table (/spaced-repetition).

// "يوم / يومين / 3 أيام / 12 يومًا"
export const daysWord = (n: number) =>
  n === 1 ? "يوم" : n === 2 ? "يومين" : n <= 10 ? `${n} أيام` : `${n} يومًا`;

// How far a day is from today, in words — "متأخرة" for a review still due.
export const dueLabel = (days: number) => {
  if (days < -1) return `متأخرة ${daysWord(-days)}`;
  if (days === -1) return "متأخرة منذ أمس";
  if (days === 0) return "اليوم";
  if (days === 1) return "غدًا";
  return `بعد ${daysWord(days)}`;
};

// Same, for a day that's simply in the past or future.
export const relativeDayLabel = (days: number) => {
  if (days < -1) return `منذ ${daysWord(-days)}`;
  if (days === -1) return "أمس";
  if (days === 0) return "اليوم";
  if (days === 1) return "غدًا";
  return `بعد ${daysWord(days)}`;
};

const dayFormatter = new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
  weekday: "long",
  day: "numeric",
  month: "long",
});
const longDayFormatter = new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});
const shortDayFormatter = new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
  day: "numeric",
  month: "short",
});
const shortDayYearFormatter = new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const asDate = (day: string) => new Date(`${day}T00:00:00`);
const isThisYear = (day: string) => day.slice(0, 4) === String(new Date().getFullYear());

// "الأحد، 25 أكتوبر" — the year only when it isn't this one.
export const formatDay = (day: string) => dayFormatter.format(asDate(day));
export const formatDayLong = (day: string) =>
  (isThisYear(day) ? dayFormatter : longDayFormatter).format(asDate(day));
// "25 أكتوبر"
export const formatDayShort = (day: string) =>
  (isThisYear(day) ? shortDayFormatter : shortDayYearFormatter).format(asDate(day));

export const categoryLabel = (value: string) =>
  QUESTION_CATEGORIES.find((c) => c.value === value)?.label ?? value;

// The quiz for one lesson + category, under the same "{id}-{name}" subject
// segment the subjects page links with; the quiz page only reads the id
// before the first dash.
export const reviewQuizHref = (review: {
  subjectId: number;
  subjectName?: string;
  lessonId: number;
  category: string;
}) => {
  const subject = review.subjectName
    ? `${review.subjectId}-${review.subjectName.toLowerCase().replace(/\s+/g, "-")}`
    : String(review.subjectId);
  return `/subjects/${subject}/${review.lessonId}/quiz?category=${encodeURIComponent(review.category)}`;
};
