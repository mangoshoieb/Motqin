// Conforms to Motqin Learning Session Algorithm Spec v3.0 — do not change
// behavior without bumping the spec and updating the §9 conformance tests.
//
// Pure module: init(payload, config) -> state, apply(state, event) -> state.
// Zero imports from UI, networking, or platform APIs — networking
// (session-completion reporting) subscribes to this module's outputs from
// the caller (useLessonSession), it is never invoked from in here.
//
// Flow: questions are divided into fixed blocks of BATCH_SIZE, by their
// position in the payload ("order"). Within a block, questions are
// introduced INTRO_CHUNK at a time rather than all at once — the second
// chunk (and any later one) is brought in only when the GAP crunch forces
// it, before falling back to filler cards. next() runs these checks in
// order, stopping at the first that applies:
//   1. re-teach — a question flagged after a wrong answer gets its info
//      card again immediately, unconditionally. This does NOT touch
//      lastShown or pendingIntro.
//   2. advance the block — once every question in the current block is
//      finished, silently move to the next one (resetting pendingIntro),
//      or the summary if that was the last block.
//   3. introduce a chunk — open the block's first INTRO_CHUNK questions,
//      or continue handing out the rest of a chunk already in progress.
//   4. test, introduce (crunch fallback), or fill — pick a "studying"
//      question whose spacing (GAP) allows it; if none qualifies, try
//      bringing in the block's next chunk first (v3.0's new fallback),
//      then a filler review (current block, then anywhere earlier in the
//      lesson), or re-test anyway as a last resort.
//
// Info cards consume a turn (so they still add GAP distance) but never set
// lastShown — only test/filler cards do. That's what lets a freshly
// introduced question be tested on the very next turn (its lastShown
// sentinel stays -1, which always clears the gap).

function totalBlocks(payloadLength: number, config: SessionConfig): number {
  return payloadLength === 0 ? 0 : Math.ceil(payloadLength / config.BATCH_SIZE);
}

function blockQuestions(state: SessionState, block: number): QuestionState[] {
  const start = block * state.config.BATCH_SIZE;
  const end = Math.min(start + state.config.BATCH_SIZE, state.payload.length);
  return state.questions.slice(start, end);
}

function replaceQuestion(
  questions: QuestionState[],
  order: number,
  patch: Partial<QuestionState>
): QuestionState[] {
  return questions.map((q) => (q.order === order ? { ...q, ...patch } : q));
}

function emptyStats(): SessionStats {
  return { testCards: 0, fillerCards: 0, correct: 0, wrong: 0 };
}

function withCard(state: SessionState, card: SessionCard): SessionState {
  return { ...state, currentCard: card };
}

function byLastShownThenOrder(a: QuestionState, b: QuestionState): number {
  return a.lastShown !== b.lastShown ? a.lastShown - b.lastShown : a.order - b.order;
}

function next(state: SessionState): SessionState {
  const T = state.turn + 1;

  // STEP 1 — re-teach after a wrong answer (highest priority). Does not
  // touch lastShown or pendingIntro — only clears the flag and consumes a turn.
  if (state.reteach !== null) {
    const item = state.payload[state.reteach];
    return withCard({ ...state, reteach: null, turn: T }, { type: "info", item });
  }

  // STEP 2 — advance the block, resetting pendingIntro on every advance.
  const blocks = totalBlocks(state.payload.length, state.config);
  let currentBlock = state.currentBlock;
  let pendingIntro = state.pendingIntro;
  while (currentBlock < blocks && blockQuestions(state, currentBlock).every((q) => q.done)) {
    currentBlock++;
    pendingIntro = 0;
  }
  if (currentBlock >= blocks) {
    // turn does NOT increment
    return withCard({ ...state, currentBlock, pendingIntro }, { type: "summary", stats: state.stats });
  }

  let working: SessionState = { ...state, currentBlock, pendingIntro };

  // STEP 3 — introduce new questions, a chunk at a time.
  // 3a — open the block's first chunk if nothing has been seen yet.
  if (working.pendingIntro === 0 && blockQuestions(working, currentBlock).every((q) => !q.seen)) {
    working = { ...working, pendingIntro: working.config.INTRO_CHUNK };
  }

  // 3b
  if (working.pendingIntro > 0) {
    const waiting = blockQuestions(working, currentBlock).filter((q) => !q.seen);
    if (waiting.length > 0) {
      const q = waiting.reduce((min, w) => (w.order < min.order ? w : min));
      const item = working.payload[q.order];
      return withCard(
        {
          ...working,
          questions: replaceQuestion(working.questions, q.order, { seen: true }),
          pendingIntro: working.pendingIntro - 1,
          turn: T,
        },
        { type: "info", item }
      );
    }
    // chunk ends early; nothing left to introduce — fall through to step 4
    working = { ...working, pendingIntro: 0 };
  }

  // STEP 4 — test, introduce (crunch fallback), or fill.
  const studying = blockQuestions(working, currentBlock).filter((q) => q.seen && !q.done);

  // 4a — eligible = studying questions whose last test/filler is far enough back
  const eligible = studying.filter((q) => q.lastShown === -1 || T - q.lastShown > working.config.GAP);
  if (eligible.length > 0) {
    const q = eligible.reduce((best, it) => {
      if (it.score !== best.score) return it.score < best.score ? it : best;
      if (it.lastShown !== best.lastShown) return it.lastShown < best.lastShown ? it : best;
      return it.order < best.order ? it : best;
    });
    const item = working.payload[q.order];
    return withCard(
      {
        ...working,
        questions: replaceQuestion(working.questions, q.order, { lastShown: T }),
        turn: T,
      },
      { type: "test", item }
    );
  }

  // 4b — end-of-block crunch: four fallbacks, in order

  // 4b(i) — NEW in v3.0: bring in the next chunk instead of filling, if the
  // block still has anything waiting.
  const waitingForCrunch = blockQuestions(working, currentBlock).filter((q) => !q.seen);
  if (waitingForCrunch.length > 0) {
    const q = waitingForCrunch.reduce((min, w) => (w.order < min.order ? w : min));
    const item = working.payload[q.order];
    return withCard(
      {
        ...working,
        questions: replaceQuestion(working.questions, q.order, { seen: true }),
        pendingIntro: working.config.INTRO_CHUNK - 1,
        turn: T,
      },
      { type: "info", item }
    );
  }

  // 4b(ii) — filler from the current block
  const finishedInBlock = blockQuestions(working, currentBlock).filter((q) => q.done);
  if (finishedInBlock.length > 0) {
    const q = [...finishedInBlock].sort(byLastShownThenOrder)[0];
    const item = working.payload[q.order];
    return withCard(
      {
        ...working,
        questions: replaceQuestion(working.questions, q.order, { lastShown: T }),
        turn: T,
      },
      { type: "filler", item }
    );
  }

  // 4b(iii) — filler from the start of the lesson (smallest order, i.e. earliest)
  const finishedAnywhere = working.questions.filter((q) => q.done);
  if (finishedAnywhere.length > 0) {
    const q = finishedAnywhere.reduce((min, it) => (it.order < min.order ? it : min));
    const item = working.payload[q.order];
    return withCard(
      {
        ...working,
        questions: replaceQuestion(working.questions, q.order, { lastShown: T }),
        turn: T,
      },
      { type: "filler", item }
    );
  }

  // 4b(iv) — nothing is finished anywhere yet: re-test anyway, gap ignored
  const q = [...studying].sort(byLastShownThenOrder)[0];
  const item = working.payload[q.order];
  return withCard(
    {
      ...working,
      questions: replaceQuestion(working.questions, q.order, { lastShown: T }),
      turn: T,
    },
    { type: "test", item }
  );
}

// §6 — on an info card, CONTINUE just advances; on a test/filler card,
// ANSWER updates state per §6/§6.2 and then next() is always called.
export function apply(state: SessionState, event: SessionEvent): SessionState {
  if (event.type === "CONTINUE") {
    if (state.currentCard.type !== "info") {
      throw new Error("CONTINUE is only valid while the current card is an InfoCard");
    }
    return next(state);
  }

  // event.type === "ANSWER"
  if (state.currentCard.type === "test") {
    const item = state.currentCard.item;
    const q = state.questions.find((it) => state.payload[it.order].questionId === item.questionId)!;

    let questions = state.questions;
    let reteach = state.reteach;

    if (event.correct) {
      const score = q.score + 1;
      questions = replaceQuestion(state.questions, q.order, { score, done: score >= state.config.GRADUATE });
    } else {
      questions = replaceQuestion(state.questions, q.order, { score: Math.max(0, q.score - 1) });
      reteach = q.order;
    }

    const stats: SessionStats = {
      ...state.stats,
      testCards: state.stats.testCards + 1,
      correct: state.stats.correct + (event.correct ? 1 : 0),
      wrong: state.stats.wrong + (event.correct ? 0 : 1),
    };

    return next({ ...state, questions, reteach, stats });
  }

  if (state.currentCard.type === "filler") {
    // §6.2 — recorded for stats only; score/done are untouched.
    const stats: SessionStats = {
      ...state.stats,
      fillerCards: state.stats.fillerCards + 1,
      correct: state.stats.correct + (event.correct ? 1 : 0),
      wrong: state.stats.wrong + (event.correct ? 0 : 1),
    };
    return next({ ...state, stats });
  }

  throw new Error(`ANSWER is only valid while the current card is a TestCard or FillerCard`);
}

// §8 — "the screen must always offer an End session button that jumps to
// the summary with the current numbers."
export function endSession(state: SessionState): SessionState {
  return withCard(state, { type: "summary", stats: state.stats });
}

export function init(payload: SessionItemPayload[], config: SessionConfig): SessionState {
  const questions: QuestionState[] = payload.map((_, order) => ({
    order,
    seen: false,
    done: false,
    score: 0,
    lastShown: -1,
  }));

  const bootstrap: SessionState = {
    config,
    payload,
    questions,
    turn: 0,
    currentBlock: 0,
    reteach: null,
    pendingIntro: 0,
    currentCard: { type: "summary", stats: emptyStats() }, // placeholder, replaced below
    stats: emptyStats(),
  };

  return next(bootstrap);
}

// For the sidebar: a 1-3 entry window (previous/current/next) around
// wherever the student currently is within the current block, plus a
// position counter. Not part of card sequencing — purely a read of state.
export function getBlockProgress(state: SessionState): BlockProgress {
  const start = state.currentBlock * state.config.BATCH_SIZE;
  const end = Math.min(start + state.config.BATCH_SIZE, state.payload.length);
  const blockPayload = state.payload.slice(start, end);
  const total = blockPayload.length;

  const currentItem = state.currentCard.type !== "summary" ? state.currentCard.item : null;
  const foundIndex = currentItem
    ? blockPayload.findIndex((it) => it.questionId === currentItem.questionId) + 1
    : 0;
  const currentIndex = foundIndex > 0 ? foundIndex : total;

  const items: BlockProgressItem[] = blockPayload.map((item, i) => {
    const index = i + 1;
    const q = state.questions[start + i];
    let status: BlockProgressItem["status"];
    if (index === currentIndex && currentItem) status = "current";
    else if (q.done) status = "done";
    else status = "pending";
    return { index, item, status };
  });

  const window = items.filter((it) => it.index >= currentIndex - 1 && it.index <= currentIndex + 1);

  return { current: currentIndex, total, window };
}

// §6.1 Text normalization: trim, collapse internal whitespace runs.
export function normalizeText(input: string): string {
  return input.trim().replace(/\s+/g, " ");
}

// §6.1 Answer correctness (client-side check).
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
