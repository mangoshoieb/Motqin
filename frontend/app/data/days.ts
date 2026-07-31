import {
  PlannerDay,
  Task,
  TaskCategory,
  TaskPriority,
  TaskSource,
} from "@/app/types/planner.types";

const task = (
  id: string,
  title: string,
  completed: boolean,
  category: TaskCategory,
  minutes: number,
  priority: TaskPriority,
  source: TaskSource
): Task => ({
  id,
  title,
  completed,
  category,
  estimatedTimeMinutes: minutes,
  priority,
  source,
});

export const weekData : PlannerDay[]  = [
  {
    index: 1,
    dayName: "الأحد",
    date: "18/06",
    completedTasks: 2,
    totalTasks: 5,
    workingHours: 4,
    focusSessions: 3,
    mood: "ممتاز",
    tasks: [
      task(
        "1",
        "تصميم واجهة المخطط الأسبوعي",
        true,
        "project",
        120,
        "high",
        "goal"
      ),
      task("2", "اختبار الفيزياء", true, "quiz", 30, "medium", "ai"),
      task(
        "3",
        "إضافة قسم الأداء إلى بطاقة اليوم",
        false,
        "project",
        60,
        "high",
        "goal"
      ),
      task("4", "تصميم قسم الملاحظات", false, "lesson", 45, "medium", "manual"),
      task(
        "5",
        "ربط بطاقة اليوم بالبيانات الوهمية",
        false,
        "revision",
        30,
        "medium",
        "manual"
      ),
    ],
    sessions: [
      {
        id: "1",
        title: "جلسة تصميم واجهة المخطط",
        sessionDuration: 90,
        actualMinutes: 45,
        completed: false,
        status: "active",
      },
      {
        id: "2",
        title: "جلسة مراجعة واجهات التطبيق",
        sessionDuration: 60,
        actualMinutes: 60,
        completed: true,
        status: "completed",
      },
    ],
  },

  {
    index: 2,
    dayName: "الاثنين",
    date: "19/06",
    completedTasks: 4,
    totalTasks: 6,
    workingHours: 5,
    focusSessions: 4,
    mood: "ممتاز",
    isToday: true,
    tasks: [
      task("6", "درس اللغة الإنجليزية", true, "lesson", 60, "high", "ai"),
      task("7", "مهمة مراجعة", true, "revision", 45, "medium", "ai"),
      task("8", "تصميم قسم الأهداف", true, "project", 90, "high", "goal"),
      task("9", "تصميم لوحة التقدم", true, "project", 90, "high", "goal"),
      task(
        "10",
        "إنشاء مكون Goal Card",
        false,
        "project",
        60,
        "medium",
        "manual"
      ),
      task(
        "11",
        "إضافة نظام الأولويات",
        false,
        "project",
        45,
        "medium",
        "manual"
      ),
    ],
    sessions: [
      {
        id: "1",
        title: "جلسة تصميم واجهة المخطط",
        sessionDuration: 90,
        actualMinutes: 45,
        completed: false,
        status: "active",
      },
      {
        id: "2",
        title: "جلسة مراجعة واجهات التطبيق",
        sessionDuration: 60,
        actualMinutes: 60,
        completed: true,
        status: "completed",
      },
    ],
  },

  {
    index: 3,
    dayName: "الثلاثاء",
    date: "20/06",
    completedTasks: 1,
    totalTasks: 4,
    workingHours: 2,
    focusSessions: 2,
    mood: "متوسط",
    tasks: [
      task("12", "واجب الرياضيات", true, "lesson", 60, "high", "manual"),
      task(
        "13",
        "تصميم واجهة جلسات التركيز",
        false,
        "project",
        90,
        "high",
        "goal"
      ),
      task(
        "14",
        "إنشاء نموذج إضافة مهمة",
        false,
        "project",
        60,
        "medium",
        "manual"
      ),
      task(
        "15",
        "مراجعة تصميم المخطط الشهري",
        false,
        "revision",
        45,
        "medium",
        "manual"
      ),
    ],
    sessions: [
      {
        id: "1",
        title: "جلسة تصميم واجهة المخطط",
        sessionDuration: 90,
        actualMinutes: 45,
        completed: false,
        status: "active",
      },
      {
        id: "2",
        title: "جلسة مراجعة واجهات التطبيق",
        sessionDuration: 60,
        actualMinutes: 60,
        completed: true,
        status: "completed",
      },
    ],
  },

  {
    index: 4,
    dayName: "الأربعاء",
    date: "21/06",
    completedTasks: 3,
    totalTasks: 3,
    workingHours: 6,
    focusSessions: 5,
    mood: "ممتاز",
    tasks: [
      task("16", "جلسة المعلم الذكي", true, "lesson", 60, "high", "ai"),
      task("17", "تصميم صفحة المواد", true, "project", 90, "high", "goal"),
      task("18", "إنشاء بطاقات الدروس", true, "project", 60, "medium", "goal"),
    ],
    sessions: [
      {
        id: "1",
        title: "جلسة تصميم واجهة المخطط",
        sessionDuration: 90,
        actualMinutes: 45,
        completed: false,
        status: "active",
      },
      {
        id: "2",
        title: "جلسة مراجعة واجهات التطبيق",
        sessionDuration: 60,
        actualMinutes: 60,
        completed: true,
        status: "completed",
      },
    ],
  },

  {
    index: 5,
    dayName: "الخميس",
    date: "22/06",
    completedTasks: 0,
    totalTasks: 5,
    workingHours: 0,
    focusSessions: 0,
    mood: "متوسط",
    tasks: [
      task("19", "مراجعة الفيزياء", false, "revision", 60, "high", "ai"),
      task(
        "20",
        "تصميم صفحة الاختبارات",
        false,
        "project",
        120,
        "high",
        "goal"
      ),
      task(
        "21",
        "تصميم نافذة تفاصيل اليوم",
        false,
        "project",
        90,
        "high",
        "goal"
      ),
      task(
        "22",
        "إضافة زر التخطيط الذكي",
        false,
        "project",
        45,
        "medium",
        "manual"
      ),
      task(
        "23",
        "تصميم قسم المخرجات التعليمية",
        false,
        "project",
        60,
        "medium",
        "manual"
      ),
    ],
    sessions: [
      {
        id: "1",
        title: "جلسة تصميم واجهة المخطط",
        sessionDuration: 90,
        actualMinutes: 45,
        completed: false,
        status: "active",
      },
      {
        id: "2",
        title: "جلسة مراجعة واجهات التطبيق",
        sessionDuration: 60,
        actualMinutes: 60,
        completed: true,
        status: "completed",
      },
    ],
  },

  {
    index: 6,
    dayName: "الجمعة",
    date: "23/06",
    completedTasks: 2,
    totalTasks: 7,
    workingHours: 3,
    focusSessions: 2,
    mood: "جيد",
    tasks: [
      task("24", "تحدي المنافسة", true, "competition", 45, "medium", "ai"),
      task("25", "حل اختبار الكيمياء", true, "quiz", 30, "medium", "ai"),
      task("26", "تصميم لوحة الإنجازات", false, "project", 90, "high", "goal"),
      task("27", "تصميم تقويم السنة", false, "project", 120, "high", "goal"),
      task(
        "28",
        "إنشاء قسم الإحصائيات",
        false,
        "project",
        90,
        "medium",
        "manual"
      ),
      task(
        "29",
        "تصميم بطاقات الإنجازات",
        false,
        "project",
        60,
        "medium",
        "manual"
      ),
      task("30", "إضافة نظام التنبيهات", false, "project", 45, "low", "manual"),
    ],
    sessions: [
      {
        id: "1",
        title: "جلسة تصميم واجهة المخطط",
        sessionDuration: 90,
        actualMinutes: 45,
        completed: false,
        status: "active",
      },
      {
        id: "2",
        title: "جلسة مراجعة واجهات التطبيق",
        sessionDuration: 60,
        actualMinutes: 60,
        completed: true,
        status: "completed",
      },
    ],
  },

  {
    index: 7,
    dayName: "السبت",
    date: "24/06",
    completedTasks: 5,
    totalTasks: 5,
    workingHours: 7,
    focusSessions: 5,
    mood: "ممتاز",
    tasks: [
      task("31", "إنهاء الوحدة الأولى", true, "lesson", 120, "high", "goal"),
      task("32", "إنشاء صفحة الدروس", true, "project", 90, "high", "goal"),
      task("33", "تصميم الصفحة الرئيسية", true, "project", 120, "high", "goal"),
      task(
        "34",
        "ربط البيانات الوهمية",
        true,
        "project",
        60,
        "medium",
        "manual"
      ),
      task(
        "35",
        "مراجعة التصميم بالكامل",
        true,
        "revision",
        60,
        "medium",
        "manual"
      ),
    ],
    sessions: [
      {
        id: "1",
        title: "جلسة تصميم واجهة المخطط",
        sessionDuration: 90,
        actualMinutes: 45,
        completed: false,
        status: "active",
      },
      {
        id: "2",
        title: "جلسة مراجعة واجهات التطبيق",
        sessionDuration: 60,
        actualMinutes: 60,
        completed: true,
        status: "completed",
      },
    ],
  },
];
