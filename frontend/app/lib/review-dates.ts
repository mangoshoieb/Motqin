// Review dates come from the spaced-repetition API in UTC (sometimes without
// a "Z"). The backend now reads days in the student's country, so the site
// shows and compares them as local days too.

import { parseServerDate } from "./session-clock";
import { dateOnly } from "./study-plan";

// The review's calendar day in the student's local time, YYYY-MM-DD.
export const localDayOf = (serverDate: string): string => {
  const time = parseServerDate(serverDate);
  return time === null ? serverDate.slice(0, 10) : dateOnly(new Date(time));
};

const dayFormatter = new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

// "الخميس، 12 نوفمبر" — for a UTC date from the API.
export const formatReviewDate = (serverDate: string): string => {
  const time = parseServerDate(serverDate);
  return time === null ? serverDate.slice(0, 10) : dayFormatter.format(new Date(time));
};

// "يوم واحد / يومين / 3 أيام / 12 يومًا"
export const daysPhrase = (n: number): string =>
  n === 1 ? "يوم واحد" : n === 2 ? "يومين" : n <= 10 ? `${n} أيام` : `${n} يومًا`;

// "سؤال واحد / سؤالان / 3 أسئلة / 12 سؤالًا"
export const questionsPhrase = (n: number): string =>
  n === 1 ? "سؤال واحد" : n === 2 ? "سؤالان" : n <= 10 ? `${n} أسئلة` : `${n} سؤالًا`;
