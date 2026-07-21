// Pure module driving the quiz session flow. Zero imports from UI,
// networking, or platform APIs — networking (group-completion reporting)
// subscribes to this module's outputs from the caller (useLessonSession),
// it is never invoked from in here.
//
// Flow: the lesson's questions are chunked into groups (GROUP_SIZE, last
// group may be smaller). Within a group, items are chunked into pairs
// (PAIR_SIZE): present both, then test both, in order. A wrong answer is
// never retried immediately — it's deferred into a retry queue and
// resurfaces once, right after the *next* pair boundary, mixed in among the
// upcoming pairs rather than jumping the line. Once every new pair has been
// processed, any remaining retries are drained one at a time (looping again
// on repeat wrong answers) until every item in the group has been answered
// correctly at least once. Every ANSWER shows a FeedbackCard first — the
// flow only advances once that's dismissed with CONTINUE. The group then
// ends on a GroupCompleteCard with stats; CONTINUE_TO_NEXT_GROUP moves on
// if another group remains.

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function emptyProgress(): ItemProgress {
  return { attempts: 0, correct: 0, wrong: 0 };
}

function buildGroupFields(
  group: SessionItemPayload[],
  config: SessionGroupConfig
): Pick<
  SessionState,
  "pairs" | "pairIndex" | "withinPairIndex" | "phase" | "retryQueue" | "activeRetryItem" | "progress"
> {
  return {
    pairs: chunk(group, config.PAIR_SIZE),
    pairIndex: 0,
    withinPairIndex: 0,
    phase: group.length > 0 ? "present" : "complete",
    retryQueue: [],
    activeRetryItem: null,
    progress: Object.fromEntries(group.map((it) => [it.questionId, emptyProgress()])),
  };
}

function buildGroupStats(state: SessionState): GroupStats {
  const group = state.pairs.flat();
  let firstTryCorrectCount = 0;
  let totalWrongAttempts = 0;

  for (const it of group) {
    const p = state.progress[it.questionId];
    if (p.correct > 0 && p.wrong === 0) firstTryCorrectCount++;
    totalWrongAttempts += p.wrong;
  }

  return {
    groupIndex: state.groupIndex,
    itemCount: group.length,
    firstTryCorrectCount,
    totalWrongAttempts,
    accuracy: group.length > 0 ? firstTryCorrectCount / group.length : 0,
  };
}

function deriveCard(state: SessionState): SessionCard {
  switch (state.phase) {
    case "present":
      return { type: "presentation", item: state.pairs[state.pairIndex][state.withinPairIndex] };
    case "test":
      return { type: "test", item: state.pairs[state.pairIndex][state.withinPairIndex] };
    case "retry-present":
    case "drain-present":
      return { type: "presentation", item: state.activeRetryItem! };
    case "retry-test":
    case "drain-test":
      return { type: "test", item: state.activeRetryItem! };
    case "complete":
      return {
        type: "group-complete",
        stats: buildGroupStats(state),
        hasMoreGroups: state.groupIndex + 1 < state.groups.length,
      };
  }
}

function withCard(state: SessionState): SessionState {
  return { ...state, currentCard: deriveCard(state) };
}

// After finishing the current pair's tests (or a retry/drain test), decide
// what comes next: another item in the pair, a deferred retry slotted in,
// the next pair, the drain queue, or group-complete.
function advanceToNextPairOrDrainOrComplete(state: SessionState): SessionState {
  const nextPairIndex = state.pairIndex + 1;

  if (nextPairIndex < state.pairs.length) {
    return withCard({ ...state, pairIndex: nextPairIndex, withinPairIndex: 0, phase: "present" });
  }

  if (state.retryQueue.length > 0) {
    const [activeRetryItem, ...rest] = state.retryQueue;
    return withCard({
      ...state,
      pairIndex: nextPairIndex,
      retryQueue: rest,
      activeRetryItem,
      phase: "drain-present",
    });
  }

  return withCard({ ...state, pairIndex: nextPairIndex, phase: "complete" });
}

function advancePastFeedback(state: SessionState): SessionState {
  switch (state.phase) {
    case "test": {
      if (state.withinPairIndex + 1 < state.pairs[state.pairIndex].length) {
        return withCard({ ...state, withinPairIndex: state.withinPairIndex + 1 });
      }
      // finished this pair's tests — mix in one deferred retry if there is one
      if (state.retryQueue.length > 0) {
        const [activeRetryItem, ...rest] = state.retryQueue;
        return withCard({ ...state, retryQueue: rest, activeRetryItem, phase: "retry-present" });
      }
      return advanceToNextPairOrDrainOrComplete(state);
    }
    case "retry-test":
      return advanceToNextPairOrDrainOrComplete({ ...state, activeRetryItem: null });
    case "drain-test": {
      const cleared = { ...state, activeRetryItem: null };
      if (cleared.retryQueue.length > 0) {
        const [activeRetryItem, ...rest] = cleared.retryQueue;
        return withCard({ ...cleared, retryQueue: rest, activeRetryItem, phase: "drain-present" });
      }
      return withCard({ ...cleared, phase: "complete" });
    }
    default:
      throw new Error(`Cannot advance past feedback from phase "${state.phase}"`);
  }
}

function advancePastPresentation(state: SessionState): SessionState {
  switch (state.phase) {
    case "present": {
      if (state.withinPairIndex + 1 < state.pairs[state.pairIndex].length) {
        return withCard({ ...state, withinPairIndex: state.withinPairIndex + 1 });
      }
      return withCard({ ...state, withinPairIndex: 0, phase: "test" });
    }
    case "retry-present":
      return withCard({ ...state, phase: "retry-test" });
    case "drain-present":
      return withCard({ ...state, phase: "drain-test" });
    default:
      throw new Error(`CONTINUE is not valid from phase "${state.phase}"`);
  }
}

function handleAnswer(state: SessionState, correct: boolean): SessionState {
  if (state.currentCard.type !== "test") {
    throw new Error("ANSWER is only valid while the current card is a TestCard");
  }

  const item = state.currentCard.item;
  const prev = state.progress[item.questionId];
  const progress = {
    ...state.progress,
    [item.questionId]: {
      attempts: prev.attempts + 1,
      correct: prev.correct + (correct ? 1 : 0),
      wrong: prev.wrong + (correct ? 0 : 1),
    },
  };

  // A wrong answer is deferred, never retried on the spot — it goes to the
  // back of the retry queue and surfaces later (see advancePastFeedback).
  const retryQueue = correct ? state.retryQueue : [...state.retryQueue, item];

  return {
    ...state,
    progress,
    retryQueue,
    currentCard: { type: "feedback", item, correct },
  };
}

function handleContinueToNextGroup(state: SessionState): SessionState {
  if (state.currentCard.type !== "group-complete" || !state.currentCard.hasMoreGroups) {
    throw new Error("CONTINUE_TO_NEXT_GROUP is only valid when another group remains");
  }

  const nextGroupIndex = state.groupIndex + 1;
  const nextGroup = state.groups[nextGroupIndex] ?? [];

  return withCard({
    ...state,
    groupIndex: nextGroupIndex,
    ...buildGroupFields(nextGroup, state.config),
  });
}

export function apply(state: SessionState, event: SessionEvent): SessionState {
  if (event.type === "ANSWER") {
    return handleAnswer(state, event.correct);
  }

  if (event.type === "CONTINUE_TO_NEXT_GROUP") {
    return handleContinueToNextGroup(state);
  }

  // event.type === "CONTINUE"
  if (state.currentCard.type === "feedback") {
    return advancePastFeedback(state);
  }
  if (state.currentCard.type === "presentation") {
    return advancePastPresentation(state);
  }
  throw new Error(`CONTINUE is not valid while the current card is "${state.currentCard.type}"`);
}

export function init(allItems: SessionItemPayload[], config: SessionGroupConfig): SessionState {
  const groups = chunk(allItems, config.GROUP_SIZE);
  const firstGroup = groups[0] ?? [];

  const state: SessionState = {
    config,
    groups,
    groupIndex: 0,
    ...buildGroupFields(firstGroup, config),
    currentCard: { type: "group-complete", stats: buildGroupStats0(), hasMoreGroups: false },
  };

  return withCard(state);
}

function buildGroupStats0(): GroupStats {
  return { groupIndex: 0, itemCount: 0, firstTryCorrectCount: 0, totalWrongAttempts: 0, accuracy: 0 };
}

// For the sidebar: a 1-3 entry window (previous/current/next) around
// wherever the student currently is within the group, plus a position
// counter. Not part of card sequencing — purely a read of current state.
export function getGroupProgress(state: SessionState): GroupProgress {
  const group = state.pairs.flat();
  const total = group.length;

  const currentItem = state.currentCard.type !== "group-complete" ? state.currentCard.item : null;
  const currentIndex = currentItem
    ? group.findIndex((it) => it.questionId === currentItem.questionId) + 1
    : total;

  const retryIds = new Set(state.retryQueue.map((it) => it.questionId));
  if (state.activeRetryItem) retryIds.add(state.activeRetryItem.questionId);

  const items: GroupProgressItem[] = group.map((item, i) => {
    const index = i + 1;
    let status: GroupProgressItem["status"];
    if (index === currentIndex && currentItem) {
      status = "current";
    } else if (state.progress[item.questionId].correct > 0) {
      status = "done";
    } else if (retryIds.has(item.questionId)) {
      status = "retry-pending";
    } else {
      status = "pending";
    }
    return { index, item, status };
  });

  const window = items.filter((it) => it.index >= currentIndex - 1 && it.index <= currentIndex + 1);

  return { current: currentIndex, total, window };
}

// Text normalization: trim, collapse internal whitespace runs.
export function normalizeText(input: string): string {
  return input.trim().replace(/\s+/g, " ");
}

// Answer correctness (client-side check), matching the backend's rules.
export function checkAnswer(item: SessionItemPayload, userAnswer: string): boolean {
  if (item.questionType === "MultipleChoiceQuestion") {
    return normalizeText(userAnswer) === normalizeText(item.correctAnswer ?? "");
  }

  const given = normalizeText(userAnswer);
  const expected = normalizeText(item.correctText ?? "");
  if (item.caseSensitive === false) {
    return given.toLocaleLowerCase() === expected.toLocaleLowerCase();
  }
  return given === expected;
}
