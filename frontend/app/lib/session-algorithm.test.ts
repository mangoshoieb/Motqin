// Conforms to Session Algorithm Spec v3 + flowchart v2 (the mobile app's
// quiz_system SessionEngine) — conformance traces, ported as automated
// tests. Every implementation MUST reproduce these traces exactly.
import { describe, expect, it } from "vitest";
import {
  SNAPSHOT_VERSION,
  apply,
  checkAnswer,
  endSession,
  getBlockProgress,
  getLessonProgress,
  init,
  restore,
  toSnapshot,
} from "./session-algorithm";

function makeItem(questionId: number, displayOrder: number): SessionItemPayload {
  return {
    questionId,
    displayOrder,
    title: `title-${questionId}`,
    description: "",
    imageUrl: null,
    audioUrl: null,
    mcq: {
      questionType: "MultipleChoiceQuestion",
      questionText: `mcq-${questionId}`,
      answerOptions: ["a", "b"],
      correctAnswer: "a",
      correctText: null,
    },
    fib: {
      questionType: "FillInTheBlankQuestion",
      questionText: `fib-${questionId}`,
      answerOptions: null,
      correctAnswer: null,
      correctText: ["a"],
    },
  };
}

// Items with ids 101, 102, ... at displayOrder 1, 2, ...
const makeItems = (count: number) => Array.from({ length: count }, (_, i) => makeItem(101 + i, i + 1));

const correct = { type: "ANSWER" as const, correct: true, userAnswer: "a" };
const wrong = { type: "ANSWER" as const, correct: false, userAnswer: "wrong" };
const CONTINUE = { type: "CONTINUE" as const };

const stats = (s: Partial<SessionStats>): SessionStats => ({
  testCards: 0,
  fillerCards: 0,
  correct: 0,
  wrong: 0,
  testCorrect: 0,
  ...s,
});

const formOf = (state: SessionState) => {
  if (state.currentCard.type !== "test" && state.currentCard.type !== "filler") {
    throw new Error(`expected a test/filler card, got ${state.currentCard.type}`);
  }
  return state.currentCard.form.questionType;
};

describe("trace 1 — pairs unlock, re-teach, one block", () => {
  it("reproduces the scripted 14-turn trace exactly", () => {
    // BATCH_SIZE=4, GRADUATE=2, GAP=1. A,B,C,D at displayOrder 1-4. One
    // block; A,B are pair 0, C,D pair 1 (unlocks once A and B reach 1).
    const [A, B, C, D] = makeItems(4);
    let state = init([A, B, C, D], { BATCH_SIZE: 4, GRADUATE: 2, GAP: 1 });

    // Turn 1 — Info(A)
    expect(state.currentCard).toEqual({ type: "info", item: A });
    state = apply(state, CONTINUE);

    // Turn 2 — Info(B). C is next in line but pair 1 is still locked.
    expect(state.turn).toBe(2);
    expect(state.currentCard).toEqual({ type: "info", item: B });
    state = apply(state, CONTINUE);

    // Turn 3 — Test(A): 3-1=2 > GAP; B (3-2=1) is not
    expect(state.turn).toBe(3);
    expect(state.currentCard).toMatchObject({ type: "test", item: A });
    expect(formOf(state)).toBe("MultipleChoiceQuestion");
    state = apply(state, correct); // A = 1

    // Turn 4 — Test(B): pair 1 still locked, B at 0
    expect(state.turn).toBe(4);
    expect(state.currentCard).toMatchObject({ type: "test", item: B });
    state = apply(state, correct); // B = 1

    // Turn 5 — Info(C): A and B both at 1 -> pair 1 unlocks
    expect(state.turn).toBe(5);
    expect(state.currentCard).toEqual({ type: "info", item: C });
    state = apply(state, CONTINUE);

    // Turn 6 — Info(D)
    expect(state.turn).toBe(6);
    expect(state.currentCard).toEqual({ type: "info", item: D });
    state = apply(state, CONTINUE);

    // Turn 7 — Test(C): lowest score among A, B, C (D is inside the gap)
    expect(state.turn).toBe(7);
    expect(state.currentCard).toMatchObject({ type: "test", item: C });
    state = apply(state, correct); // C = 1

    // Turn 8 — Test(D), Wrong -> stays 0, flagged for re-teach
    expect(state.turn).toBe(8);
    expect(state.currentCard).toMatchObject({ type: "test", item: D });
    state = apply(state, wrong);

    // Turn 9 — Info(D): re-teach
    expect(state.turn).toBe(9);
    expect(state.currentCard).toEqual({ type: "info", item: D });
    state = apply(state, CONTINUE);

    // Turn 10 — Test(A): A, B, C tie at 1, A shown longest ago -> finished
    expect(state.turn).toBe(10);
    expect(state.currentCard).toMatchObject({ type: "test", item: A });
    state = apply(state, correct);

    // Turn 11 — Test(D): 11-9=2 > GAP, lowest score
    expect(state.turn).toBe(11);
    expect(state.currentCard).toMatchObject({ type: "test", item: D });
    state = apply(state, correct); // D = 1

    // Turn 12 — Test(B) -> finished
    expect(state.turn).toBe(12);
    expect(state.currentCard).toMatchObject({ type: "test", item: B });
    state = apply(state, correct);

    // Turn 13 — Test(C) -> finished
    expect(state.turn).toBe(13);
    expect(state.currentCard).toMatchObject({ type: "test", item: C });
    state = apply(state, correct);

    // Turn 14 — Test(D) -> finished
    expect(state.turn).toBe(14);
    expect(state.currentCard).toMatchObject({ type: "test", item: D });
    state = apply(state, correct);

    // The only block is done -> the final summary. Summaries use no turn.
    const total = stats({ testCards: 9, correct: 8, wrong: 1, testCorrect: 8 });
    expect(state.turn).toBe(14);
    expect(state.currentCard).toEqual({
      type: "summary",
      isLastBlock: true,
      blockNumber: 1,
      totalBlocks: 1,
      blockQuestionCount: 4,
      blockDoneCount: 4,
      blockStats: total,
      stats: total,
    });
  });
});

describe("trace 2 — block summary, fillers, wrong filler re-teaches", () => {
  // BATCH_SIZE=2, GRADUATE=2, GAP=2. A,B,C at displayOrder 1-3.
  // Blocks: block 0 = {A,B}, block 1 = {C}.
  const config: SessionConfig = { BATCH_SIZE: 2, GRADUATE: 2, GAP: 2 };
  const script = [
    CONTINUE, // Info(A)
    CONTINUE, // Info(B)
    correct, // Test(A)
    correct, // Test(B)
    correct, // Test(A)
    wrong, // Filler(A)
    CONTINUE, // Info(A) re-teach
    correct, // Test(B)
    CONTINUE, // block 1 summary
    CONTINUE, // Info(C)
    correct, // Filler(A)
    correct, // Filler(A)
    correct, // Test(C)
    correct, // Filler(A)
    correct, // Filler(A)
    correct, // Test(C)
  ];

  it("reproduces the scripted 15-turn trace exactly", () => {
    const [A, B, C] = makeItems(3);
    let state = init([A, B, C], config);

    // Turns 1-2 — Info(A), Info(B)
    expect(state.currentCard).toEqual({ type: "info", item: A });
    state = apply(state, CONTINUE);
    expect(state.currentCard).toEqual({ type: "info", item: B });
    state = apply(state, CONTINUE);

    // Turn 3 — Test(A): neither clears GAP=2, nothing finished -> 4b(iii)
    // re-tests the one shown longest ago
    expect(state.turn).toBe(3);
    expect(state.currentCard).toMatchObject({ type: "test", item: A });
    state = apply(state, correct);

    // Turn 4 — Test(B), same reason
    expect(state.turn).toBe(4);
    expect(state.currentCard).toMatchObject({ type: "test", item: B });
    state = apply(state, correct);

    // Turn 5 — Test(A) -> finished
    expect(state.turn).toBe(5);
    expect(state.currentCard).toMatchObject({ type: "test", item: A });
    state = apply(state, correct);

    // Turn 6 — Filler(A): B inside the gap -> 4b(i). Always an MCQ, even
    // though A's score would make a test card a fill-in-the-blank.
    expect(state.turn).toBe(6);
    expect(state.currentCard).toMatchObject({ type: "filler", item: A });
    expect(formOf(state)).toBe("MultipleChoiceQuestion");
    state = apply(state, wrong);

    // Turn 7 — Info(A): a wrong review re-teaches too
    expect(state.turn).toBe(7);
    expect(state.currentCard).toEqual({ type: "info", item: A });
    state = apply(state, CONTINUE);

    // Turn 8 — Test(B): 8-4=4 > GAP -> finished
    expect(state.turn).toBe(8);
    expect(state.currentCard).toMatchObject({ type: "test", item: B });
    state = apply(state, correct);

    // Block 0 done -> its summary, not the next block's first card. A's
    // wrong review didn't touch its score or done.
    expect(state.turn).toBe(8);
    expect(state.questions[0]).toMatchObject({ done: true, score: 2 });
    const block1Stats = stats({ testCards: 4, fillerCards: 1, correct: 4, wrong: 1, testCorrect: 4 });
    expect(state.currentCard).toEqual({
      type: "summary",
      isLastBlock: false,
      blockNumber: 1,
      totalBlocks: 2,
      blockQuestionCount: 2,
      blockDoneCount: 2,
      blockStats: block1Stats,
      stats: block1Stats,
    });
    state = apply(state, CONTINUE);

    // Turn 9 — Info(C): block 1 opens
    expect(state.turn).toBe(9);
    expect(state.currentBlock).toBe(1);
    expect(state.currentCard).toEqual({ type: "info", item: C });
    state = apply(state, CONTINUE);

    // Turns 10-11 — Filler(A): C inside the gap, block 1 has nothing
    // finished -> 4b(ii) reviews the start of the lesson
    for (const T of [10, 11]) {
      expect(state.turn).toBe(T);
      expect(state.currentCard).toMatchObject({ type: "filler", item: A });
      state = apply(state, correct);
    }

    // Turn 12 — Test(C): 12-9=3 > GAP
    expect(state.turn).toBe(12);
    expect(state.currentCard).toMatchObject({ type: "test", item: C });
    state = apply(state, correct);

    // Turns 13-14 — Filler(A)
    for (const T of [13, 14]) {
      expect(state.turn).toBe(T);
      expect(state.currentCard).toMatchObject({ type: "filler", item: A });
      state = apply(state, correct);
    }

    // Turn 15 — Test(C) -> finished
    expect(state.turn).toBe(15);
    expect(state.currentCard).toMatchObject({ type: "test", item: C });
    state = apply(state, correct);

    // Last block done -> the final summary, block counters reset for it
    expect(state.turn).toBe(15);
    expect(state.currentCard).toEqual({
      type: "summary",
      isLastBlock: true,
      blockNumber: 2,
      totalBlocks: 2,
      blockQuestionCount: 1,
      blockDoneCount: 1,
      blockStats: stats({ testCards: 2, fillerCards: 4, correct: 6, testCorrect: 2 }),
      stats: stats({ testCards: 6, fillerCards: 5, correct: 10, wrong: 1, testCorrect: 6 }),
    });
  });

  it("resumes on the exact card it was saved on and continues identically", () => {
    const payload = makeItems(3);

    // Uninterrupted run.
    let straight = init(payload, config);
    for (const event of script) straight = apply(straight, event);
    expect(straight.currentCard).toMatchObject({ type: "summary", isLastBlock: true });

    // Same run, saved and restored (through JSON, as localStorage would)
    // before every single step — the block summary included.
    let resumed = init(payload, config);
    for (const event of script) {
      const saved = JSON.parse(JSON.stringify(toSnapshot(resumed)));
      const restored = restore(payload, config, saved);
      expect(restored).not.toBeNull();
      expect(restored!.currentCard).toEqual(resumed.currentCard);
      resumed = apply(restored!, event);
    }

    expect(resumed).toEqual(straight);
    // Nothing is left to resume once the final summary is reached.
    expect(toSnapshot(resumed)).toBeNull();
  });
});

describe("§3 pairs", () => {
  it("opens pair 2 only once pair 0 reaches 2 and pair 1 reaches 1", () => {
    // BATCH_SIZE=6: A,B pair 0; C,D pair 1; E,F pair 2.
    const items = makeItems(6);
    const [A, B, C, D, E] = items;
    let state = init(items, { BATCH_SIZE: 6, GRADUATE: 3, GAP: 0 });

    const introduced: number[] = [];
    while (state.currentCard.type !== "summary") {
      const card = state.currentCard;
      if (card.type === "info" && !introduced.includes(card.item.questionId)) {
        introduced.push(card.item.questionId);

        const score = (item: SessionItemPayload) =>
          state.questions[state.payload.indexOf(item)].score;
        if (card.item === C) {
          expect([A, B].map(score).every((s) => s >= 1)).toBe(true);
        }
        if (card.item === E) {
          expect([A, B].map(score).every((s) => s >= 2)).toBe(true);
          expect([C, D].map(score).every((s) => s >= 1)).toBe(true);
        }
      }
      state = apply(state, card.type === "info" ? CONTINUE : correct);
    }

    // Everyone got introduced, in displayOrder.
    expect(introduced).toEqual([101, 102, 103, 104, 105, 106]);
  });

  it("places questions by displayOrder, whatever order they arrive in", () => {
    const [A, B] = makeItems(2);
    const state = init([B, A], { BATCH_SIZE: 6, GRADUATE: 3, GAP: 2 });
    expect(state.currentCard).toEqual({ type: "info", item: A });
  });

  it("steps over a block that a gap in displayOrder left empty", () => {
    // BATCH_SIZE=2: block 0 = {1,2}, blocks 1-2 empty, block 3 = {7,8}.
    const items = [makeItem(1, 1), makeItem(2, 2), makeItem(7, 7), makeItem(8, 8)];
    let state = init(items, { BATCH_SIZE: 2, GRADUATE: 1, GAP: 0 });

    while (state.currentCard.type !== "summary") {
      state = apply(state, state.currentCard.type === "info" ? CONTINUE : correct);
    }
    expect(state.currentCard).toMatchObject({ isLastBlock: false, blockNumber: 1, totalBlocks: 4 });

    state = apply(state, CONTINUE);
    expect(state.currentCard).toEqual({ type: "info", item: items[2] });
    expect(getBlockProgress(state).blockNumber).toBe(4);
  });
});

describe("edge cases (§8)", () => {
  it("initializes an empty payload directly to a zero-stat final SummaryCard", () => {
    const state = init([], { BATCH_SIZE: 6, GRADUATE: 3, GAP: 2 });
    expect(state.turn).toBe(0);
    expect(state.currentCard).toEqual({
      type: "summary",
      isLastBlock: true,
      blockNumber: 0,
      totalBlocks: 0,
      blockQuestionCount: 0,
      blockDoneCount: 0,
      blockStats: stats({}),
      stats: stats({}),
    });
  });

  it("endSession jumps straight to the final summary with whatever stats exist so far", () => {
    const [A, B] = makeItems(2);
    let state = init([A, B], { BATCH_SIZE: 6, GRADUATE: 3, GAP: 2 });
    state = apply(state, CONTINUE); // Info(A) -> Info(B)
    state = apply(state, CONTINUE); // Info(B) -> Test(A) (4b(iii))
    state = apply(state, correct); // Test(A) correct

    const ended = endSession(state);
    expect(ended.currentCard).toMatchObject({
      type: "summary",
      isLastBlock: true,
      stats: stats({ testCards: 1, correct: 1, testCorrect: 1 }),
    });
    expect(toSnapshot(ended)).toBeNull();
  });

  it("CONTINUE is refused on the final summary", () => {
    const state = endSession(init(makeItems(1), { BATCH_SIZE: 6, GRADUATE: 3, GAP: 2 }));
    expect(() => apply(state, CONTINUE)).toThrow();
  });
});

describe("§8 restore", () => {
  const config: SessionConfig = { BATCH_SIZE: 2, GRADUATE: 2, GAP: 1 };

  it("starts fresh when the lesson's questions changed since saving", () => {
    const payload = makeItems(2);
    const snapshot = toSnapshot(apply(init(payload, config), CONTINUE))!;

    expect(restore([makeItem(102, 1), makeItem(101, 2)], config, snapshot)).toBeNull();
    expect(restore([...payload, makeItem(103, 3)], config, snapshot)).toBeNull();
  });

  it("starts fresh when the session was saved by another algorithm version", () => {
    const payload = makeItems(2);
    const snapshot = toSnapshot(init(payload, config))!;

    expect(restore(payload, config, { ...snapshot, version: SNAPSHOT_VERSION - 1 })).toBeNull();
  });
});

describe("getBlockProgress", () => {
  it("lists every question in the current block with its waiting/studying/done status", () => {
    // BATCH_SIZE=3: A,B pair 0, C pair 1.
    const [A, B, C] = makeItems(3);
    let state = init([A, B, C], { BATCH_SIZE: 3, GRADUATE: 2, GAP: 2 });

    // At Info(A): seen flips true the moment its info card is produced.
    expect(getBlockProgress(state)).toEqual({
      blockNumber: 1,
      totalBlocks: 1,
      items: [
        { index: 1, item: A, status: "studying", isCurrent: true },
        { index: 2, item: B, status: "waiting", isCurrent: false },
        { index: 3, item: C, status: "waiting", isCurrent: false },
      ],
    });

    state = apply(state, CONTINUE); // -> Info(B)
    state = apply(state, CONTINUE); // -> Test(A): C's pair is locked

    expect(state.currentCard).toMatchObject({ type: "test", item: A });
    expect(getBlockProgress(state).items.map((it) => it.status)).toEqual([
      "studying",
      "studying",
      "waiting",
    ]);
  });

  it("moves on to the next block after its summary", () => {
    const [A, B] = makeItems(2);
    let state = init([A, B], { BATCH_SIZE: 1, GRADUATE: 1, GAP: 1 });

    state = apply(state, CONTINUE); // Info(A) -> Test(A) (4b(iii))
    state = apply(state, correct); // A finishes -> block 1 summary
    expect(getBlockProgress(state).blockNumber).toBe(1);

    state = apply(state, CONTINUE); // -> Info(B)
    const progress = getBlockProgress(state);
    expect(progress.blockNumber).toBe(2);
    expect(progress.totalBlocks).toBe(2);
    expect(progress.items).toEqual([{ index: 1, item: B, status: "studying", isCurrent: true }]);
  });
});

describe("getLessonProgress", () => {
  it("counts finished questions across the whole lesson", () => {
    let state = init(makeItems(2), { BATCH_SIZE: 1, GRADUATE: 1, GAP: 1 });
    expect(getLessonProgress(state)).toEqual({ done: 0, total: 2 });

    state = apply(state, CONTINUE); // -> Test(A)
    state = apply(state, correct); // A finished
    expect(getLessonProgress(state)).toEqual({ done: 1, total: 2 });
  });
});

describe("§6.1 — the form escalates with the score", () => {
  // One question, alone in its block, so every test card is about it and the
  // GAP rule can never divert to something else.
  const soloConfig: SessionConfig = { BATCH_SIZE: 1, GRADUATE: 3, GAP: 0 };

  it("shows MCQ at score 0 and 1, then fill-in-the-blank at score 2", () => {
    let state = init(makeItems(1), soloConfig);
    state = apply(state, CONTINUE); // past Info(A)

    expect(formOf(state)).toBe("MultipleChoiceQuestion"); // score 0
    state = apply(state, correct);

    expect(formOf(state)).toBe("MultipleChoiceQuestion"); // score 1
    state = apply(state, correct);

    expect(formOf(state)).toBe("FillInTheBlankQuestion"); // score 2
    state = apply(state, correct);

    // score 3 -> done -> the lesson's only block is finished
    expect(state.currentCard).toMatchObject({ type: "summary", isLastBlock: true });
  });

  it("drops to score 1 on a wrong fill-in-the-blank, so the next test is MCQ again", () => {
    const [A] = makeItems(1);
    let state = init([A], soloConfig);

    state = apply(state, CONTINUE);
    state = apply(state, correct); // score 1
    state = apply(state, correct); // score 2

    expect(formOf(state)).toBe("FillInTheBlankQuestion");
    state = apply(state, wrong); // 2 - 1 = 1, and flagged for re-teach

    expect(state.currentCard).toEqual({ type: "info", item: A });
    state = apply(state, CONTINUE);

    expect(formOf(state)).toBe("MultipleChoiceQuestion");
    state = apply(state, correct); // score 2

    expect(formOf(state)).toBe("FillInTheBlankQuestion");
  });

  it("stays MCQ for a question with no fill-in-the-blank card", () => {
    const mcqOnly: SessionItemPayload = { ...makeItem(203, 1), fib: null };
    let state = init([mcqOnly], soloConfig);

    state = apply(state, CONTINUE);
    state = apply(state, correct); // score 1
    state = apply(state, correct); // score 2 — would normally be FIB

    expect(formOf(state)).toBe("MultipleChoiceQuestion");
  });
});

describe("§6.2 — checkAnswer", () => {
  const [A] = makeItems(1);

  it("matches an MCQ after trimming and collapsing spaces", () => {
    const mcq = { ...A.mcq!, correctAnswer: "القاهرة  مصر" };
    expect(checkAnswer(mcq, "  القاهرة مصر ")).toBe(true);
    expect(checkAnswer(mcq, "الجيزة")).toBe(false);
  });

  it("accepts any listed wording of a blank, without case folding", () => {
    const fib = { ...A.fib!, correctText: ["Photosynthesis", "التمثيل الضوئي"] };
    expect(checkAnswer(fib, "التمثيل   الضوئي")).toBe(true);
    expect(checkAnswer(fib, " Photosynthesis ")).toBe(true);
    expect(checkAnswer(fib, "photosynthesis")).toBe(false);
  });
});
