import { API_ROUTES } from "../constants/planner.constants";
import axiosInstance from "../lib/axios";



interface CourseSchedulePayload {
  subjectId: number;
  startTime: string;
  endTime: string;
}

export interface CourseSchedule extends CourseSchedulePayload {
  id: number;
}

export type BusyTimeMode = "range" | "duration";

export interface BusyTimePayload {
  startTime?: string;
  endTime?: string;
  durationInMinutes?: number;
  isRepeated: boolean;
  startDate?: string;
  endDate?: string;
  title: string;
}

export interface BusyTime extends BusyTimePayload {
  id: number;
}

// A user-defined goal (e.g. "الحصول على درجة كاملة في الرياضيات"). Its id is
// what study plans / sessions carry as `goalCategoryId`.
export interface UserGoalPayload {
  title: string;
  startDate?: string | null;
  endDate?: string | null;
}

export interface UserGoal extends UserGoalPayload {
  id: number;
  isIgnored?: boolean;
}

export interface CreateStudyPlanPayload {
  subjectId?: number;
  lessonId?: number;
  date: string;
  title: string;
  durationInMinutes: number;
  goalCategoryId?: number | null;
  priority?: number;
  status?: number;
  userNotes?: string[];
}

export interface CreatedStudyPlan extends CreateStudyPlanPayload {
  id?: number;
  // The backend auto-generates sessions for a new plan and returns them.
  studySessions?: StudySessionDto[];
}

// The `status` carried by a study session. Completed is 2 (confirmed by the
// backend); the rest mirror the study-plan numbering, with 3 = paused as
// observed from /pause responses.
export const StudySessionStatus = {
  Upcoming: 0,
  InProgress: 1,
  Completed: 2,
  Paused: 3,
  Missed: 4,
} as const;
export type StudySessionStatus = (typeof StudySessionStatus)[keyof typeof StudySessionStatus];

export interface StudySessionDto {
  id: number;
  userID: string;
  studyPlanId: number;
  lessonID: number;
  description: string;
  goalCategoryId: number;
  durationInMinutes: number;
  startTime: string;
  endTime: string;
  status: number;
  notes: string[];
}

export interface CreateStudySessionPayload {
  studyPlanId?: number;
  date: string;
  description?: string;
  durationInMinutes?: number;
  goalCategoryId?: number;
}

export interface UpdateStudySessionPayload {
  studyPlanId?: number;
  description?: string;
  goalCategoryId?: number;
  durationInMinutes?: number;
  // The backend types this as a free-form string rather than the numeric
  // Statuses enum it returns — we leave it unset until we know the accepted
  // values, and let /start, /end and /pause own the status transitions.
  status?: string;
  notes?: string[];
}

// One item the AI planner should place somewhere in next week. Mirrors the
// backend's ToBePlannedPlanDto — no date: the AI picks it.
export interface ToBePlannedPlanPayload {
  subjectId?: number;
  lessonId?: number;
  userNotes?: string[];
  title: string;
  durationInMinutes: number;
  goalCategoryId: number | null;
  importance?: string;
}

export interface StudyPlanItem extends CreateStudyPlanPayload {
  id: number;
  userId: string;
  toBePlanned: number;
  priority: number;
  status: number;
  systemNotes: string[];
  userNotes: string[];
  studySessions: StudySessionDto[];
}

// Query enums for GET /study-plan/filter (see Swagger).
export const StudyPlanDuration = {
  All: 0,
  Day: 1,
  Week: 2,
  NextWeek: 3,
  Month: 4,
  CustomRange: 5,
} as const;
export type StudyPlanDuration = (typeof StudyPlanDuration)[keyof typeof StudyPlanDuration];

// NOTE: this is the *filter* enum and is NOT the same numbering as the
// `status` field on a returned study plan — see StudyPlanItemStatus.
export const StudyPlanStatus = {
  All: 0,
  Completed: 1,
  Missed: 2,
  Upcoming: 3,
  InProgress: 4,
} as const;
export type StudyPlanStatus = (typeof StudyPlanStatus)[keyof typeof StudyPlanStatus];

// The `status` carried by a StudyPlanItem, and what PUT /study-plan/{id}
// expects when the user toggles a task done/undone.
export const StudyPlanItemStatus = {
  Upcoming: 0,
  InProgress: 1,
  Completed: 2,
  Missed: 4,
} as const;
export type StudyPlanItemStatus = (typeof StudyPlanItemStatus)[keyof typeof StudyPlanItemStatus];

export interface StudyPlanFilterParams {
  duration?: StudyPlanDuration;
  status?: StudyPlanStatus;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
}

export interface StudyPlanFilterResponse {
  items: StudyPlanItem[];
  total: number;
}

interface ApiEnvelope<T> {
  data: T;
}

const unwrap = <T>(response: T | ApiEnvelope<T>): T =>
  response && typeof response === "object" && "data" in response
    ? (response as ApiEnvelope<T>).data
    : response;

export const subjectsService = {
async getAllSubjects(): Promise<getSubjectsResponse> {
    const { data } = await axiosInstance.get(API_ROUTES.SUBJECTS.GET_ALL);

    return data;
  },
}

export const userGoalsService = {
  async getAll(): Promise<UserGoal[]> {
    const { data } = await axiosInstance.get<
      UserGoal[] | ApiEnvelope<UserGoal[]> | { items: UserGoal[] }
    >(API_ROUTES.USERS.GOALS);

    // Swagger documents no response schema for this endpoint, so accept a
    // bare array, a `data` envelope, or an `items` list.
    const unwrapped = unwrap(data as UserGoal[] | ApiEnvelope<UserGoal[]>);
    if (Array.isArray(unwrapped)) return unwrapped;
    const items = (unwrapped as unknown as { items?: UserGoal[] })?.items;
    return Array.isArray(items) ? items : [];
  },

  async create(payload: UserGoalPayload): Promise<UserGoal> {
    const { data } = await axiosInstance.post<UserGoal | ApiEnvelope<UserGoal>>(
      API_ROUTES.USERS.GOALS,
      payload,
    );

    return unwrap(data);
  },

  async update(id: number, payload: Partial<UserGoalPayload>): Promise<UserGoal> {
    const { data } = await axiosInstance.put<UserGoal | ApiEnvelope<UserGoal>>(
      API_ROUTES.USERS.GOAL(id),
      payload,
    );

    return unwrap(data);
  },

  async remove(id: number): Promise<void> {
    await axiosInstance.delete(API_ROUTES.USERS.GOAL(id));
  },
};

export const courseSchedulesService = {
  async getAll(): Promise<CourseSchedule[]> {
    const { data } = await axiosInstance.get<
      CourseSchedule[] | ApiEnvelope<CourseSchedule[]>
    >(API_ROUTES.COURSE_SCHEDULES.GET_ALL);

    return unwrap(data) ?? [];
  },

  async create(payload: CourseSchedulePayload): Promise<CourseSchedule> {
    const { data } = await axiosInstance.post<
      CourseSchedule | ApiEnvelope<CourseSchedule>
    >(API_ROUTES.COURSE_SCHEDULES.POST, payload);

    return unwrap(data);
  },

  async update(
    id: number,
    payload: CourseSchedulePayload,
  ): Promise<CourseSchedule> {
    const { data } = await axiosInstance.put<
      CourseSchedule | ApiEnvelope<CourseSchedule>
    >(API_ROUTES.COURSE_SCHEDULES.UPDATE(id), payload);

    return unwrap(data);
  },

  async remove(id: number): Promise<void> {
    await axiosInstance.delete(API_ROUTES.COURSE_SCHEDULES.DELETE(id));
  },
};

export const busyTimesService = {
  async getRepeated(): Promise<{ courses: BusyTime[]; tasks: BusyTime[] }> {
    const { data } = await axiosInstance.get<
      { courses: BusyTime[]; tasks: BusyTime[] } | ApiEnvelope<{ courses: BusyTime[]; tasks: BusyTime[] }>
    >(API_ROUTES.BUSY_TIMES.GET_REPEATED);

    return unwrap(data) ?? { courses: [], tasks: [] };
  },

  async create(payload: BusyTimePayload): Promise<BusyTime> {
    const { data } = await axiosInstance.post<BusyTime | ApiEnvelope<BusyTime>>(
      API_ROUTES.BUSY_TIMES.POST,
      payload,
    );

    return unwrap(data);
  },

  async update(id: number, payload: BusyTimePayload): Promise<BusyTime> {
    const { data } = await axiosInstance.put<BusyTime | ApiEnvelope<BusyTime>>(
      API_ROUTES.BUSY_TIMES.UPDATE(id),
      payload,
    );

    return unwrap(data);
  },

  async remove(id: number): Promise<void> {
    await axiosInstance.delete(API_ROUTES.BUSY_TIMES.DELETE(id));
  },
};

export const studyPlansService = {
  async filter(params: StudyPlanFilterParams): Promise<StudyPlanFilterResponse> {
    const { data } = await axiosInstance.get<StudyPlanFilterResponse | ApiEnvelope<StudyPlanFilterResponse>>(
      API_ROUTES.STUDY_PLANS.FILTER,
      { params },
    );

    return unwrap(data) ?? { items: [], total: 0 };
  },

  async create(payload: CreateStudyPlanPayload): Promise<CreatedStudyPlan> {
    const { data } = await axiosInstance.post<
      CreatedStudyPlan | ApiEnvelope<CreatedStudyPlan>
    >(API_ROUTES.STUDY_PLANS.CREATE, payload);

    return unwrap(data);
  },

  async update(
    id: number,
    payload: Partial<CreateStudyPlanPayload>,
  ): Promise<StudyPlanItem> {
    const { data } = await axiosInstance.put<
      StudyPlanItem | ApiEnvelope<StudyPlanItem>
    >(API_ROUTES.STUDY_PLANS.UPDATE(id), payload);

    return unwrap(data);
  },

  async remove(id: number): Promise<void> {
    await axiosInstance.delete(API_ROUTES.STUDY_PLANS.DELETE(id));
  },

  // Flips the plan between completed and not — no body, the backend decides
  // the new status (and may later trim unfinished sessions on completion).
  async toggleStatus(id: number): Promise<void> {
    await axiosInstance.put(API_ROUTES.STUDY_PLANS.TOGGLE_STATUS(id));
  },
};

export const aiService = {
  // Swagger documents no response body; callers refetch the study plans
  // instead of relying on what comes back.
  async planWithAi(items: ToBePlannedPlanPayload[]): Promise<unknown> {
    const { data } = await axiosInstance.post(API_ROUTES.AI.PLAN_WITH_AI, items);
    return unwrap(data);
  },
};

export const studySessionsService = {
  async create(payload: CreateStudySessionPayload): Promise<StudySessionDto> {
    const { data } = await axiosInstance.post<
      StudySessionDto | ApiEnvelope<StudySessionDto>
    >(API_ROUTES.STUDY_SESSIONS.CREATE, payload);

    return unwrap(data);
  },

  async update(
    id: number,
    payload: UpdateStudySessionPayload,
  ): Promise<StudySessionDto> {
    const { data } = await axiosInstance.put<
      StudySessionDto | ApiEnvelope<StudySessionDto>
    >(API_ROUTES.STUDY_SESSIONS.UPDATE(id), payload);

    return unwrap(data);
  },

  async remove(id: number): Promise<void> {
    await axiosInstance.delete(API_ROUTES.STUDY_SESSIONS.DELETE(id));
  },

  // /start, /end and /pause take no body — the id in the path is the whole
  // request, and each one answers with the session in its new state.
  async start(id: number): Promise<StudySessionDto> {
    const { data } = await axiosInstance.put<
      StudySessionDto | ApiEnvelope<StudySessionDto>
    >(API_ROUTES.STUDY_SESSIONS.START(id));

    return unwrap(data);
  },

  async end(id: number): Promise<StudySessionDto> {
    const { data } = await axiosInstance.put<
      StudySessionDto | ApiEnvelope<StudySessionDto>
    >(API_ROUTES.STUDY_SESSIONS.END(id));

    return unwrap(data);
  },

  async pause(id: number): Promise<StudySessionDto> {
    const { data } = await axiosInstance.put<
      StudySessionDto | ApiEnvelope<StudySessionDto>
    >(API_ROUTES.STUDY_SESSIONS.PAUSE(id));

    return unwrap(data);
  },

  // Credits extra minutes the user kept working after the session's timer
  // ran out; the backend adds them to the session's finished time.
  async addTime(id: number, minutesToAdd: number): Promise<StudySessionDto> {
    const { data } = await axiosInstance.put<
      StudySessionDto | ApiEnvelope<StudySessionDto>
    >(API_ROUTES.STUDY_SESSIONS.ADD_TIME(id), { minutesToAdd });

    return unwrap(data);
  },
};