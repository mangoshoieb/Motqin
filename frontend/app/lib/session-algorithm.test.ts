// Conforms to Session Algorithm Spec v3.0 — §9 conformance tests, ported as
// automated tests. Every implementation MUST reproduce these traces exactly.
import { describe, expect, it } from "vitest";
import { apply, endSession, getBlockProgress, init } from "./session-algorithm";

function makeItem(questionId: number): SessionItemPayload {
  return {
    questionId,
    title: `title-${questionId}`,
    description: "",
    imageUrl: null,
    audioUrl: null,
    mcq: {
      questionType: "MultipleChoiceQuestion",
      questionText: `mcq-${questionId}`,
      answerOptions: "a,b",
      correctAnswer: "a",
      correctText: null,
      caseSensitive: null,
    },
    fib: {
      questionType: "FillInTheBlankQuestion",
      questionText: `fib-${questionId}`,
      answerOptions: null,
      correctAnswer: null,
      correctText: "a",
      caseSensitive: false,
    },
  };
}

const correct = { type: "ANSWER" as const, correct: true, userAnswer: "a" };
const wrong = { type: "ANSWER" as const, correct: false, userAnswer: "wrong" };
const CONTINUE = { type: "CONTINUE" as const };

describe("§9.1 — chunked intro (INTRO_CHUNK = BATCH_SIZE), re-teach, filler, block advance", () => {
  it("reproduces the scripted 16-turn trace exactly", () => {
    // BATCH_SIZE=2, GRADUATE=2, GAP=1, INTRO_CHUNK=2. A,B,C,D at order 0-3
    // (ids 101-104). Blocks: block 0 = {A,B}, block 1 = {C,D}. INTRO_CHUNK
    // equals BATCH_SIZE here, so each block is introduced in one chunk.
    const [A, B, C, D] = [101, 102, 103, 104].map(makeItem);
    let state = init([A, B, C, D], { BATCH_SIZE: 2, GRADUATE: 2, GAP: 1, INTRO_CHUNK: 2 });

    // Turn 1 — Info(A): block opens, pendingIntro 2 -> 1
    expect(state.currentCard).toEqual({ type: "info", item: A });
    state = apply(state, CONTINUE);

    // Turn 2 — Info(B): pendingIntro 1 -> 0
    expect(state.turn).toBe(2);
    expect(state.currentCard).toEqual({ type: "info", item: B });
    state = apply(state, CONTINUE);

    // Turn 3 — Test(A): both never tested, order breaks the tie
    expect(state.turn).toBe(3);
    expect(state.currentCard).toMatchObject({ type: "test", item: A });
    state = apply(state, correct);

    // Turn 4 — Test(B): A is inside the gap, B has never been tested
    expect(state.turn).toBe(4);
    expect(state.currentCard).toMatchObject({ type: "test", item: B });
    state = apply(state, correct);

    // Turn 5 — Test(A): 5-3=2 > GAP -> A score 2 -> finished
    expect(state.turn).toBe(5);
    expect(state.currentCard).toMatchObject({ type: "test", item: A });
    state = apply(state, correct);

    // Turn 6 — Test(B), Wrong -> B score 0, flagged for re-teach
    expect(state.turn).toBe(6);
    expect(state.currentCard).toMatchObject({ type: "test", item: B });
    state = apply(state, wrong);

    // Turn 7 — Info(B): flag cleared; B's lastShown stays 6 (info doesn't touch it)
    expect(state.turn).toBe(7);
    expect(state.currentCard).toEqual({ type: "info", item: B });
    state = apply(state, CONTINUE);

    // Turn 8 — Test(B): 8-6=2 > GAP (measured from turn 6, NOT 7 — the
    // v3.0 difference from v2.1, where this turn was a filler instead).
    expect(state.turn).toBe(8);
    expect(state.currentCard).toMatchObject({ type: "test", item: B });
    state = apply(state, correct);

    // Turn 9 — Filler(A): B is inside the gap, nothing waiting in block 0 -> 4b(ii)
    expect(state.turn).toBe(9);
    expect(state.currentCard).toMatchObject({ type: "filler", item: A });
    state = apply(state, correct);

    // Turn 10 — Test(B): 10-8=2 > GAP -> B score 2 -> finished
    expect(state.turn).toBe(10);
    expect(state.currentCard).toMatchObject({ type: "test", item: B });
    state = apply(state, correct);

    // Turn 11 — Info(C): block 0 all finished -> block 1 opens
    expect(state.turn).toBe(11);
    expect(state.currentBlock).toBe(1);
    expect(state.currentCard).toEqual({ type: "info", item: C });
    state = apply(state, CONTINUE);

    // Turn 12 — Info(D)
    expect(state.turn).toBe(12);
    expect(state.currentCard).toEqual({ type: "info", item: D });
    state = apply(state, CONTINUE);

    // Turn 13 — Test(C)
    expect(state.turn).toBe(13);
    expect(state.currentCard).toMatchObject({ type: "test", item: C });
    state = apply(state, correct);

    // Turn 14 — Test(D)
    expect(state.turn).toBe(14);
    expect(state.currentCard).toMatchObject({ type: "test", item: D });
    state = apply(state, correct);

    // Turn 15 — Test(C) -> finished
    expect(state.turn).toBe(15);
    expect(state.currentCard).toMatchObject({ type: "test", item: C });
    state = apply(state, correct);

    // Turn 16 — Test(D) -> finished
    expect(state.turn).toBe(16);
    expect(state.currentCard).toMatchObject({ type: "test", item: D });
    state = apply(state, correct);

    // Summary — 5 info cards, 10 test cards, 1 filler; 10 correct, 1 wrong.
    // testCorrect is 9, not 10: the only wrong answer was a test card
    // (turn 6), and the one correct filler (turn 9) doesn't count toward it.
    expect(state.turn).toBe(16);
    expect(state.currentCard).toEqual({
      type: "summary",
      stats: { testCards: 10, fillerCards: 1, correct: 10, wrong: 1, testCorrect: 9 },
    });
  });
});

describe("§9.2 — chunked introduction fires 4b(i) instead of a filler", () => {
  it("reproduces the scripted 12-turn trace exactly", () => {
    // BATCH_SIZE=4, GRADUATE=2, GAP=2, INTRO_CHUNK=2. A,B,C,D at order 0-3
    // (ids 401-404); one single block {A,B,C,D}. All answers correct.
    const [A, B, C, D] = [401, 402, 403, 404].map(makeItem);
    let state = init([A, B, C, D], { BATCH_SIZE: 4, GRADUATE: 2, GAP: 2, INTRO_CHUNK: 2 });

    // Turn 1 — Info(A): block opens, pendingIntro 2 -> 1
    expect(state.currentCard).toEqual({ type: "info", item: A });
    state = apply(state, CONTINUE);

    // Turn 2 — Info(B): pendingIntro 1 -> 0. C and D stay hidden.
    expect(state.turn).toBe(2);
    expect(state.currentCard).toEqual({ type: "info", item: B });
    state = apply(state, CONTINUE);

    // Turn 3 — Test(A)
    expect(state.turn).toBe(3);
    expect(state.currentCard).toMatchObject({ type: "test", item: A });
    state = apply(state, correct);

    // Turn 4 — Test(B)
    expect(state.turn).toBe(4);
    expect(state.currentCard).toMatchObject({ type: "test", item: B });
    state = apply(state, correct);

    // Turn 5 — Info(C): neither A (5-3=2) nor B (5-4=1) clears GAP=2 ->
    // 4b(i) brings in the next chunk instead of a filler. This is the
    // whole point of v3.0.
    expect(state.turn).toBe(5);
    expect(state.currentCard).toEqual({ type: "info", item: C });
    state = apply(state, CONTINUE);

    // Turn 6 — Info(D): pendingIntro 1 -> 0
    expect(state.turn).toBe(6);
    expect(state.currentCard).toEqual({ type: "info", item: D });
    state = apply(state, CONTINUE);

    // Turn 7 — Test(C): C and D tie at score 0 (lowest); C wins on order.
    // C was introduced two turns ago and is tested immediately because
    // "never tested" (-1) always clears the gap — proof info cards must
    // not touch lastShown.
    expect(state.turn).toBe(7);
    expect(state.currentCard).toMatchObject({ type: "test", item: C });
    state = apply(state, correct);

    // Turn 8 — Test(D)
    expect(state.turn).toBe(8);
    expect(state.currentCard).toMatchObject({ type: "test", item: D });
    state = apply(state, correct);

    // Turn 9 — Test(A): all four tie on score 1; A was tested longest ago -> finished
    expect(state.turn).toBe(9);
    expect(state.currentCard).toMatchObject({ type: "test", item: A });
    state = apply(state, correct);

    // Turn 10 — Test(B) -> finished
    expect(state.turn).toBe(10);
    expect(state.currentCard).toMatchObject({ type: "test", item: B });
    state = apply(state, correct);

    // Turn 11 — Test(C) -> finished
    expect(state.turn).toBe(11);
    expect(state.currentCard).toMatchObject({ type: "test", item: C });
    state = apply(state, correct);

    // Turn 12 — Test(D) -> finished, block done
    expect(state.turn).toBe(12);
    expect(state.currentCard).toMatchObject({ type: "test", item: D });
    state = apply(state, correct);

    // Summary — 4 info cards, 8 test cards, 0 fillers, all correct
    expect(state.turn).toBe(12);
    expect(state.currentCard).toEqual({
      type: "summary",
      stats: { testCards: 8, fillerCards: 0, correct: 8, wrong: 0, testCorrect: 8 },
    });
  });
});

describe("§9.3 — the two deep fallbacks (4b(iii) and 4b(iv))", () => {
  it("reproduces the scripted 7-turn trace exactly", () => {
    // BATCH_SIZE=1, GRADUATE=2, GAP=1, INTRO_CHUNK=2. A,B at order 0,1 (ids
    // 201,301). Each question is its own block: block 0 = {A}, block 1 =
    // {B}. The intro chunk is cut short to a single card in each block.
    const A = makeItem(201);
    const B = makeItem(301);
    let state = init([A, B], { BATCH_SIZE: 1, GRADUATE: 2, GAP: 1, INTRO_CHUNK: 2 });

    // Turn 1 — Info(A): pendingIntro 2 -> 1
    expect(state.currentCard).toEqual({ type: "info", item: A });
    state = apply(state, CONTINUE);

    // Turn 2 — Test(A): step 3b finds nothing waiting -> pendingIntro = 0.
    // A never tested, so it's eligible despite pendingIntro having been
    // mid-chunk a moment ago.
    expect(state.turn).toBe(2);
    expect(state.currentCard).toMatchObject({ type: "test", item: A });
    state = apply(state, correct);

    // Turn 3 — Test(A) again: 3-2=1 doesn't clear the gap; nothing waiting,
    // nothing finished -> 4b(iv) re-tests anyway. A finishes; block advances.
    expect(state.turn).toBe(3);
    expect(state.currentCard).toMatchObject({ type: "test", item: A });
    state = apply(state, correct);
    expect(state.currentBlock).toBe(1);

    // Turn 4 — Info(B)
    expect(state.turn).toBe(4);
    expect(state.currentCard).toEqual({ type: "info", item: B });
    state = apply(state, CONTINUE);

    // Turn 5 — Test(B): never tested -> eligible immediately
    expect(state.turn).toBe(5);
    expect(state.currentCard).toMatchObject({ type: "test", item: B });
    state = apply(state, correct);

    // Turn 6 — Filler(A): 6-5=1 doesn't clear the gap; block 1 has nothing
    // waiting and nothing finished of its own -> 4b(iii) borrows A from the
    // start of the lesson.
    expect(state.turn).toBe(6);
    expect(state.currentCard).toMatchObject({ type: "filler", item: A });
    state = apply(state, correct);

    // Turn 7 — Test(B): 7-5=2 > GAP -> B score 2 -> finished
    expect(state.turn).toBe(7);
    expect(state.currentCard).toMatchObject({ type: "test", item: B });
    state = apply(state, correct);

    // Summary — 2 info cards, 4 test cards, 1 filler, all correct
    expect(state.turn).toBe(7);
    expect(state.currentCard).toEqual({
      type: "summary",
      // 5 correct answers overall, but only 4 of them on test cards.
      stats: { testCards: 4, fillerCards: 1, correct: 5, wrong: 0, testCorrect: 4 },
    });
  });
});

describe("edge cases (§8)", () => {
  it("initializes an empty payload directly to a zero-stat SummaryCard", () => {
    const state = init([], { BATCH_SIZE: 6, GRADUATE: 3, GAP: 2, INTRO_CHUNK: 2 });
    expect(state.turn).toBe(0);
    expect(state.currentCard).toEqual({
      type: "summary",
      stats: { testCards: 0, fillerCards: 0, correct: 0, wrong: 0, testCorrect: 0 },
    });
  });

  it("endSession jumps straight to the summary with whatever stats exist so far", () => {
    const A = makeItem(1);
    const B = makeItem(2);
    let state = init([A, B], { BATCH_SIZE: 6, GRADUATE: 3, GAP: 2, INTRO_CHUNK: 2 });
    state = apply(state, CONTINUE); // Info(A) -> Info(B)
    state = apply(state, CONTINUE); // Info(B) -> Test(A)
    state = apply(state, correct); // Test(A) correct

    const ended = endSession(state);
    expect(ended.currentCard.type).toBe("summary");
    if (ended.currentCard.type === "summary") {
      expect(ended.currentCard.stats).toEqual({
        testCards: 1,
        fillerCards: 0,
        correct: 1,
        wrong: 0,
        testCorrect: 1,
      });
    }
  });
});

describe("getBlockProgress", () => {
  it("lists every question in the current block with its waiting/studying/done status", () => {
    const [A, B, C] = [1, 2, 3].map(makeItem);
    let state = init([A, B, C], { BATCH_SIZE: 3, GRADUATE: 2, GAP: 2, INTRO_CHUNK: 1 });

    // At Info(A): seen flips true the moment a question's info card is
    // produced (§5 step 3b marks it seen and shows the card together), so
    // A already reads "studying", not "waiting" — only B/C, never
    // introduced yet, are "waiting".
    expect(getBlockProgress(state)).toEqual({
      blockNumber: 1,
      totalBlocks: 1,
      items: [
        { index: 1, item: A, status: "studying", isCurrent: true },
        { index: 2, item: B, status: "waiting", isCurrent: false },
        { index: 3, item: C, status: "waiting", isCurrent: false },
      ],
    });

    state = apply(state, CONTINUE); // Info(A) -> Test(A)
    expect(state.currentCard).toMatchObject({ type: "test", item: A });
    // Answer A correct once (score 1 of GRADUATE=2, still studying) to
    // exercise the "studying" status distinctly from "waiting" and "done".
    state = apply(state, correct);

    const progress = getBlockProgress(state);
    expect(progress.items.find((it) => it.item.questionId === A.questionId)?.status).toBe("studying");
  });

  it("moves on to the next block once the current one finishes", () => {
    const [A, B] = [1, 2].map(makeItem);
    let state = init([A, B], { BATCH_SIZE: 1, GRADUATE: 1, GAP: 1, INTRO_CHUNK: 1 });

    state = apply(state, CONTINUE); // Info(A) -> Test(A)
    state = apply(state, correct); // A finishes, block advances to 1 -> Info(B)

    const progress = getBlockProgress(state);
    expect(progress.blockNumber).toBe(2);
    expect(progress.totalBlocks).toBe(2);
    // B's own info card is showing, so it's already "studying" too.
    expect(progress.items).toEqual([{ index: 1, item: B, status: "studying", isCurrent: true }]);
  });
});

describe("§6.3 — the form escalates with the score", () => {
  // One question, alone in its block, so every test card is about it and the
  // GAP rule can never divert to something else.
  const soloConfig: SessionConfig = { BATCH_SIZE: 1, GRADUATE: 3, GAP: 0, INTRO_CHUNK: 1 };

  const formOf = (state: SessionState) => {
    if (state.currentCard.type !== "test" && state.currentCard.type !== "filler") {
      throw new Error(`expected a test/filler card, got ${state.currentCard.type}`);
    }
    return state.currentCard.form.questionType;
  };

  it("shows MCQ at score 0 and 1, then fill-in-the-blank at score 2", () => {
    const A = makeItem(201);
    let state = init([A], soloConfig);

    state = apply(state, CONTINUE); // past Info(A)

    expect(formOf(state)).toBe("MultipleChoiceQuestion"); // score 0
    state = apply(state, correct);

    expect(formOf(state)).toBe("MultipleChoiceQuestion"); // score 1
    state = apply(state, correct);

    // score 2 — the graduation gate
    expect(formOf(state)).toBe("FillInTheBlankQuestion");
    state = apply(state, correct);

    // score 3 -> done -> nothing left in the lesson
    expect(state.currentCard.type).toBe("summary");
  });

  it("drops to score 1 on a wrong fill-in-the-blank, so the next test is MCQ again", () => {
    const A = makeItem(202);
    let state = init([A], soloConfig);

    state = apply(state, CONTINUE);
    state = apply(state, correct); // score 1
    state = apply(state, correct); // score 2

    expect(formOf(state)).toBe("FillInTheBlankQuestion");
    state = apply(state, wrong); // 2 - 1 = 1, and flagged for re-teach

    // A wrong answer always re-teaches first.
    expect(state.currentCard).toEqual({ type: "info", item: A });
    state = apply(state, CONTINUE);

    // Back at score 1, so multiple choice — it has to climb to 2 again
    // before earning another attempt at the gate.
    expect(formOf(state)).toBe("MultipleChoiceQuestion");
    state = apply(state, correct); // score 2

    expect(formOf(state)).toBe("FillInTheBlankQuestion");
  });

  it("falls back to the only form a question has", () => {
    const mcqOnly: SessionItemPayload = { ...makeItem(203), fib: null };
    let state = init([mcqOnly], soloConfig);

    state = apply(state, CONTINUE);
    state = apply(state, correct); // score 1
    state = apply(state, correct); // score 2 — would normally be FIB

    expect(formOf(state)).toBe("MultipleChoiceQuestion");
  });

  it("reviews finished questions as MCQ, not as the graduation gate", () => {
    // Two questions: A graduates, then B's GAP crunch pulls A back as filler.
    const [A, B] = [204, 205].map(makeItem);
    let state = init([A, B], { BATCH_SIZE: 2, GRADUATE: 3, GAP: 5, INTRO_CHUNK: 2 });

    state = apply(state, CONTINUE); // Info(A)
    state = apply(state, CONTINUE); // Info(B)

    // Drive A to done. GAP is wide, but 4b(iv) re-tests anyway while nothing
    // is finished yet, and A always wins the lowest-score tie-break.
    while (!state.questions[0].done) {
      state = apply(state, correct);
    }

    // B is still inside the wide GAP, so 4b(ii) reaches for finished A as a
    // filler. A sits at GRADUATE (3), not GRADUATE - 1, so it comes back as
    // the lighter MCQ rather than the graduation gate.
    expect(state.currentCard).toMatchObject({ type: "filler", item: A });
    expect(formOf(state)).toBe("MultipleChoiceQuestion");
  });
});
