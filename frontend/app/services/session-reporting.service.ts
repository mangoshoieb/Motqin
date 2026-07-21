// Reporting a finished group to the backend is deferred — there's no
// endpoint for it yet, and the real contract (what identifies the lesson
// attempt, whether it's per-question or per-group, etc.) hasn't been
// decided. This stub is the single seam useLessonSession calls once a
// group actually completes (never for an abandoned group — see its
// call site), so wiring the real request later is a one-function change.
export const sessionReportingService = {
  reportGroupCompletion(lessonId: string, stats: GroupStats) {
    console.log("[session-reporting] group completed (not yet sent to backend):", lessonId, stats);
  },
};
