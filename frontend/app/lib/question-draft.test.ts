import { describe, expect, it } from "vitest";
import {
  aiQuestionToDraft,
  emptyQuestionDraft,
  hasDraftErrors,
  questionDraftToInput,
  validateQuestionDraft,
  type AiGeneratedQuestion,
} from "./question-draft";

// Smallest JPEG header — enough for the signature sniff; the JPEG path
// never decodes it.
const JPEG_BASE64 = "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8U";

const aiQuestion: AiGeneratedQuestion = {
  questionCategory: "أساسيات",
  displayOrder: 1,
  title: "Classical Physics",
  description: "Definition of Classical Physics.",
  explanation: "Classical Physics is described as being sufficient to explain all physical phenomena.",
  mcqText: "What is the definition of Classical Physics?",
  answerOptions: ["It is sufficient.", "It is a theory of particles.", "Least energy.", "Voltage."],
  correctAnswer: "It is sufficient.",
  pageNumber: 3,
  region: 0,
  imageBase64: JPEG_BASE64,
};

describe("aiQuestionToDraft", () => {
  it("fills every field from the response and picks the correct option", async () => {
    const draft = await aiQuestionToDraft(aiQuestion, 0);

    expect(draft.category).toBe("أساسيات");
    expect(draft.title).toBe("Classical Physics");
    expect(draft.description).toBe("Definition of Classical Physics.");
    expect(draft.mcqText).toBe("What is the definition of Classical Physics?");
    expect(draft.options).toHaveLength(4);
    expect(draft.correctIndex).toBe(0);
    expect(draft.withFib).toBe(false);
    expect(hasDraftErrors(validateQuestionDraft(draft))).toBe(false);
  });

  it("turns the base64 image into a .jpg JPEG file", async () => {
    const draft = await aiQuestionToDraft(aiQuestion, 4);

    expect(draft.image?.type).toBe("image/jpeg");
    expect(draft.image?.name).toBe("question-5.jpg");
  });

  it("leaves missing keys as empty fields and flags what's required", async () => {
    const draft = await aiQuestionToDraft({ title: "Only a title" }, 0);

    expect(draft.description).toBe("");
    expect(draft.options).toEqual(["", ""]);
    expect(draft.correctIndex).toBeNull();
    expect(draft.image).toBeNull();

    const errors = validateQuestionDraft(draft);
    expect(Object.keys(errors).sort()).toEqual(["description", "explanation", "mcqText", "options"]);
  });

  it("falls back to the first category for one it doesn't know", async () => {
    const draft = await aiQuestionToDraft({ ...aiQuestion, questionCategory: "Basics" }, 0);
    expect(draft.category).toBe("أساسيات");
  });

  it("opens the fill-in-the-blank card when the response has one", async () => {
    const draft = await aiQuestionToDraft(
      { ...aiQuestion, fibText: "Classical physics explains ____.", correctText: ["everything"] },
      0
    );

    expect(draft.withFib).toBe(true);
    expect(draft.correctTexts).toEqual(["everything"]);
  });

  it("leaves the correct answer unset when it matches no option", async () => {
    const draft = await aiQuestionToDraft({ ...aiQuestion, correctAnswer: "Something else" }, 0);
    expect(draft.correctIndex).toBeNull();
    expect(validateQuestionDraft(draft).options).toBeDefined();
  });
});

describe("validateQuestionDraft", () => {
  const valid = {
    ...emptyQuestionDraft("أساسيات"),
    description: "d",
    explanation: "e",
    mcqText: "q",
    options: ["a", "b", ""],
    correctIndex: 1,
  };

  it("accepts a complete MCQ question", () => {
    expect(validateQuestionDraft(valid)).toEqual({});
  });

  it("rejects duplicate options", () => {
    expect(validateQuestionDraft({ ...valid, options: ["a", "a"] }).options).toBeDefined();
  });

  it("requires the fill-in-the-blank fields only when that card is on", () => {
    expect(validateQuestionDraft({ ...valid, withFib: true })).toMatchObject({
      fibText: expect.any(String),
      correctTexts: expect.any(String),
    });
  });
});

describe("questionDraftToInput", () => {
  const draft = {
    ...emptyQuestionDraft("معلومات مهمة"),
    title: "  ",
    description: " d ",
    explanation: "e",
    mcqText: "q",
    options: ["a", " b ", ""],
    correctIndex: 1,
    fibText: "left over",
  };

  it("trims, drops empty options and sends the correct option's text", () => {
    const input = questionDraftToInput(draft, 7, 12);

    expect(input).toMatchObject({
      lessonID: 7,
      displayOrder: 12,
      questionCategory: "معلومات مهمة",
      title: undefined,
      description: "d",
      answerOptions: ["a", "b"],
      correctAnswer: "b",
    });
  });

  it("leaves the fill-in-the-blank fields out when that card is off", () => {
    const input = questionDraftToInput(draft, 7, 12);
    expect(input.fibText).toBeUndefined();
    expect(input.correctText).toBeUndefined();
  });
});
