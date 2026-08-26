"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { questionService } from "../services/question.service";
import { sessionReportingService } from "../services/session-reporting.service";
import { apply, checkAnswer, endSession, getBlockProgress, init } from "../lib/session-algorithm";
import { DEFAULT_SESSION_CONFIG } from "../constants/session.constants";

const FEEDBACK_FLASH_MS = 1500;

// The backend has no dedicated session-payload endpoint (confirmed against
// swagger — only /questions/by-lesson and /questions/by-category-and-lesson
// exist), so we fetch the lesson's Information rows and map them.
//
// One Information row carries both cards about the same fact, so it maps to
// ONE payload item holding both forms. The algorithm picks between them per
// showing, from the question's score (see formFor in session-algorithm.ts).
const toSessionItem = (info: LessonInformation): SessionItemPayload | null => {
  const mcq: SessionItemForm | null = info.mcqCard
    ? {
        questionType: "MultipleChoiceQuestion",
        questionText: info.mcqCard.text ?? "",
        // Comma-joined because QuizCard splits on commas. An option that
        // itself contains a comma would split wrongly — worth moving to
        // string[] at some point.
        answerOptions: (info.mcqCard.options ?? []).join(","),
        correctAnswer: info.mcqCard.correctAnswer ?? null,
        correctText: null,
        caseSensitive: null,
      }
    : null;

  const fib: SessionItemForm | null = info.fibCard
    ? {
        questionType: "FillInTheBlankQuestion",
        questionText: info.fibCard.text ?? "",
        answerOptions: null,
        correctAnswer: null,
        // The backend allows several accepted spellings; checkAnswer compares
        // one, so we take the first until it supports a list.
        correctText: info.fibCard.correctText?.[0] ?? null,
        // No caseSensitive field in the Information model — default to lenient.
        caseSensitive: false,
      }
    : null;

  // A row with neither card can never be tested — drop it.
  if (!mcq && !fib) return null;

  return {
    questionId: info.informationID,
    title: info.title ?? info.infoCard?.title ?? null,
    description: info.infoCard?.explanation ?? "",
    imageUrl: info.infoCard?.imageUrl ?? null,
    audioUrl: info.infoCard?.audioUrl ?? null,
    mcq,
    fib,
  };
};

// Drives the block/score-based flow (see app/lib/session-algorithm.ts, spec
// v2.1) for one lesson: fetches the question list, keeps the SessionState
// in React state, and reports to the backend exactly once, when the whole
// lesson's Summary is reached.
export const useLessonSession = (
  lessonId: string,
  filters?: { category?: string }
) => {
  const {
    data: questions,
    isLoading,
    error,
  } = useQuery<LessonInformation[]>({
    queryKey: ["lesson-information", "by-lesson", lessonId],
    queryFn: () => questionService.getInformationByLesson(lessonId),
    enabled: !!lessonId,
  });

  // The category arrives from the query string as Arabic text and must match
  // informationCategory exactly — no case folding, which does nothing in
  // Arabic anyway and only hid the mismatch before.
  const payload = questions
    ?.filter(
      (info) =>
        !filters?.category ||
        (info.informationCategory ?? "").trim() === filters.category.trim()
    )
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map(toSessionItem)
    .filter((item): item is SessionItemPayload => item !== null);

  const [state, setState] = useState<SessionState | null>(null);

  // Initialize (or re-initialize, if the question list identity changes —
  // e.g. filters changed) once the query resolves. Adjusting state during
  // render instead of in an effect, per React's rules on deriving state
  // from props.
  const [initializedFor, setInitializedFor] = useState<LessonInformation[] | undefined>(undefined);
  if (questions && questions !== initializedFor && payload) {
    setInitializedFor(questions);
    setState(init(payload, DEFAULT_SESSION_CONFIG));
  }

  // Non-blocking "correct/wrong" flash — a UI-only overlay, not a real card
  // in the algorithm, so re-teach/next-block transitions stay immediate.
  const [feedback, setFeedback] = useState<{ correct: boolean } | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  // Guards against reporting completion twice (e.g. React strict mode's
  // double-invoke in dev, or an unrelated re-render).
  const reportedRef = useRef(false);

  useEffect(() => {
    if (!state || state.currentCard.type !== "summary") return;
    if (reportedRef.current) return;
    reportedRef.current = true;
    sessionReportingService.reportSessionCompletion(lessonId, state.currentCard.stats);
  }, [state, lessonId]);

  const continueCard = () => {
    setState((prev) => (prev ? apply(prev, { type: "CONTINUE" }) : prev));
  };

  const submitAnswer = (userAnswer: string) => {
    setState((prev) => {
      if (!prev || (prev.currentCard.type !== "test" && prev.currentCard.type !== "filler")) return prev;

      // Grade against the form on the card, not the item — the same question
      // is an MCQ at score 0-1 and a fill-in-the-blank at score 2.
      const correct = checkAnswer(prev.currentCard.form, userAnswer);

      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      setFeedback({ correct });
      feedbackTimerRef.current = setTimeout(() => setFeedback(null), FEEDBACK_FLASH_MS);

      return apply(prev, { type: "ANSWER", correct, userAnswer });
    });
  };

  const endSessionNow = () => {
    setState((prev) => (prev ? endSession(prev) : prev));
  };

  return {
    isLoading,
    error,
    currentCard: state?.currentCard ?? null,
    blockProgress: state ? getBlockProgress(state) : null,
    feedback,
    continueCard,
    submitAnswer,
    endSession: endSessionNow,
  };
};
