export {};
declare global {
  type SessionQuestionType = "MultipleChoiceQuestion" | "FillInTheBlankQuestion";

  // Question fields needed to render a card. Same data as the existing
  // `Question` type (questionID etc.) — see useLessonSession's toSessionItem
  // mapper — just camelCased to its own name since this flow only cares
  // about the fields it actually renders/grades.
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

  interface SessionGroupConfig {
    GROUP_SIZE: number; // questions per group (the last group may be smaller)
    PAIR_SIZE: number; // questions introduced/tested together within a group
  }

  interface ItemProgress {
    attempts: number;
    correct: number;
    wrong: number;
  }

  interface PresentationCard {
    type: "presentation";
    item: SessionItemPayload;
  }

  interface TestCard {
    type: "test";
    item: SessionItemPayload;
  }

  // Shown right after ANSWER, before the flow advances — "inform him" of
  // whether he got it right, and whether it'll come back around.
  interface FeedbackCard {
    type: "feedback";
    item: SessionItemPayload;
    correct: boolean;
  }

  interface GroupStats {
    groupIndex: number; // 0-based
    itemCount: number;
    firstTryCorrectCount: number;
    totalWrongAttempts: number;
    accuracy: number; // firstTryCorrectCount / itemCount
  }

  // The "continue or stop" popup, shown once every item in the group has
  // been answered correctly at least once.
  interface GroupCompleteCard {
    type: "group-complete";
    stats: GroupStats;
    hasMoreGroups: boolean;
  }

  type SessionCard = PresentationCard | TestCard | FeedbackCard | GroupCompleteCard;

  // present/test walk the current pair in order. retry-present/retry-test
  // handle one deferred wrong answer, injected right after the pair
  // boundary that follows it. drain-present/drain-test handle whatever's
  // left in the retry queue once there are no more new pairs to interleave
  // with. complete means every item in the group has been answered
  // correctly.
  type SessionPhase =
    | "present"
    | "test"
    | "retry-present"
    | "retry-test"
    | "drain-present"
    | "drain-test"
    | "complete";

  interface SessionState {
    config: SessionGroupConfig;

    groups: SessionItemPayload[][]; // the whole lesson, chunked by GROUP_SIZE
    groupIndex: number;

    pairs: SessionItemPayload[][]; // current group's items, chunked by PAIR_SIZE
    pairIndex: number;
    withinPairIndex: number;
    phase: SessionPhase;

    retryQueue: SessionItemPayload[]; // items answered wrong, awaiting a deferred retry
    activeRetryItem: SessionItemPayload | null; // set while phase is retry-*/drain-*

    progress: Record<number, ItemProgress>; // keyed by questionId, current group only

    currentCard: SessionCard;
  }

  type SessionEvent =
    | { type: "CONTINUE" } // advance past a PresentationCard, or past a FeedbackCard
    | { type: "ANSWER"; correct: boolean; userAnswer: string } // submit on a TestCard
    | { type: "CONTINUE_TO_NEXT_GROUP" }; // advance past a GroupCompleteCard

  // For the sidebar: where the student is within the current group, and a
  // small window of neighboring questions (not the whole group).
  interface GroupProgressItem {
    index: number; // 1-based position within the current group
    item: SessionItemPayload;
    status: "done" | "current" | "retry-pending" | "pending";
  }

  interface GroupProgress {
    current: number; // 1-based index of the active item (= total once the group is complete)
    total: number; // items in the current group
    window: GroupProgressItem[]; // previous (if any) + current + next (if any) — 1 to 3 entries
  }
}
