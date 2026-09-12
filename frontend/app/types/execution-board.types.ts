// Mock-backed for now (see app/data/executionBoard.ts + app/hooks/useExecutionBoard.ts)
// but shaped to match what the real backend already models: a "daily task"
// maps to a UserLessons row (no scheduled date yet, server-side), and a
// "revision" task maps to a StudyPlan / SpacedRepetitionSession entry
// (which does carry a real nextReviewDate). Swapping the hook's queryFn for
// a real endpoint later shouldn't require touching these shapes.

export type ExecutionTaskKind = "daily" | "revision";

// Present on revision tasks only — enough to deep-link straight into the
// real quiz session flow (see app/(protected)/subjects/.../quiz/page.tsx).
export interface ExecutionQuizLink {
  subjectIdSlug: string;
  lessonId: string;
  category: string; // matches the lesson page's CATEGORY_TABS values
}

export interface ExecutionTask {
  id: string;
  kind: ExecutionTaskKind;
  title: string;
  goalCategoryId?: number;
  priority?: number;
  date?: string;
  subjectName?: string;
  estimatedMinutes: number;
  completed: boolean;
  quizLink?: ExecutionQuizLink; // revision tasks only
  repetitionNumber?: number; // mirrors StudyPlan.repetitionNumber, revision tasks only
  notes?: string; // optional free-form note, entered per task
}

// A local study-timer session for a "daily" task. Revision tasks don't get
// one of these — starting one navigates straight into the real quiz.
export interface ExecutionSession {
  id: string;
  taskId: string;
  title: string;
  sessionDurationMinutes: number;
  actualMinutes: number;
  // Real seconds on the clock. actualMinutes stays the rounded-down figure the
  // day totals are summed from; this is what the running timer ticks.
  elapsedSeconds?: number;
  notes?: string; // free-form note for this session, stored as StudySession.notes
  status: "idle" | "active" | "paused" | "completed";
  // Set when the timer ran out but the user kept going: seconds worked past
  // the planned duration, ticking until they save (PUT /add-time) or dismiss.
  overtimeRunning?: boolean;
  overtimeSeconds?: number;
}

export interface DayOutputs {
  tasksCompleted: number;
  totalTasks: number;
  totalSessions: number;
  totalStudyMinutes: number;
  quizAccuracy: number | null; // 0..1, null when no quiz activity happened that day
}

export interface ExecutionDayDetail {
  dayIndex: number;
  dailyTasks: ExecutionTask[];
  revisionTasks: ExecutionTask[];
  sessions: ExecutionSession[];
  outputs: DayOutputs;
}
