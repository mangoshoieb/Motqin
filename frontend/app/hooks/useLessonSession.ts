"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { questionService } from "../services/question.service";
import { sessionReportingService } from "../services/session-reporting.service";
import { apply, checkAnswer, getGroupProgress, init } from "../lib/session-algorithm";
import { DEFAULT_GROUP_CONFIG } from "../constants/session.constants";

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

// Drives the grouped pair-based flow (see app/lib/session-algorithm.ts) for
// one lesson: fetches the question list, keeps the SessionState in React
// state, and reports a group to the backend exactly once, at the moment it
// actually completes — never for a group the student abandons partway
// through, per the "unfinished groups aren't saved" rule.
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
    setState(init(payload, DEFAULT_GROUP_CONFIG));
  }

  // Guards against reporting the same completed group twice (e.g. React
  // strict mode's double-invoke in dev, or an unrelated re-render).
  const reportedGroupIndexRef = useRef<number | null>(null);

  useEffect(() => {
    if (!state || state.currentCard.type !== "group-complete") return;
    if (reportedGroupIndexRef.current === state.groupIndex) return;
    reportedGroupIndexRef.current = state.groupIndex;
    sessionReportingService.reportGroupCompletion(lessonId, state.currentCard.stats);
  }, [state, lessonId]);

  const continueCard = () => {
    setState((prev) => (prev ? apply(prev, { type: "CONTINUE" }) : prev));
  };

  const submitAnswer = (userAnswer: string) => {
    setState((prev) => {
      if (!prev || prev.currentCard.type !== "test") return prev;
      const correct = checkAnswer(prev.currentCard.item, userAnswer);
      return apply(prev, { type: "ANSWER", correct, userAnswer });
    });
  };

  const continueToNextGroup = () => {
    setState((prev) => (prev ? apply(prev, { type: "CONTINUE_TO_NEXT_GROUP" }) : prev));
  };

  return {
    isLoading,
    error,
    currentCard: state?.currentCard ?? null,
    groupProgress: state ? getGroupProgress(state) : null,
    continueCard,
    submitAnswer,
    continueToNextGroup,
  };
};
