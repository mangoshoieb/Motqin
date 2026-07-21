// Scripted-trace tests for the grouped pair-based session flow: pairs of
// PAIR_SIZE presented+tested in order within a GROUP_SIZE group, wrong
// answers deferred one pair-boundary later, leftover retries drained after
// the last pair, and group completion/advancing to the next group.
import { describe, expect, it } from "vitest";
import { apply, getGroupProgress, init } from "./session-algorithm";

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

describe("grouped pair-based session flow", () => {
  it("walks pairs in order, defers a wrong answer past the pair boundary, and advances to a smaller trailing group", () => {
    // 5 items, GROUP_SIZE=4/PAIR_SIZE=2 -> group 0 = [A,B,C,D] (2 pairs), group 1 = [E] (1 pair of 1)
    const [A, B, C, D, E] = [1, 2, 3, 4, 5].map(makeItem);
    let state = init([A, B, C, D, E], { GROUP_SIZE: 4, PAIR_SIZE: 2 });

    // Present(A), Present(B) — pair 0 introduced in order
    expect(state.currentCard).toEqual({ type: "presentation", item: A });
    state = apply(state, { type: "CONTINUE" });
    expect(state.currentCard).toEqual({ type: "presentation", item: B });
    state = apply(state, { type: "CONTINUE" });

    // Test(A) wrong -> feedback, deferred (not retried on the spot)
    expect(state.currentCard).toEqual({ type: "test", item: A });
    state = apply(state, { type: "ANSWER", correct: false, userAnswer: "wrong" });
    expect(state.currentCard).toEqual({ type: "feedback", item: A, correct: false });
    expect(state.retryQueue).toEqual([A]);

    // Test(B) correct — pair 0's tests continue in order, A is not retried yet
    state = apply(state, { type: "CONTINUE" });
    expect(state.currentCard).toEqual({ type: "test", item: B });
    state = apply(state, { type: "ANSWER", correct: true, userAnswer: "a" });
    expect(state.currentCard).toEqual({ type: "feedback", item: B, correct: true });

    // Pair 0's tests are done -> A's deferred retry surfaces now, mixed in
    // right after the pair boundary, before pair 1's presentations.
    state = apply(state, { type: "CONTINUE" });
    expect(state.currentCard).toEqual({ type: "presentation", item: A });
    state = apply(state, { type: "CONTINUE" });
    expect(state.currentCard).toEqual({ type: "test", item: A });
    state = apply(state, { type: "ANSWER", correct: true, userAnswer: "a" });
    expect(state.currentCard).toEqual({ type: "feedback", item: A, correct: true });

    // A's retry resolved -> on to pair 1 (C, D), both correct first try
    state = apply(state, { type: "CONTINUE" });
    expect(state.currentCard).toEqual({ type: "presentation", item: C });
    state = apply(state, { type: "CONTINUE" });
    expect(state.currentCard).toEqual({ type: "presentation", item: D });
    state = apply(state, { type: "CONTINUE" });
    expect(state.currentCard).toEqual({ type: "test", item: C });
    state = apply(state, { type: "ANSWER", correct: true, userAnswer: "a" });
    state = apply(state, { type: "CONTINUE" });
    expect(state.currentCard).toEqual({ type: "test", item: D });
    state = apply(state, { type: "ANSWER", correct: true, userAnswer: "a" });

    // Group 0 complete: A needed a retry (1 wrong attempt), B/C/D correct
    // first try -> firstTryCorrectCount=3, totalWrongAttempts=1.
    state = apply(state, { type: "CONTINUE" });
    expect(state.currentCard.type).toBe("group-complete");
    if (state.currentCard.type === "group-complete") {
      expect(state.currentCard.stats).toEqual({
        groupIndex: 0,
        itemCount: 4,
        firstTryCorrectCount: 3,
        totalWrongAttempts: 1,
        accuracy: 0.75,
      });
      expect(state.currentCard.hasMoreGroups).toBe(true);
    }

    // Advance to the trailing group of 1 (E) — chunking handles the remainder.
    state = apply(state, { type: "CONTINUE_TO_NEXT_GROUP" });
    expect(state.currentCard).toEqual({ type: "presentation", item: E });
    state = apply(state, { type: "CONTINUE" });
    expect(state.currentCard).toEqual({ type: "test", item: E });
    state = apply(state, { type: "ANSWER", correct: true, userAnswer: "a" });
    state = apply(state, { type: "CONTINUE" });

    expect(state.currentCard.type).toBe("group-complete");
    if (state.currentCard.type === "group-complete") {
      expect(state.currentCard.stats).toEqual({
        groupIndex: 1,
        itemCount: 1,
        firstTryCorrectCount: 1,
        totalWrongAttempts: 0,
        accuracy: 1,
      });
      // No group 2 exists — this was the last one.
      expect(state.currentCard.hasMoreGroups).toBe(false);
    }
  });

  it("drains leftover retries one at a time once no new pairs remain", () => {
    // A single pair-of-2 group where BOTH items go wrong the first time:
    // only one gets its retry slot right after the pair, the other has to
    // wait for the drain phase since there's no next pair to interleave with.
    const [F, G] = [10, 11].map(makeItem);
    let state = init([F, G], { GROUP_SIZE: 2, PAIR_SIZE: 2 });

    state = apply(state, { type: "CONTINUE" }); // Present(F) -> Present(G)
    state = apply(state, { type: "CONTINUE" }); // -> Test(F)
    expect(state.currentCard).toEqual({ type: "test", item: F });
    state = apply(state, { type: "ANSWER", correct: false, userAnswer: "wrong" });
    state = apply(state, { type: "CONTINUE" }); // -> Test(G)
    expect(state.currentCard).toEqual({ type: "test", item: G });
    state = apply(state, { type: "ANSWER", correct: false, userAnswer: "wrong" });
    expect(state.retryQueue).toEqual([F, G]);

    // Pair's tests done -> F (FIFO order) gets the one retry-boundary slot
    state = apply(state, { type: "CONTINUE" });
    expect(state.currentCard).toEqual({ type: "presentation", item: F });
    state = apply(state, { type: "CONTINUE" });
    expect(state.currentCard).toEqual({ type: "test", item: F });
    state = apply(state, { type: "ANSWER", correct: true, userAnswer: "a" });

    // No next pair exists — G, still queued, is drained next.
    state = apply(state, { type: "CONTINUE" });
    expect(state.currentCard).toEqual({ type: "presentation", item: G });
    state = apply(state, { type: "CONTINUE" });
    expect(state.currentCard).toEqual({ type: "test", item: G });
    state = apply(state, { type: "ANSWER", correct: true, userAnswer: "a" });

    state = apply(state, { type: "CONTINUE" });
    expect(state.currentCard.type).toBe("group-complete");
    if (state.currentCard.type === "group-complete") {
      // Both F and G needed a retry -> neither counts as first-try-correct.
      expect(state.currentCard.stats).toEqual({
        groupIndex: 0,
        itemCount: 2,
        firstTryCorrectCount: 0,
        totalWrongAttempts: 2,
        accuracy: 0,
      });
      expect(state.currentCard.hasMoreGroups).toBe(false);
    }
  });

  it("initializes an empty payload directly to a zero-stat, no-more-groups GroupCompleteCard", () => {
    const state = init([], { GROUP_SIZE: 6, PAIR_SIZE: 2 });
    expect(state.currentCard).toEqual({
      type: "group-complete",
      stats: { groupIndex: 0, itemCount: 0, firstTryCorrectCount: 0, totalWrongAttempts: 0, accuracy: 0 },
      hasMoreGroups: false,
    });
  });
});

describe("getGroupProgress", () => {
  it("windows to just previous/current/next and marks a deferred retry distinctly", () => {
    // 4 items, GROUP_SIZE=4/PAIR_SIZE=2 -> one group, pairs [[A,B],[C,D]]
    const [A, B, C, D] = [1, 2, 3, 4].map(makeItem);
    let state = init([A, B, C, D], { GROUP_SIZE: 4, PAIR_SIZE: 2 });

    // At Present(A): only current + next exist (no previous) — window has 2 entries.
    let progress = getGroupProgress(state);
    expect(progress).toEqual({
      current: 1,
      total: 4,
      window: [
        { index: 1, item: A, status: "current" },
        { index: 2, item: B, status: "pending" },
      ],
    });

    state = apply(state, { type: "CONTINUE" }); // Present(B)
    state = apply(state, { type: "CONTINUE" }); // Test(A)
    state = apply(state, { type: "ANSWER", correct: false, userAnswer: "wrong" }); // Feedback(A, false)

    // A is now deferred (in the retry queue) — still "current" on its own
    // feedback card, since that's the row the student is looking at.
    progress = getGroupProgress(state);
    expect(progress.window).toEqual([{ index: 1, item: A, status: "current" }, { index: 2, item: B, status: "pending" }]);

    state = apply(state, { type: "CONTINUE" }); // Test(B)
    state = apply(state, { type: "ANSWER", correct: true, userAnswer: "a" }); // Feedback(B, true)
    state = apply(state, { type: "CONTINUE" }); // A's deferred retry surfaces -> Present(A)

    // A keeps its original group position (index 1) through the retry, so
    // the window is still current(A)/next(B) — B now shows "done".
    progress = getGroupProgress(state);
    expect(progress).toEqual({
      current: 1,
      total: 4,
      window: [
        { index: 1, item: A, status: "current" },
        { index: 2, item: B, status: "done" },
      ],
    });
  });
});
