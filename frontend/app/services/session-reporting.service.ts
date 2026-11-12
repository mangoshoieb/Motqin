import { spacedRepetitionService } from "./spaced-repetition.service";

// §7 — the reporting seam useLessonSession calls at the two ends of a
// session. It owns the mapping from algorithm state to the backend's
// SpacedRepetition DTOs; the HTTP calls themselves live in
// spaced-repetition.service.ts.

// The score, as two integers (it was a single "4|9" string before the
// backend was updated):
//   correctAnswersCount = correct answers on TEST cards
//   totalQuestionsCount = number of test cards shown
// Filler (review) cards are excluded from both — they re-test questions
// that already graduated and would otherwise inflate the total. The same
// question re-tested counts once per showing, which is exactly what
// stats.testCards already counts.
export const toSessionScore = (
  stats: SessionStats
): Pick<EndSessionDto, "correctAnswersCount" | "totalQuestionsCount"> => ({
  correctAnswersCount: stats.testCorrect,
  totalQuestionsCount: stats.testCards,
});

// Graduated questions only (§6 — score reached GRADUATE and `done` latched
// true). A question the student saw but never finished is not reported.
export const collectFinishedQuestionIds = (state: SessionState): number[] =>
  state.questions
    .filter((q) => q.done)
    .map((q) => state.payload[q.order].questionId);

export const sessionReportingService = {
  // Called once, before the first card is shown. Hands back the session
  // id /end needs, and whether this review is being taken before its day.
  async startSession(input: {
    subjectId: number;
    lessonId: number;
    category?: string | null;
  }): Promise<{ sessionId: number; dueDate: string | null; isEarly: boolean }> {
    const payload: StartSessionDto = {
      subjectId: input.subjectId,
      lessonId: input.lessonId,
      category: input.category ?? null,
    };
    console.log("[START] request →", payload);

    const response = await spacedRepetitionService.startSession(payload);
    console.log("[START] response ←", response);

    return {
      sessionId: response.sessionId,
      dueDate: response.dueDate ?? null,
      isEarly: !!response.isEarly,
    };
  },

  // Called once, when the Summary card is reached — whether the lesson
  // finished naturally or the student ended the session early. Whether the
  // lesson (and the review) is complete is the server's call: it answers
  // with it, so nothing about that is sent.
  async endSession(sessionId: number, state: SessionState): Promise<EndSessionResult> {
    const payload: EndSessionDto = {
      sessionId,
      ...toSessionScore(state.stats),
      endTime: new Date().toISOString(),
      finishedQuestionIds: collectFinishedQuestionIds(state),
    };
    console.log("[END] request →", payload);
    console.log("[END] stats →", state.stats);

    const result = await spacedRepetitionService.endSession(payload);
    console.log("[END] response ←", result);
    return result;
  },
};
