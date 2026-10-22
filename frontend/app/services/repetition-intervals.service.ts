import axiosInstance from "@/app/lib/axios";
import { API_ROUTES } from "@/app/constants/planner.constants";
import { RepetitionIntervals } from "@/app/types/repetition-intervals.types";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

const unwrap = <T>(body: ApiEnvelope<T> | T): T =>
  body && typeof body === "object" && "data" in body && "success" in body
    ? (body as ApiEnvelope<T>).data
    : (body as T);

const ROUTES = API_ROUTES.SPACED_REPETITION_INTERVALS;

export const repetitionIntervalsService = {
  async get(): Promise<RepetitionIntervals> {
    const { data } = await axiosInstance.get<
      ApiEnvelope<RepetitionIntervals> | RepetitionIntervals
    >(ROUTES.ALL);
    const body = unwrap<RepetitionIntervals>(data);
    return {
      defaultIntervals: body?.defaultIntervals?.length ? body.defaultIntervals : null,
      systemIntervals: body?.systemIntervals ?? [],
      maxRepetitions: body?.maxRepetitions ?? body?.systemIntervals?.length ?? 4,
      subjects: body?.subjects ?? [],
    };
  },

  // The student's default, for every subject without an override.
  async setDefault(intervals: number[]): Promise<void> {
    await axiosInstance.put(ROUTES.ALL, { intervals });
  },

  // Back to the system's intervals.
  async clearDefault(): Promise<void> {
    await axiosInstance.delete(ROUTES.ALL);
  },

  async setForSubject(subjectId: number, intervals: number[]): Promise<void> {
    await axiosInstance.put(ROUTES.SUBJECT(subjectId), { intervals });
  },

  // The subject follows the default again.
  async clearForSubject(subjectId: number): Promise<void> {
    await axiosInstance.delete(ROUTES.SUBJECT(subjectId));
  },
};
