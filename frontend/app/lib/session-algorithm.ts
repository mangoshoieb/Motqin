// Conforms to Motqin Learning Session Algorithm Spec v3 + flowchart v2 — the
// same engine the mobile app runs (SessionEngine in
// features/quiz_system/domain/session). Do not change behavior without
// changing it there too and updating the conformance tests.
//
// Pure module: init(payload, config) -> state, apply(state, event) -> state.
// Zero imports from UI, networking, or platform APIs — networking
// (session-completion reporting) and persistence subscribe to this module's
// outputs from the caller (useLessonSession), never from in here. No
// randomness, no wall-clock: the same payload and the same answers always
// produce the same sequence of cards.
//
// Layout (§3): every question's displayOrder (1-based) places it in a block
// of BATCH_SIZE, and within the block in a pair — displayOrders 1-2 are
// pair 0, 3-4 pair 1, 5-6 pair 2. A pair unlocks once every earlier pair is
// far enough along: pair p needs each member of pair i (i < p) at score
// >= p - i. So pair 1 waits for pair 0 to reach 1, and pair 2 waits for
// pair 0 to reach 2 and pair 1 to reach 1.
//
// next() runs these checks in order, stopping at the first that applies:
//   1. re-teach — a question flagged after a wrong answer (test OR filler)
//      gets its info card again immediately, unconditionally.
//   2. block finished — every question in the current block is done: show
//      that block's summary. CONTINUE on it moves to the next block; the
//      last block's summary ends the session.
//   3. introduce — the block's first not-yet-seen question whose pair has
//      unlocked gets its info card.
//   4. test or fill — pick a "studying" question whose spacing (GAP)
//      allows it; if none qualifies, a filler review (current block, then
//      the start of the lesson), or re-test anyway as a last resort.
//
// EVERY card that shows a question sets its lastShown — info and re-teach
// cards included, not just test/filler. So a question is never tested
// straight after its info card; GAP other cards have to pass first.

// §8 — bump whenever a saved session could no longer be resumed correctly
// by this code. Matches the mobile SessionSnapshot.currentVersion.
export const SNAPSHOT_VERSION = 3;

// §6.1 — a question switches from MCQ to fill-in-the-blank at this score.
const FIB_FROM_SCORE = 2;

// Dart's `~/` truncates toward zero and its `%` is never negative. Mirrored
// exactly so block/pair placement matches the mobile app for every
// displayOrder, including out-of-range ones like 0.
function truncDiv(a: number, b: number): number {
  return Math.trunc(a / b);
}

function dartMod(a: number, b: number): number {
  const r = a % b;
  return r < 0 ? r + Math.abs(b) : r;
}

function displayOrderOf(state: SessionState, q: QuestionState): number {
  return state.payload[q.order].displayOrder;
}

function blockOf(state: SessionState, q: QuestionState): number {
  return truncDiv(displayOrderOf(state, q) - 1, state.config.BATCH_SIZE);
}

function pairOf(state: SessionState, q: QuestionState): number {
  return truncDiv(dartMod(displayOrderOf(state, q) - 1, state.config.BATCH_SIZE), 2);
}

function totalBlocks(state: SessionState): number {
  if (state.payload.length === 0) return 0;
  const maxOrder = Math.max(0, ...state.payload.map((item) => item.displayOrder));
  return Math.ceil(maxOrder / state.config.BATCH_SIZE);
}

function blockQuestions(state: SessionState, block: number): QuestionState[] {
  return state.questions.filter((q) => blockOf(state, q) === block);
}

function blockFullyDone(state: SessionState, block: number): boolean {
  const qs = blockQuestions(state, block);
  return qs.length > 0 && qs.every((q) => q.done);
}

function pairUnlocked(state: SessionState, pair: number, inBlock: QuestionState[]): boolean {
  for (let i = 0; i < pair; i++) {
    const need = pair - i;
    if (inBlock.some((q) => pairOf(state, q) === i && q.score < need)) return false;
  }
  return true;
}

function replaceQuestion(
  questions: QuestionState[],
  order: number,
  patch: Partial<QuestionState>
): QuestionState[] {
  return questions.map((q) => (q.order === order ? { ...q, ...patch } : q));
}

function emptyStats(): SessionStats {
  return { testCards: 0, fillerCards: 0, correct: 0, wrong: 0, testCorrect: 0 };
}

function tally(stats: SessionStats, card: "test" | "filler", correct: boolean): SessionStats {
  return {
    testCards: stats.testCards + (card === "test" ? 1 : 0),
    fillerCards: stats.fillerCards + (card === "filler" ? 1 : 0),
    correct: stats.correct + (correct ? 1 : 0),
    wrong: stats.wrong + (correct ? 0 : 1),
    // Test cards are the only thing the backend score counts, so this
    // tracks alongside `correct` rather than replacing it.
    testCorrect: stats.testCorrect + (card === "test" && correct ? 1 : 0),
  };
}

function withCard(state: SessionState, card: SessionCard): SessionState {
  return { ...state, currentCard: card };
}

function byLastShownThenOrder(a: QuestionState, b: QuestionState): number {
  return a.lastShown !== b.lastShown ? a.lastShown - b.lastShown : a.order - b.order;
}

function byScoreThenLastShownThenOrder(a: QuestionState, b: QuestionState): number {
  return a.score !== b.score ? a.score - b.score : byLastShownThenOrder(a, b);
}

// §6.1 — the form escalates with the score: MCQ at 0 and 1, fill-in-the-
// blank from FIB_FROM_SCORE on. Filler reviews are always the MCQ. Rows that
// only carry one of the two forms fall back to what exists, so a question
// is never unanswerable and can still graduate.
function formFor(item: SessionItemPayload, type: "test" | "filler", score: number): SessionItemForm {
  const preferred = type === "test" && score >= FIB_FROM_SCORE ? item.fib : item.mcq;
  const form = preferred ?? item.mcq ?? item.fib;
  if (!form) {
    throw new Error(`Question ${item.questionId} has neither an MCQ nor a fill-in-the-blank form`);
  }
  return form;
}

// Builds the card for the question at `order`. Test cards resolve their
// form from the question's current score.
function buildCard(
  state: SessionState,
  type: "info" | "test" | "filler",
  order: number
): SessionCard {
  const item = state.payload[order];
  if (type === "info") return { type, item };
  return { type, item, form: formFor(item, type, state.questions[order].score) };
}

// Shows a card about the question at `order` on turn T. Every card that
// shows a question — info, re-teach, test or filler — records T as its
// lastShown, which is what keeps a just-introduced question out of the GAP.
function show(
  state: SessionState,
  type: "info" | "test" | "filler",
  order: number,
  T: number
): SessionState {
  const shown: SessionState = {
    ...state,
    questions: replaceQuestion(state.questions, order, { lastShown: T }),
    turn: T,
  };
  return withCard(shown, buildCard(shown, type, order));
}

function summaryCard(state: SessionState, isLastBlock: boolean): SummaryCard {
  const inBlock = blockQuestions(state, state.currentBlock);
  return {
    type: "summary",
    isLastBlock,
    blockNumber: state.payload.length === 0 ? 0 : state.currentBlock + 1,
    totalBlocks: totalBlocks(state),
    blockQuestionCount: inBlock.length,
    blockDoneCount: inBlock.filter((q) => q.done).length,
    blockStats: state.blockStats,
    stats: state.stats,
  };
}

function next(state: SessionState): SessionState {
  // Summaries do not consume a turn.
  if (state.payload.length === 0) return withCard(state, summaryCard(state, true));

  const T = state.turn + 1;

  // STEP 1 — re-teach after a wrong answer (highest priority).
  if (state.reteach !== null) {
    return show({ ...state, reteach: null }, "info", state.reteach, T);
  }

  // A gap in displayOrder can leave a block with no questions at all. The
  // mobile engine has no answer for that (it never finishes such a block),
  // so step over it silently.
  const blocks = totalBlocks(state);
  let currentBlock = state.currentBlock;
  while (currentBlock < blocks - 1 && blockQuestions(state, currentBlock).length === 0) {
    currentBlock++;
  }
  const working: SessionState = { ...state, currentBlock };

  // STEP 2 — the current block is finished: its summary.
  if (blockFullyDone(working, currentBlock)) {
    return withCard(working, summaryCard(working, currentBlock >= blocks - 1));
  }

  const inBlock = blockQuestions(working, currentBlock);

  // STEP 3 — bring in the first waiting question whose pair has unlocked.
  const waiting = inBlock.filter((q) => !q.seen).sort((a, b) => a.order - b.order);
  const unlocked = waiting.find((q) => pairUnlocked(working, pairOf(working, q), inBlock));
  if (unlocked) {
    return show(
      { ...working, questions: replaceQuestion(working.questions, unlocked.order, { seen: true }) },
      "info",
      unlocked.order,
      T
    );
  }

  // STEP 4 — test or fill.
  const studying = inBlock.filter((q) => q.seen && !q.done);

  // 4a — eligible = studying questions last shown far enough back; lowest
  // score first, then longest since shown, then order.
  const eligible = studying.filter((q) => q.lastShown === -1 || T - q.lastShown > working.config.GAP);
  if (eligible.length > 0) {
    const q = [...eligible].sort(byScoreThenLastShownThenOrder)[0];
    return show(working, "test", q.order, T);
  }

  // 4b(i) — filler from the current block, longest since shown first.
  const finishedInBlock = inBlock.filter((q) => q.done);
  if (finishedInBlock.length > 0) {
    const q = [...finishedInBlock].sort(byLastShownThenOrder)[0];
    return show(working, "filler", q.order, T);
  }

  // 4b(ii) — filler from the start of the lesson (smallest order).
  const finishedAnywhere = working.questions.filter((q) => q.done);
  if (finishedAnywhere.length > 0) {
    const q = finishedAnywhere.reduce((min, it) => (it.order < min.order ? it : min));
    return show(working, "filler", q.order, T);
  }

  // 4b(iii) — nothing is finished anywhere yet: re-test anyway, gap ignored.
  if (studying.length > 0) {
    const q = [...studying].sort(byLastShownThenOrder)[0];
    return show(working, "test", q.order, T);
  }

  // Unreachable with a GRADUATE above the highest pair requirement; kept so
  // an odd config introduces the next question instead of crashing.
  return show(
    { ...working, questions: replaceQuestion(working.questions, waiting[0].order, { seen: true }) },
    "info",
    waiting[0].order,
    T
  );
}

// §6 — CONTINUE advances past an info card, or past a block summary to the
// next block. ANSWER updates state per §6 and then next() is always called.
export function apply(state: SessionState, event: SessionEvent): SessionState {
  const card = state.currentCard;

  if (event.type === "CONTINUE") {
    if (card.type === "info") return next(state);

    if (card.type === "summary" && !card.isLastBlock) {
      return next({ ...state, currentBlock: state.currentBlock + 1, blockStats: emptyStats() });
    }

    throw new Error("CONTINUE is only valid on an InfoCard or a block's SummaryCard");
  }

  // event.type === "ANSWER"
  if (card.type === "test") {
    const q = state.questions.find((it) => state.payload[it.order].questionId === card.item.questionId)!;

    let questions: QuestionState[];
    let reteach = state.reteach;

    if (event.correct) {
      const score = q.score + 1;
      questions = replaceQuestion(state.questions, q.order, { score, done: score >= state.config.GRADUATE });
    } else {
      questions = replaceQuestion(state.questions, q.order, { score: Math.max(0, q.score - 1) });
      reteach = q.order;
    }

    return next({
      ...state,
      questions,
      reteach,
      stats: tally(state.stats, "test", event.correct),
      blockStats: tally(state.blockStats, "test", event.correct),
    });
  }

  if (card.type === "filler") {
    // §6.3 — score/done are untouched, but a wrong review still re-teaches.
    const q = state.questions.find((it) => state.payload[it.order].questionId === card.item.questionId)!;

    return next({
      ...state,
      reteach: event.correct ? state.reteach : q.order,
      stats: tally(state.stats, "filler", event.correct),
      blockStats: tally(state.blockStats, "filler", event.correct),
    });
  }

  throw new Error(`ANSWER is only valid while the current card is a TestCard or FillerCard`);
}

// §8 — "the screen must always offer an End session button that jumps to
// the summary with the current numbers." Always the final summary.
export function endSession(state: SessionState): SessionState {
  return withCard(state, summaryCard(state, true));
}

function freshState(payload: SessionItemPayload[], config: SessionConfig): SessionState {
  // Fail loudly rather than shipping a question that can never be tested.
  const formless = payload.find((item) => !item.mcq && !item.fib);
  if (formless) {
    throw new Error(
      `Question ${formless.questionId} has neither an MCQ nor a fill-in-the-blank form`
    );
  }

  // Sorted by displayOrder, as the mobile engine sorts its items. The sort
  // is stable, so ties keep the order they arrived in.
  const sorted = [...payload].sort((a, b) => a.displayOrder - b.displayOrder);

  const questions: QuestionState[] = sorted.map((_, order) => ({
    order,
    seen: false,
    done: false,
    score: 0,
    lastShown: -1,
  }));

  const state: SessionState = {
    config,
    payload: sorted,
    questions,
    turn: 0,
    currentBlock: 0,
    reteach: null,
    currentCard: { type: "info", item: sorted[0] }, // placeholder, replaced below
    stats: emptyStats(),
    blockStats: emptyStats(),
  };
  // Placeholder only — callers always replace it (init via next(), restore
  // via the saved card).
  return withCard(state, summaryCard(state, true));
}

export function init(payload: SessionItemPayload[], config: SessionConfig): SessionState {
  return next(freshState(payload, config));
}

// §8 — the pause/resume payload. Returns null on the final summary: a
// finished (or ended) session has nothing to resume.
export function toSnapshot(state: SessionState): SessionSnapshot | null {
  const card = state.currentCard;
  if (card.type === "summary" && card.isLastBlock) return null;

  return {
    version: SNAPSHOT_VERSION,
    questionIds: state.payload.map((item) => item.questionId),
    turn: state.turn,
    currentBlock: state.currentBlock,
    reteach: state.reteach,
    questions: state.questions.map(({ seen, done, score, lastShown }) => ({ seen, done, score, lastShown })),
    stats: state.stats,
    blockStats: state.blockStats,
    current:
      card.type === "summary"
        ? { type: "summary" }
        : {
            type: card.type,
            order: state.payload.findIndex((item) => item.questionId === card.item.questionId),
          },
  };
}

// Re-applies a snapshot to a freshly fetched payload, landing on the exact
// card that was on screen when it was saved. Returns null — start fresh —
// when it was saved by another algorithm version or the lesson's questions
// changed since (added, removed or reordered), since per-question progress
// is matched by position.
export function restore(
  payload: SessionItemPayload[],
  config: SessionConfig,
  snapshot: SessionSnapshot
): SessionState | null {
  if (snapshot.version !== SNAPSHOT_VERSION) return null;

  const base = freshState(payload, config);
  const current = snapshot.current;
  const sameQuestions =
    snapshot.questionIds.length === base.payload.length &&
    snapshot.questionIds.every((id, i) => base.payload[i].questionId === id) &&
    snapshot.questions.length === base.payload.length &&
    (current.type === "summary" || (current.order >= 0 && current.order < base.payload.length));
  if (!sameQuestions) return null;

  const state: SessionState = {
    ...base,
    questions: base.questions.map((q) => ({ ...q, ...snapshot.questions[q.order] })),
    turn: snapshot.turn,
    currentBlock: snapshot.currentBlock,
    reteach: snapshot.reteach,
    stats: snapshot.stats,
    blockStats: snapshot.blockStats,
  };

  // Only a block summary is ever saved (never the last one), so it is
  // rebuilt as a non-last summary.
  return withCard(
    state,
    current.type === "summary" ? summaryCard(state, false) : buildCard(state, current.type, current.order)
  );
}

// For the sidebar: every question in the current block, in its §5
// waiting/studying/finished state, plus which one (if any) is the one
// currently on screen. Not part of card sequencing — purely a read of
// state.
export function getBlockProgress(state: SessionState): BlockProgress {
  const currentItem = state.currentCard.type !== "summary" ? state.currentCard.item : null;

  const items: BlockProgressItem[] = blockQuestions(state, state.currentBlock).map((q, i) => {
    const item = state.payload[q.order];
    const status: BlockProgressItem["status"] = q.done ? "done" : q.seen ? "studying" : "waiting";
    return { index: i + 1, item, status, isCurrent: currentItem?.questionId === item.questionId };
  });

  return { blockNumber: state.currentBlock + 1, totalBlocks: totalBlocks(state), items };
}

// For the progress bar: finished questions out of the whole lesson.
export function getLessonProgress(state: SessionState): LessonProgress {
  return {
    done: state.questions.filter((q) => q.done).length,
    total: state.questions.length,
  };
}

// §6.2 Text normalization: trim, collapse internal whitespace runs.
export function normalizeText(input: string): string {
  return input.trim().replace(/\s+/g, " ");
}

// §6.2 Answer correctness (client-side check). Grades against the form that
// was actually shown — the card carries it, since a question's form changes
// with its score. Exact after normalization, no case folding; a blank is
// correct if it matches ANY of its accepted wordings.
export function checkAnswer(form: SessionItemForm, userAnswer: string): boolean {
  const given = normalizeText(userAnswer);

  if (form.questionType === "MultipleChoiceQuestion") {
    return given === normalizeText(form.correctAnswer ?? "");
  }

  return (form.correctText ?? []).some((accepted) => normalizeText(accepted) === given);
}
