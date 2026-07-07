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
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    REFRESH: "/auth/refresh-token",
    GOOGLE: "/auth/google",
    FACEBOOK: "/auth/facebook",
    REGISTER_PHONE: "/auth/register-phone",
    LOGIN_PHONE: "/auth/phone-logIn-request",
    VERIFY_PHONE: "/auth/phone-verify",
    VERIFY_EMAIL: "/auth/verify-email",
    COMPLETE_PROFILE: "/auth/phone-complete-signup",
    LOGOUT:"/auth/logout"
  },
  
  SUBJECTS: {
    GET_ALL: "/subjects",
  },
  
  LESSONS: {
    GET_ALL: "/Lessons",
  },
  USERS:{
    CURRENT_USER: "/users/me",

  }
};
