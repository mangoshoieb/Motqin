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
