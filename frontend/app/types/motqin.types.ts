export {};
declare global {
  interface Subject {
    subjectID: number;
    name: string;
    educationalStage: number;
    gradeLevel: number;
  }

  type getSubjectsResponse = Subject[];


// "subjectId": 3,
//     "totalCount": 3,
//     "lessons": [
//       {
//         "lessonId": 7,
//         "title": "الحمض والقاعدة"
//       },


  interface Lessons {
    subjectId: number;
    totalCount: number;
    // lessonStatus: "start" | "continue" | "review"
    lessons?: Lesson[]; 
  }

interface Lesson {
  lessonId:number;
  title:string;
}

  // ---------------------------------------------------------------------
  // Current backend shape (GET /api/questions/by-lesson and
  // /api/questions/by-category-and-lesson).
  //
  // The backend moved from one-row-per-question (QuestionReadDto, below) to
  // one-row-per-*information*, where a single row carries up to three cards:
  // a teaching card, an MCQ card, and a fill-in-the-blank card, all about the
  // same fact. There is no longer a `questionType` field — a row's "type" is
  // just which cards are non-null.
  //
  // "informationCategory" observed values (Arabic, sent verbatim):
  //   "أساسيات", "معلومات إضافية", "معلومات مهمة".
  // NOTE: prefixed `Lesson*` on purpose. session.types.ts already declares a
  // global `InfoCard` (the session algorithm's card union), and same-named
  // interfaces in the global scope MERGE rather than conflict — which would
  // silently produce a broken hybrid type.
  interface LessonInfoCard {
    title: string | null;
    explanation: string | null;
    imageUrl: string | null;
    audioUrl: string | null;
    videoUrl: string | null;
  }

  interface LessonMcqCard {
    text: string | null;
    options: string[] | null;
    correctAnswer: string | null;
  }

  interface LessonFibCard {
    // `correctText` is an array — a blank can accept more than one wording.
    text: string | null;
    correctText: string[] | null;
  }

  interface LessonInformation {
    informationID: number;
    lessonID: number;
    displayOrder: number;
    informationCategory: string | null;
    title: string | null;
    infoCard: LessonInfoCard | null;
    mcqCard: LessonMcqCard | null;
    fibCard: LessonFibCard | null;
  }

  // ---------------------------------------------------------------------
  // LEGACY — the pre-Information response shape. Still referenced by the
  // session/quiz flow (app/hooks/useLessonSession.ts, app/lib/session-algorithm.ts)
  // until that flow is migrated against the new algorithm spec. Nothing on the
  // lesson-questions page uses it any more.
  //
  // "questionCategory" observed values: "Basic", "Hard", "Advanced".
  // "questionType" observed values: "MultipleChoiceQuestion", "FillInTheBlankQuestion".
  // Confirmed against GET /api/questions/by-lesson via Swagger — see QuestionReadDto.
  interface Question {
    questionID: number;
    lessonID: number;
    questionCategory: string | null;
    questionText: string | null;
    difficultyLevel: string | null;
    questionType: string | null;
    title: string | null;
    description: string | null;
    // Media for the quiz page (not rendered on the categories page) — shown
    // to the student before they attempt the question there.
    imageUrl: string | null;
    audioUrl: string | null;
    answerOptions: string | null; // comma-separated options for MCQ
    correctAnswer: string | null; // MCQ correct option
    correctText: string | null; // fill-in-the-blank correct answer
    caseSensitive: boolean | null;
  }

  // Request body for POST /api/questions/user/mcq — matches MultipleChoiceQuestionDto.
  interface AddMcqQuestionInput {
    lessonID: number;
    questionCategory: string;
    questionText: string;
    difficultyLevel?: string | null;
    answerOptions: string;
    correctAnswer: string;
  }

  // Request body for POST /api/questions/user/fill — matches FillInTheBlankQuestionDto.
  interface AddFillQuestionInput {
    lessonID: number;
    questionCategory: string;
    questionText: string;
    difficultyLevel?: string | null;
    correctText: string;
    caseSensitive: boolean;
  }

  // Response shape from the user/mcq and user/fill endpoints — different from
  // Question/QuestionReadDto (this is the UserAddedQuestion entity).
  interface UserAddedQuestion {
    id: number;
    lessonID: number;
    displayOrder: number;
    priority: number;
    questionCategory: string;
    questionText: string;
    difficultyLevel: string | null;
  }
}
