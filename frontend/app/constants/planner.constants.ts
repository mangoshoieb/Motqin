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
    LOGOUT: "/auth/logout",
  },

  SUBJECTS: {
    GET_ALL: "/subjects",
  },

  LESSONS: {
    GET_ALL: "/lessons",
  },

  QUESTIONS: {
    BY_LESSON: "/questions/by-lesson",
    BY_CATEGORY_AND_LESSON: "/questions/by-category-and-lesson",
    ADD_MCQ: "/questions/user/mcq",
    ADD_FILL: "/questions/user/fill",
    START: (questionId: string | number) => `/questions/${questionId}/start`,
    END: (questionId: string | number) => `/questions/${questionId}/end`,
  },

  SPACED_REPETITION: {
    START: "/spaced-repetition/start",
    END: "/spaced-repetition/end",
    SET_PLAN: (sessionId: string | number) =>
      `/spaced-repetition/set-plan/${sessionId}`,
  },

  USERS: {
    CURRENT_USER: "/users/me",
    GOALS: "/users/goals",
    UPLOAD_PHOTO: "/users/upload-photo",
    UPDATE: (id: string) => `/users/${id}`,
    GOAL: (id: string | number) => `/users/goals/${id}`,
  },
  // Everything under the UserPreferences controller now lives beneath
  // /user-preferences/planner (see Swagger); the basic sleep/hours/pomodoro
  // preferences are the "basic" resource.
  USER_PREFERENCES: {
    GET: "/user-preferences/planner/basic",
    UPDATE: "/user-preferences/planner/basic",
    DELETE: "/user-preferences/planner/basic",
    POST: "/user-preferences/planner/basic",
  },
  COURSE_SCHEDULES: {
    GET_ALL: "/user-preferences/planner/courses-schedules",
    POST: "/user-preferences/planner/course-schedule",
    UPDATE: (id: string | number) => `/user-preferences/planner/courses-schedule/${id}`,
    DELETE: (id: string | number) => `/user-preferences/planner/courses-schedule/${id}`,
  },
  BUSY_TIMES: {
    GET_REPEATED: "/user-preferences/planner/busytime/repeated",
    POST: "/user-preferences/planner/busytime",
    UPDATE: (id: string | number) => `/user-preferences/planner/busytime/${id}`,
    DELETE: (id: string | number) => `/user-preferences/planner/busytime/${id}`,
  },
  STUDY_PLANS: {
    CREATE: "/study-plan/create",
    FILTER: "/study-plan/filter",
    UPDATE: (id: string | number) => `/study-plan/${id}`,
    DELETE: (id: string | number) => `/study-plan/${id}`,
    TOGGLE_STATUS: (id: string | number) => `/study-plan/${id}/toggle-study-plan-status`,
  },
  AI: {
    PLAN_WITH_AI: "/ai/plan-with-ai",
  },
  STUDY_SESSIONS: {
    CREATE: "/study-session/create",
    UPDATE: (id: string | number) => `/study-session/${id}`,
    DELETE: (id: string | number) => `/study-session/${id}`,
    START: (id: string | number) => `/study-session/${id}/start`,
    END: (id: string | number) => `/study-session/${id}/end`,
    PAUSE: (id: string | number) => `/study-session/${id}/pause`,
    ADD_TIME: (id: string | number) => `/study-session/${id}/add-time`,
  },
};
