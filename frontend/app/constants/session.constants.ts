// §2 Settings — supplied as config, never hard-coded into the algorithm
// body. Same values as the Android app's QuizConfig (batchSize 6,
// graduate 3, gap 2) so both clients pick identical card sequences.
export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  BATCH_SIZE: 6,
  GRADUATE: 3,
  GAP: 2,
};

// Same-device pause/resume — one global "current session" slot in
// localStorage, not per lesson: resuming a different lesson or category
// starts fresh, exactly like the Android app's QuizSessionLocalDataSource.
export const QUIZ_SESSION_STORAGE_KEY = "quiz-session";
