// Conforms to Session Algorithm Spec v3.0 — §9 conformance tests, ported as
// automated tests. Every implementation MUST reproduce these traces exactly.
import { describe, expect, it } from "vitest";
import { apply, endSession, getBlockProgress, init } from "./session-algorithm";

function makeItem(questionId: number): SessionItemPayload {
  return {
    questionId,
    questionType: "MultipleChoiceQuestion",
    title: `title-${questionId}`,
    description: "",
    imageUrl: null,
    audioUrl: null,
    questionText: `question-${questionId}`,
    answerOptions: "a,b",
    correctAnswer: "a",
    correctText: null,
    caseSensitive: null,
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
    expect(state.currentCard).toEqual({ type: "test", item: A });
    state = apply(state, correct);

    // Turn 4 — Test(B): A is inside the gap, B has never been tested
    expect(state.turn).toBe(4);
    expect(state.currentCard).toEqual({ type: "test", item: B });
    state = apply(state, correct);

    // Turn 5 — Test(A): 5-3=2 > GAP -> A score 2 -> finished
    expect(state.turn).toBe(5);
    expect(state.currentCard).toEqual({ type: "test", item: A });
    state = apply(state, correct);

    // Turn 6 — Test(B), Wrong -> B score 0, flagged for re-teach
    expect(state.turn).toBe(6);
    expect(state.currentCard).toEqual({ type: "test", item: B });
    state = apply(state, wrong);

    // Turn 7 — Info(B): flag cleared; B's lastShown stays 6 (info doesn't touch it)
    expect(state.turn).toBe(7);
    expect(state.currentCard).toEqual({ type: "info", item: B });
    state = apply(state, CONTINUE);

    // Turn 8 — Test(B): 8-6=2 > GAP (measured from turn 6, NOT 7 — the
    // v3.0 difference from v2.1, where this turn was a filler instead).
    expect(state.turn).toBe(8);
    expect(state.currentCard).toEqual({ type: "test", item: B });
    state = apply(state, correct);

    // Turn 9 — Filler(A): B is inside the gap, nothing waiting in block 0 -> 4b(ii)
    expect(state.turn).toBe(9);
    expect(state.currentCard).toEqual({ type: "filler", item: A });
    state = apply(state, correct);

    // Turn 10 — Test(B): 10-8=2 > GAP -> B score 2 -> finished
    expect(state.turn).toBe(10);
    expect(state.currentCard).toEqual({ type: "test", item: B });
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
    expect(state.currentCard).toEqual({ type: "test", item: C });
    state = apply(state, correct);

    // Turn 14 — Test(D)
    expect(state.turn).toBe(14);
    expect(state.currentCard).toEqual({ type: "test", item: D });
    state = apply(state, correct);

    // Turn 15 — Test(C) -> finished
    expect(state.turn).toBe(15);
    expect(state.currentCard).toEqual({ type: "test", item: C });
    state = apply(state, correct);

    // Turn 16 — Test(D) -> finished
    expect(state.turn).toBe(16);
    expect(state.currentCard).toEqual({ type: "test", item: D });
    state = apply(state, correct);

    // Summary — 5 info cards, 10 test cards, 1 filler; 10 correct, 1 wrong
    expect(state.turn).toBe(16);
    expect(state.currentCard).toEqual({
      type: "summary",
      stats: { testCards: 10, fillerCards: 1, correct: 10, wrong: 1 },
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
    expect(state.currentCard).toEqual({ type: "test", item: A });
    state = apply(state, correct);

    // Turn 4 — Test(B)
    expect(state.turn).toBe(4);
    expect(state.currentCard).toEqual({ type: "test", item: B });
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
    expect(state.currentCard).toEqual({ type: "test", item: C });
    state = apply(state, correct);

    // Turn 8 — Test(D)
    expect(state.turn).toBe(8);
    expect(state.currentCard).toEqual({ type: "test", item: D });
    state = apply(state, correct);

    // Turn 9 — Test(A): all four tie on score 1; A was tested longest ago -> finished
    expect(state.turn).toBe(9);
    expect(state.currentCard).toEqual({ type: "test", item: A });
    state = apply(state, correct);

    // Turn 10 — Test(B) -> finished
    expect(state.turn).toBe(10);
    expect(state.currentCard).toEqual({ type: "test", item: B });
    state = apply(state, correct);

    // Turn 11 — Test(C) -> finished
    expect(state.turn).toBe(11);
    expect(state.currentCard).toEqual({ type: "test", item: C });
    state = apply(state, correct);

    // Turn 12 — Test(D) -> finished, block done
    expect(state.turn).toBe(12);
    expect(state.currentCard).toEqual({ type: "test", item: D });
    state = apply(state, correct);

    // Summary — 4 info cards, 8 test cards, 0 fillers, all correct
    expect(state.turn).toBe(12);
    expect(state.currentCard).toEqual({
      type: "summary",
      stats: { testCards: 8, fillerCards: 0, correct: 8, wrong: 0 },
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
    expect(state.currentCard).toEqual({ type: "test", item: A });
    state = apply(state, correct);

    // Turn 3 — Test(A) again: 3-2=1 doesn't clear the gap; nothing waiting,
    // nothing finished -> 4b(iv) re-tests anyway. A finishes; block advances.
    expect(state.turn).toBe(3);
    expect(state.currentCard).toEqual({ type: "test", item: A });
    state = apply(state, correct);
    expect(state.currentBlock).toBe(1);

    // Turn 4 — Info(B)
    expect(state.turn).toBe(4);
    expect(state.currentCard).toEqual({ type: "info", item: B });
    state = apply(state, CONTINUE);

    // Turn 5 — Test(B): never tested -> eligible immediately
    expect(state.turn).toBe(5);
    expect(state.currentCard).toEqual({ type: "test", item: B });
    state = apply(state, correct);

    // Turn 6 — Filler(A): 6-5=1 doesn't clear the gap; block 1 has nothing
    // waiting and nothing finished of its own -> 4b(iii) borrows A from the
    // start of the lesson.
    expect(state.turn).toBe(6);
    expect(state.currentCard).toEqual({ type: "filler", item: A });
    state = apply(state, correct);

    // Turn 7 — Test(B): 7-5=2 > GAP -> B score 2 -> finished
    expect(state.turn).toBe(7);
    expect(state.currentCard).toEqual({ type: "test", item: B });
    state = apply(state, correct);

    // Summary — 2 info cards, 4 test cards, 1 filler, all correct
    expect(state.turn).toBe(7);
    expect(state.currentCard).toEqual({
      type: "summary",
      stats: { testCards: 4, fillerCards: 1, correct: 5, wrong: 0 },
    });
  });
});

describe("edge cases (§8)", () => {
  it("initializes an empty payload directly to a zero-stat SummaryCard", () => {
    const state = init([], { BATCH_SIZE: 6, GRADUATE: 3, GAP: 2, INTRO_CHUNK: 2 });
    expect(state.turn).toBe(0);
    expect(state.currentCard).toEqual({
      type: "summary",
      stats: { testCards: 0, fillerCards: 0, correct: 0, wrong: 0 },
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
      expect(ended.currentCard.stats).toEqual({ testCards: 1, fillerCards: 0, correct: 1, wrong: 0 });
    }
  });
});

describe("getBlockProgress", () => {
  it("windows to just previous/current/next within the current block", () => {
    const [A, B] = [1, 2].map(makeItem);
    const state = init([A, B], { BATCH_SIZE: 3, GRADUATE: 3, GAP: 2, INTRO_CHUNK: 1 });

    // At Info(A): only current + next exist (no previous).
    expect(getBlockProgress(state)).toEqual({
      current: 1,
      total: 2,
      window: [
        { index: 1, item: A, status: "current" },
        { index: 2, item: B, status: "pending" },
      ],
    });
  });
});
