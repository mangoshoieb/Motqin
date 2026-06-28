

export const categoryStyles = {
  revision: {
    dot: "bg-amber-500",
    border: "border-amber-500",
  },

  quiz: {
    dot: "bg-violet-500",
    border: "border-violet-500",
  },

  lesson: {
    dot: "bg-blue-500",
    border: "border-blue-500",
  },

  competition: {
    dot: "bg-rose-500",
    border: "border-rose-500",
  },

  project: {
    dot: "bg-emerald-500",
    border: "border-emerald-500",
  },

  other: {
    dot: "bg-zinc-500",
    border: "border-zinc-500",
  },
} as const;


export const moodOptions = [
  {
    value: "ممتاز",
    color: "bg-green-500",
  },
  {
    value: "جيد",
    color: "bg-blue-500",
  },
  {
    value: "متوسط",
    color: "bg-orange-500",
  },
  {
    value: "خامل",
    color: "bg-orange-700",
  },
];

export const API_ROUTES = {
  AUTH: {
    LOGIN: "/Authentication/login",
    REGISTER: "/Authentication/register",
    REFRESH: "/Authentication/refresh-token",
    GOOGLE: "/Authentication/google",
    FACEBOOK: "/Authentication/facebook",
    REGISTER_PHONE: "/Authentication/register-phone",
    VERIFY_PHONE: "/Authentication/verify-phone",
    VERIFY_EMAIL: "/Authentication/verify-email",
  },

  SUBJECTS: {
    GET_ALL: "/Subjects",
  },

  LESSONS: {
    GET_ALL: "/Lessons",
  },
};