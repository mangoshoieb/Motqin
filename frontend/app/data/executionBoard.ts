import { ExecutionDayDetail } from "@/app/types/execution-board.types";

// Mock data, keyed by the same dayIndex used in app/data/days.ts (weekData).
// The execution board page reads day name/date/mood from weekData and this
// file's richer task/session/output breakdown for the same dayIndex.
export const executionBoardData: ExecutionDayDetail[] = [
  {
    dayIndex: 1,
    dailyTasks: [
      {
        id: "d1-1",
        kind: "daily",
        title: "قراءة الفصل الثالث من كتاب الفيزياء",
        subjectName: "الفيزياء",
        estimatedMinutes: 45,
        completed: true,
      },
      {
        id: "d1-2",
        kind: "daily",
        title: "حل تمارين الوحدة الثانية",
        subjectName: "الرياضيات",
        estimatedMinutes: 30,
        completed: false,
      },
    ],
    revisionTasks: [
      {
        id: "r1-1",
        kind: "revision",
        title: "مراجعة متباعدة: خصائص الأحماض والقواعد",
        subjectName: "الكيمياء",
        estimatedMinutes: 20,
        completed: false,
        repetitionNumber: 2,
        quizLink: { subjectIdSlug: "3-الكيمياء", lessonId: "7", category: "أساسيات" },
      },
    ],
    sessions: [
      {
        id: "s1-1",
        taskId: "d1-1",
        title: "جلسة قراءة الفيزياء",
        sessionDurationMinutes: 45,
        actualMinutes: 45,
        status: "completed",
      },
    ],
    outputs: {
      tasksCompleted: 2,
      totalTasks: 3,
      totalSessions: 1,
      totalStudyMinutes: 45,
      quizAccuracy: null,
    },
  },
  {
    dayIndex: 2,
    dailyTasks: [
      {
        id: "d2-1",
        kind: "daily",
        title: "درس اللغة الإنجليزية - الوحدة الرابعة",
        subjectName: "اللغة الإنجليزية",
        estimatedMinutes: 60,
        completed: true,
      },
    ],
    revisionTasks: [
      {
        id: "r2-1",
        kind: "revision",
        title: "مراجعة متباعدة: أنواع القواعد",
        subjectName: "الكيمياء",
        estimatedMinutes: 25,
        completed: true,
        repetitionNumber: 1,
        quizLink: { subjectIdSlug: "3-الكيمياء", lessonId: "7", category: "معلومات إضافية" },
      },
      {
        id: "r2-2",
        kind: "revision",
        title: "مراجعة متباعدة: التفاعلات الكيميائية",
        subjectName: "الكيمياء",
        estimatedMinutes: 20,
        completed: false,
        repetitionNumber: 1,
        quizLink: { subjectIdSlug: "3-الكيمياء", lessonId: "9", category: "معلومات مهمة" },
      },
    ],
    sessions: [
      {
        id: "s2-1",
        taskId: "d2-1",
        title: "جلسة درس اللغة الإنجليزية",
        sessionDurationMinutes: 60,
        actualMinutes: 60,
        status: "completed",
      },
    ],
    outputs: {
      tasksCompleted: 2,
      totalTasks: 3,
      totalSessions: 1,
      totalStudyMinutes: 60,
      quizAccuracy: 0.86,
    },
  },
  {
    dayIndex: 3,
    dailyTasks: [
      {
        id: "d3-1",
        kind: "daily",
        title: "واجب الرياضيات - المعادلات التفاضلية",
        subjectName: "الرياضيات",
        estimatedMinutes: 60,
        completed: true,
      },
    ],
    revisionTasks: [
      {
        id: "r3-1",
        kind: "revision",
        title: "مراجعة متباعدة: مؤشر الأس الهيدروجيني",
        subjectName: "الكيمياء",
        estimatedMinutes: 20,
        completed: false,
        repetitionNumber: 3,
        quizLink: { subjectIdSlug: "3-الكيمياء", lessonId: "11", category: "أساسيات" },
      },
    ],
    sessions: [],
    outputs: {
      tasksCompleted: 1,
      totalTasks: 2,
      totalSessions: 0,
      totalStudyMinutes: 0,
      quizAccuracy: null,
    },
  },
  {
    dayIndex: 4,
    dailyTasks: [
      {
        id: "d4-1",
        kind: "daily",
        title: "جلسة مع المعلم الذكي حول الديناميكا",
        subjectName: "الفيزياء",
        estimatedMinutes: 60,
        completed: true,
      },
    ],
    revisionTasks: [],
    sessions: [
      {
        id: "s4-1",
        taskId: "d4-1",
        title: "جلسة المعلم الذكي",
        sessionDurationMinutes: 60,
        actualMinutes: 60,
        status: "completed",
      },
    ],
    outputs: {
      tasksCompleted: 1,
      totalTasks: 1,
      totalSessions: 1,
      totalStudyMinutes: 60,
      quizAccuracy: null,
    },
  },
  {
    dayIndex: 5,
    dailyTasks: [
      {
        id: "d5-1",
        kind: "daily",
        title: "قراءة ملخص الوحدة الثالثة",
        subjectName: "الأحياء",
        estimatedMinutes: 40,
        completed: false,
      },
    ],
    revisionTasks: [
      {
        id: "r5-1",
        kind: "revision",
        title: "مراجعة متباعدة: خصائص الأحماض والقواعد",
        subjectName: "الكيمياء",
        estimatedMinutes: 20,
        completed: false,
        repetitionNumber: 3,
        quizLink: { subjectIdSlug: "3-الكيمياء", lessonId: "7", category: "أساسيات" },
      },
    ],
    sessions: [],
    outputs: {
      tasksCompleted: 0,
      totalTasks: 2,
      totalSessions: 0,
      totalStudyMinutes: 0,
      quizAccuracy: null,
    },
  },
  {
    dayIndex: 6,
    dailyTasks: [
      {
        id: "d6-1",
        kind: "daily",
        title: "حل اختبار الكيمياء التجريبي",
        subjectName: "الكيمياء",
        estimatedMinutes: 30,
        completed: true,
      },
    ],
    revisionTasks: [
      {
        id: "r6-1",
        kind: "revision",
        title: "مراجعة متباعدة: أنواع القواعد",
        subjectName: "الكيمياء",
        estimatedMinutes: 20,
        completed: true,
        repetitionNumber: 2,
        quizLink: { subjectIdSlug: "3-الكيمياء", lessonId: "7", category: "معلومات إضافية" },
      },
    ],
    sessions: [
      {
        id: "s6-1",
        taskId: "d6-1",
        title: "جلسة اختبار الكيمياء",
        sessionDurationMinutes: 30,
        actualMinutes: 30,
        status: "completed",
      },
    ],
    outputs: {
      tasksCompleted: 2,
      totalTasks: 2,
      totalSessions: 1,
      totalStudyMinutes: 30,
      quizAccuracy: 0.9,
    },
  },
  {
    dayIndex: 7,
    dailyTasks: [
      {
        id: "d7-1",
        kind: "daily",
        title: "إنهاء الوحدة الأولى من الأحياء",
        subjectName: "الأحياء",
        estimatedMinutes: 90,
        completed: true,
      },
    ],
    revisionTasks: [
      {
        id: "r7-1",
        kind: "revision",
        title: "مراجعة متباعدة: مؤشر الأس الهيدروجيني",
        subjectName: "الكيمياء",
        estimatedMinutes: 20,
        completed: true,
        repetitionNumber: 4,
        quizLink: { subjectIdSlug: "3-الكيمياء", lessonId: "11", category: "أساسيات" },
      },
    ],
    sessions: [
      {
        id: "s7-1",
        taskId: "d7-1",
        title: "جلسة إنهاء وحدة الأحياء",
        sessionDurationMinutes: 90,
        actualMinutes: 90,
        status: "completed",
      },
    ],
    outputs: {
      tasksCompleted: 2,
      totalTasks: 2,
      totalSessions: 1,
      totalStudyMinutes: 90,
      quizAccuracy: 0.93,
    },
  },
];
