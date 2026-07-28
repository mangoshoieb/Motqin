export {};
declare global {
  type SessionQuestionType = "MultipleChoiceQuestion" | "FillInTheBlankQuestion";

  // Question fields needed to render a card. Same data as the existing
  // `Question` type (questionID etc.) — see useLessonSession's toSessionItem
  // mapper — just camelCased to its own name since this flow only cares
  // about the fields it actually renders/grades. Kept in the backend's real
  // casing/values (questionId/questionType: "MultipleChoiceQuestion"...)
  // rather than the spec doc's shorthand (id/type: "MCQ"|"FIB") since this
  // is what the API actually returns (confirmed via swagger).
  interface SessionItemPayload {
    questionId: number;
    questionType: SessionQuestionType;

    title: string | null;
    description: string;
    imageUrl: string | null;
    audioUrl: string | null;

    questionText: string;
    answerOptions: string | null; // MCQ only, comma-joined
    correctAnswer: string | null; // MCQ only
    correctText: string | null; // FIB only
    caseSensitive: boolean | null; // FIB only
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
  }

  // §1/§6.2 — reviews an already-finished question. Answering it is recorded
  // for stats but never changes score or un-finishes the question.
  interface FillerCard {
    type: "filler";
    item: SessionItemPayload;
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

  // For the sidebar: where the student is within the current block, and a
  // small window of neighboring questions (not the whole block).
  interface BlockProgressItem {
    index: number; // 1-based position within the current block
    item: SessionItemPayload;
    status: "done" | "current" | "pending";
  }

  interface BlockProgress {
    current: number; // 1-based index of the active item (= total once the block/lesson is complete)
    total: number; // items in the current block
    window: BlockProgressItem[]; // previous (if any) + current + next (if any) — 1 to 3 entries
  }
}
