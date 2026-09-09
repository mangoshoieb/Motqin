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

export interface CreateStudyPlanPayload {
  subjectId?: number;
  lessonId?: number;
  date: string;
  title: string;
  durationInMinutes: number;
  goalCategoryId: number;
  priority?: number;
  status?: number;
  userNotes?: string[];
}

export interface CreatedStudyPlan extends CreateStudyPlanPayload {
  id?: number;
}

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
  async filter(params: {
    duration?: number;
    status?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<StudyPlanFilterResponse> {
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
};