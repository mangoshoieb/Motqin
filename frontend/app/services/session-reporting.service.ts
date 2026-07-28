// §7 — reporting is explicitly deferred by the spec ("we will discuss it
// later"). This stub is the single seam useLessonSession calls once the
// whole lesson's Summary is reached, so wiring the real request later is a
// one-function change.
export const sessionReportingService = {
  reportSessionCompletion(lessonId: string, stats: SessionStats) {
    console.log("[session-reporting] lesson completed (not yet sent to backend):", lessonId, stats);
  },
};
