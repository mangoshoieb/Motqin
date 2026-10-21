import { API_ROUTES } from "../constants/planner.constants";
import axiosInstance from "../lib/axios";

// Thin transport layer for the two SpacedRepetition endpoints. Domain
// mapping (stats -> score string, which ids count as "finished") lives in
// session-reporting.service.ts, so this file stays a straight
// request/response wrapper.

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error: string | null;
}

// The rest of the API wraps payloads in { success, data, error }, but the
// SpacedRepetition controller is newer and its swagger entry declares the
// bare SessionResponseDto. Accept either rather than betting on one — a
// wrong guess here silently loses the sessionId and breaks /end.
const unwrap = <T>(body: ApiEnvelope<T> | T): T => {
  if (body && typeof body === "object" && "data" in body && "success" in body) {
    return (body as ApiEnvelope<T>).data;
  }
  return body as T;
};

// The `status` query of GET /spaced-repetition/plans/filter. The backend
// stores nine StudyPlanStatus values (First/Second/Third/Fourth...); the
// filter groups them into these four so the client never has to.
export const SpacedRepetitionPlanStatus = {
  All: 0,
  Coming: 1,
  Missed: 2,
  Completed: 3,
} as const;
export type SpacedRepetitionPlanStatus =
  (typeof SpacedRepetitionPlanStatus)[keyof typeof SpacedRepetitionPlanStatus];

// One past review session a plan was built from (oldest first).
export interface SpacedRepetitionPreviousSession {
  id: number;
  userId: string;
  subjectId: number;
  lessonId: number;
  category: string;
  repetitionNumber: number;
  status: number;
  startTime: string;
  endTime: string | null;
  correctAnswersCount: number;
  totalQuestionsCount: number;
  finishedQuestionIds: number[];
}

export interface SpacedRepetitionPlan {
  id: number;
  userId: string;
  subjectId: number;
  lessonId: number;
  category: string;
  repetitionNumber: number;
  reviewInterval: number;
  nextReviewDate: string;
  // One of the nine stored values — group with the filter's `status` instead.
  status: number;
  previousSessionsIDs: number[];
  previousSessions: SpacedRepetitionPreviousSession[];
}

// `date` alone, or a startDate/endDate range (a range wins over date).
// All dates are YYYY-MM-DD.
export interface SpacedRepetitionPlanFilter {
  date?: string;
  startDate?: string;
  endDate?: string;
  status?: SpacedRepetitionPlanStatus;
}

export interface SpacedRepetitionPlanFilterResponse {
  items: SpacedRepetitionPlan[];
  total: number;
}

export const spacedRepetitionService = {
  async filterPlans(
    params: SpacedRepetitionPlanFilter
  ): Promise<SpacedRepetitionPlanFilterResponse> {
    const response = await axiosInstance.get<
      ApiEnvelope<SpacedRepetitionPlanFilterResponse> | SpacedRepetitionPlanFilterResponse
    >(API_ROUTES.SPACED_REPETITION.PLANS_FILTER, { params });

    const body = unwrap<SpacedRepetitionPlanFilterResponse>(response.data);
    const items = Array.isArray(body?.items) ? body.items : [];
    return { items, total: body?.total ?? items.length };
  },

  // Opens a session. The returned id is the handle every later call (end,
  // set-plan) needs, so callers must hold on to it.
  //
  // Returns the raw body plus a guaranteed numeric `sessionId`. The live
  // endpoint names that field `id` — despite the DTO being called
  // SessionResponseDto — so the two spellings are normalized here, once,
  // rather than every caller having to know which one landed.
  async startSession(
    input: StartSessionDto
  ): Promise<SessionResponseDto & { sessionId: number }> {
    const response = await axiosInstance.post<ApiEnvelope<SessionResponseDto> | SessionResponseDto>(
      API_ROUTES.SPACED_REPETITION.START,
      input
    );

    // Explicit type argument: inference would otherwise widen T to the whole
    // union and hand back something that still might be the envelope.
    const session = unwrap<SessionResponseDto>(response.data);
    const sessionId = session?.sessionId ?? session?.id;

    if (typeof sessionId !== "number") {
      // Include the body — the failure mode this replaces was a bare
      // "no sessionId" with no way to see what actually came back.
      throw new Error(
        `spaced-repetition/start returned no session id: ${JSON.stringify(session)}`
      );
    }

    return { ...session, sessionId };
  },

  // Closes the session opened by startSession. Returns 200 with no body.
  async endSession(input: EndSessionDto): Promise<void> {
    await axiosInstance.post(API_ROUTES.SPACED_REPETITION.END, input);
  },
};
