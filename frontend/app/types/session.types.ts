export {};
declare global {
  type SessionQuestionType = "MultipleChoiceQuestion" | "FillInTheBlankQuestion";

  // One *renderable form* of a question. A backend Information row carries an
  // MCQ card and a fill-in-the-blank card about the same fact, so a payload
  // item holds up to two of these. Which one a test card shows is decided from
  // the question's live score when the card is built — see formFor() in
  // session-algorithm.ts — never fixed at fetch time.
  interface SessionItemForm {
    questionType: SessionQuestionType;
    questionText: string;
    answerOptions: string[] | null; // MCQ only
    correctAnswer: string | null; // MCQ only
    // FIB only — every accepted wording of the blank; matching any one of
    // them is correct (§6.2).
    correctText: string[] | null;
  }

  // The shared, form-independent part of a question: what identifies it and
  // what its info card teaches. Mapped from LessonInformation — see
  // useLessonSession's toSessionItem.
  interface SessionItemPayload {
    questionId: number;
    // The backend's displayOrder (1-based). It fixes the question's block
    // and its pair within the block (§3), so it is kept as-is rather than
    // replaced by the question's position in the payload.
    displayOrder: number;

    title: string | null;
    description: string;
    imageUrl: string | null;
    audioUrl: string | null;

    // At least one of these is always non-null; init() rejects an item with
    // neither, since such a question could never be tested.
    mcq: SessionItemForm | null;
    fib: SessionItemForm | null;
  }

  // §2 — supplied as config, never hard-coded into the algorithm.
  interface SessionConfig {
    BATCH_SIZE: number; // block size
    GRADUATE: number; // correct answers (net score) to finish a question
    GAP: number; // other cards required before the same question can be tested again
  }

  // §5 per-question state.
  interface QuestionState {
    // Position in the payload array (which is sorted by displayOrder). Only
    // an index into payload/questions — blocks and pairs come from the
    // item's displayOrder.
    order: number;
    seen: boolean; // has its info card been shown yet
    done: boolean; // finished/graduated — once true, stays true (§6.3)
    score: number; // 0..GRADUATE, correct +1 / wrong -1 (floor 0)
    // Turn ANY of its cards last appeared — info, re-teach, test or filler;
    // -1 = never shown. Because info cards count, a freshly introduced
    // question has to wait out GAP before its first test.
    lastShown: number;
  }

  interface InfoCard {
    type: "info";
    item: SessionItemPayload;
  }

  interface TestCard {
    type: "test";
    item: SessionItemPayload;
    // Which form this particular showing uses. Resolved from the question's
    // score at build time, so the same item can be an MCQ now and a
    // fill-in-the-blank two turns later.
    form: SessionItemForm;
  }

  // §1/§6.3 — reviews an already-finished question, always as an MCQ.
  // Answering it never changes score or un-finishes the question, but a
  // wrong answer still re-teaches it.
  interface FillerCard {
    type: "filler";
    item: SessionItemPayload;
    form: SessionItemForm;
  }

  interface SessionStats {
    testCards: number;
    fillerCards: number;
    correct: number; // across both test and filler answers
    wrong: number;
    // Correct answers on TEST cards only — filler/review answers excluded.
    // This is the numerator of the "right|appeared" score sent to
    // POST /spaced-repetition/end; testCards is its denominator. Kept
    // separate from `correct` (which the summary screen uses for accuracy)
    // because the backend score deliberately ignores review cards.
    testCorrect: number;
  }

  // Shown whenever a block is finished (flowchart v2). Unless it is the last
  // block, CONTINUE moves on to the next block. The last block's summary —
  // or an early endSession() (§8's "End session" escape hatch) — ends the
  // session.
  interface SummaryCard {
    type: "summary";
    isLastBlock: boolean;
    blockNumber: number; // 1-based; 0 for an empty lesson
    totalBlocks: number;
    blockQuestionCount: number;
    blockDoneCount: number;
    blockStats: SessionStats; // this block only
    stats: SessionStats; // the whole session
  }

  type SessionCard = InfoCard | TestCard | FillerCard | SummaryCard;

  interface SessionState {
    config: SessionConfig;
    payload: SessionItemPayload[]; // the whole lesson, sorted by displayOrder (order = index)
    questions: QuestionState[]; // parallel to payload

    turn: number; // cards shown so far; first card is turn 1; summaries don't count
    currentBlock: number;
    reteach: number | null; // order of the question flagged after a wrong answer

    currentCard: SessionCard;
    stats: SessionStats;
    blockStats: SessionStats; // reset every time the next block starts
  }

  // §8 — plain-data copy of a running session, for pause/resume on the same
  // browser. Only per-question progress is stored, never question content:
  // it is re-applied to a freshly fetched payload, and `questionIds` is how
  // restore() tells whether that payload is still the same lesson in the
  // same order.
  interface SessionSnapshot {
    // Bumped whenever the algorithm changes shape, so a session saved by an
    // older version starts fresh instead of resuming into the wrong state.
    version: number;
    questionIds: number[]; // payload order at the time of saving
    turn: number;
    currentBlock: number;
    reteach: number | null;
    questions: Omit<QuestionState, "order">[]; // parallel to questionIds
    stats: SessionStats;
    blockStats: SessionStats;
    // The card on screen when it was saved, so resuming lands on that exact
    // card instead of skipping past it. A block summary is saved too (the
    // student may leave before continuing); the last one never is —
    // reaching it clears the saved session.
    current: { type: "info" | "test" | "filler"; order: number } | { type: "summary" };
  }

  // Whole-lesson progress for the bar above the card: finished questions
  // out of every question in the lesson.
  interface LessonProgress {
    done: number;
    total: number;
  }

  type SessionEvent =
    | { type: "CONTINUE" } // advance past an InfoCard, or a block's SummaryCard
    | { type: "ANSWER"; correct: boolean; userAnswer: string }; // submit on a Test or Filler card

  // For the sidebar: every question in the current block (§5's
  // waiting/studying/finished states), plus which one (if any) is on
  // screen right now.
  interface BlockProgressItem {
    index: number; // 1-based position within the current block
    item: SessionItemPayload;
    status: "waiting" | "studying" | "done"; // !seen / seen && !done / done
    isCurrent: boolean;
  }

  interface BlockProgress {
    blockNumber: number; // 1-based
    totalBlocks: number;
    items: BlockProgressItem[]; // every question in the current block
  }

  // ── Spaced-repetition session tracking ────────────────────────────────
  // POST /api/spaced-repetition/start  ->  StartSessionDto / SessionResponseDto
  // POST /api/spaced-repetition/end    ->  EndSessionDto

  interface StartSessionDto {
    subjectId: number;
    lessonId: number;
    category: string | null;
  }

  // What /start actually returns. The live endpoint names the field `id`,
  // not `sessionId` as the DTO name suggests — both are declared optional
  // here so the service can resolve whichever is present rather than
  // betting on one and silently losing the handle.
  interface SessionResponseDto {
    id?: number;
    sessionId?: number;
    // The endpoint may carry more fields we don't consume.
    [key: string]: unknown;
  }

  interface EndSessionDto {
    sessionId: number;
    // The score, split across two integers (it was a single "4|9" string
    // before the backend was updated). Both count TEST cards only —
    // filler/review cards re-test questions that already graduated and
    // would inflate the total. The same question re-tested counts once per
    // showing, which is what stats.testCards already tracks.
    correctAnswersCount: number;
    totalQuestionsCount: number;
    endTime: string; // ISO 8601
    finishedQuestionIds: number[]; // graduated questions only
    lessonCompleted: boolean; // false when the user ended the session early
  }
}
