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
    answerOptions: string | null; // MCQ only, comma-joined
    correctAnswer: string | null; // MCQ only
    correctText: string | null; // FIB only
    caseSensitive: boolean | null; // FIB only
  }

  // The shared, form-independent part of a question: what identifies it and
  // what its info card teaches. Mapped from LessonInformation — see
  // useLessonSession's toSessionItem.
  interface SessionItemPayload {
    questionId: number;

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
    INTRO_CHUNK: number; // how many new questions are introduced at a time
  }

  // §5 per-question state.
  interface QuestionState {
    order: number; // fixed position in the payload array; also fixes its block
    seen: boolean; // has its info card been shown yet
    done: boolean; // finished/graduated — once true, stays true (§6.2)
    score: number; // 0..GRADUATE, correct +1 / wrong -1 (floor 0)
    // Turn its test or filler card last appeared; -1 = never tested. Info
    // cards do NOT update this (v3.0 change) — only test/filler do.
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

  // §1/§6.2 — reviews an already-finished question. Answering it is recorded
  // for stats but never changes score or un-finishes the question.
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
  }

  // The end screen — shown once every question in the lesson is finished,
  // or early via endSession() (§8's "End session" escape hatch).
  interface SummaryCard {
    type: "summary";
    stats: SessionStats;
  }

  type SessionCard = InfoCard | TestCard | FillerCard | SummaryCard;

  interface SessionState {
    config: SessionConfig;
    payload: SessionItemPayload[]; // the whole lesson, fixed order (order = index)
    questions: QuestionState[]; // parallel to payload

    turn: number; // cards shown so far; first card is turn 1; summary doesn't count
    currentBlock: number;
    reteach: number | null; // order of the question flagged after a wrong answer
    // How many info cards of the current introduction chunk are still owed.
    // Set to INTRO_CHUNK when a chunk opens, decremented per info card
    // shown, forced back to 0 when the block advances or runs out of
    // waiting questions early.
    pendingIntro: number;

    currentCard: SessionCard;
    stats: SessionStats;
  }

  type SessionEvent =
    | { type: "CONTINUE" } // advance past an InfoCard
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
}
