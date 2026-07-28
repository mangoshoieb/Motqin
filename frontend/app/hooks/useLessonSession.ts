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
// exist). QuestionReadDto carries the same fields as SessionItemPayload
// under different casing, so we fetch the existing list and map it.
const toSessionItem = (q: Question): SessionItemPayload => ({
  questionId: q.questionID,
  questionType: (q.questionType as SessionQuestionType) ?? "MultipleChoiceQuestion",
  title: q.title,
  description: q.description ?? "",
  imageUrl: q.imageUrl,
  audioUrl: q.audioUrl,
  questionText: q.questionText ?? "",
  answerOptions: q.answerOptions,
  correctAnswer: q.correctAnswer,
  correctText: q.correctText,
  caseSensitive: q.caseSensitive,
});

// Drives the block/score-based flow (see app/lib/session-algorithm.ts, spec
// v2.1) for one lesson: fetches the question list, keeps the SessionState
// in React state, and reports to the backend exactly once, when the whole
// lesson's Summary is reached.
export const useLessonSession = (
  lessonId: string,
  filters?: { category?: string; questionType?: string }
) => {
  const {
    data: questions,
    isLoading,
    error,
  } = useQuery<Question[]>({
    queryKey: ["questions", "by-lesson", lessonId],
    queryFn: () => questionService.getQuestionsByLesson(lessonId),
    enabled: !!lessonId,
  });

  const payload = questions
    ?.filter((q) => {
      if (filters?.category && (q.questionCategory ?? "").toLowerCase() !== filters.category.toLowerCase()) {
        return false;
      }
      if (filters?.questionType && filters.questionType !== "all" && q.questionType !== filters.questionType) {
        return false;
      }
      return true;
    })
    .map(toSessionItem);

  const [state, setState] = useState<SessionState | null>(null);

  // Initialize (or re-initialize, if the question list identity changes —
  // e.g. filters changed) once the query resolves. Adjusting state during
  // render instead of in an effect, per React's rules on deriving state
  // from props.
  const [initializedFor, setInitializedFor] = useState<Question[] | undefined>(undefined);
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

      const correct = checkAnswer(prev.currentCard.item, userAnswer);

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
