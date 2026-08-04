"use client";

import { useState } from "react";
import {
  BookOpen,
  Minus,
  Plus,
  RefreshCw,
  Sparkles,
  Target,
  Trash2,
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useGetSubjects } from "@/app/hooks/useGetSubjects";
import { useGetLessons } from "@/app/hooks/useGetLessons";
import {
  goalPriorityOptions,
  goalTypeOptions,
  WEEKDAY_NAMES,
} from "@/app/constants/goal.constants";
import { Goal, GoalSource, GoalSubTask, GoalType } from "@/app/types/goal.types";
import { TaskPriority } from "@/app/types/planner.types";

interface GoalsSectionProps {
  onGeneratePlan?: (goals: Goal[]) => void;
}

let goalIdCounter = 0;
const nextGoalId = () => `goal-${Date.now()}-${goalIdCounter++}`;

const buildSubTasks = (
  breakdownCount: number,
  estimatedHours: number,
  title: string
): GoalSubTask[] => {
  const count = Math.max(breakdownCount, 1);
  const totalMinutes = Math.max(estimatedHours, 0) * 60;
  const perTaskMinutes = Math.round(totalMinutes / count);

  return Array.from({ length: count }, (_, i) => ({
    id: `sub-${i}`,
    title: count > 1 ? `${title} - المهمة ${i + 1}` : title,
    dayIndex: (i % WEEKDAY_NAMES.length) + 1,
    estimatedMinutes: perTaskMinutes,
  }));
};

function NumberStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  step = 1,
  suffix,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-2xl bg-input/50 p-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, +(value - step).toFixed(2)))}
        className="flex size-7 items-center justify-center rounded-xl bg-background text-zinc-600 shadow-sm hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
      >
        <Minus size={14} />
      </button>

      <span className="min-w-14 text-center text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        {value}
        {suffix}
      </span>

      <button
        type="button"
        onClick={() => onChange(Math.min(max, +(value + step).toFixed(2)))}
        className="flex size-7 items-center justify-center rounded-xl bg-background text-zinc-600 shadow-sm hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

export default function GoalsSection({ onGeneratePlan }: GoalsSectionProps) {
  const [source, setSource] = useState<GoalSource>("systematic");

  const [subjectId, setSubjectId] = useState<string>("");
  const [lessonId, setLessonId] = useState<string>("");
  const [regularTitle, setRegularTitle] = useState("");

  const [goalType, setGoalType] = useState<GoalType>("study");
  const [estimatedHours, setEstimatedHours] = useState(1);
  const [breakdownCount, setBreakdownCount] = useState(1);
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [rollover, setRollover] = useState(false);
  const [subTasks, setSubTasks] = useState<GoalSubTask[]>([]);

  const [goals, setGoals] = useState<Goal[]>([]);

  const { data: subjects } = useGetSubjects();
  const { data: lessonsData, isFetching: lessonsLoading } =
    useGetLessons(subjectId);

  const selectedSubject = subjects?.find(
    (s) => String(s.subjectID) === subjectId
  );
  const selectedLesson = lessonsData?.lessons?.find(
    (l) => String(l.lessonId) === lessonId
  );

  const resolvedTitle =
    source === "systematic" ? selectedLesson?.title ?? "" : regularTitle.trim();

  const regenerateSubTasks = (next: {
    breakdownCount?: number;
    estimatedHours?: number;
    title?: string;
  }) => {
    setSubTasks(
      buildSubTasks(
        next.breakdownCount ?? breakdownCount,
        next.estimatedHours ?? estimatedHours,
        (next.title ?? resolvedTitle) || "مهمة"
      )
    );
  };

  const isValid = resolvedTitle.length > 0 && estimatedHours > 0;

  const resetForm = () => {
    setSubjectId("");
    setLessonId("");
    setRegularTitle("");
    setGoalType("study");
    setEstimatedHours(1);
    setBreakdownCount(1);
    setPriority("medium");
    setRollover(false);
    setSubTasks([]);
  };

  const handleSubmit = () => {
    if (!isValid) return;

    const goal: Goal = {
      id: nextGoalId(),
      title: resolvedTitle,
      source,
      subjectId: selectedSubject?.subjectID,
      subjectName: selectedSubject?.name,
      lessonId: selectedLesson?.lessonId,
      lessonName: selectedLesson?.title,
      goalType,
      estimatedHours,
      breakdownCount,
      priority,
      rolloverToNextWeek: rollover,
      subTasks,
    };

    setGoals((prev) => [...prev, goal]);
    resetForm();
  };

  const handleRemove = (goalId: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
  };

  const updateSubTask = (index: number, patch: Partial<GoalSubTask>) => {
    setSubTasks((prev) =>
      prev.map((st, i) => (i === index ? { ...st, ...patch } : st))
    );
  };

  return (
    <div
      dir="rtl"
      className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="mb-1 flex items-center gap-2">
        <Target className="text-blue-600 dark:text-blue-400" size={22} />
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          أهداف الأسبوع القادم
        </h2>
      </div>
      <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
        أضف هنا الأهداف التي تريد تحقيقها في الأسبوع القادم، وسيقوم الذكاء
        الاصطناعي بتوزيعها على أيام الأسبوع تلقائيًا.
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* مصدر الهدف */}
        <div className="space-y-4 rounded-xl border border-zinc-100 p-4 dark:border-zinc-800">
          <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
            مصدر الهدف
          </h3>

          <div className="inline-flex items-center gap-1.5 rounded-2xl bg-zinc-100 p-1.5 dark:bg-zinc-800">
            <button
              type="button"
              onClick={() => {
                setSource("systematic");
                regenerateSubTasks({ title: selectedLesson?.title ?? "" });
              }}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-bold transition-all",
                source === "systematic"
                  ? "bg-white text-blue-700 shadow-sm dark:bg-zinc-900 dark:text-blue-400"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              )}
            >
              هدف من الدروس
            </button>
            <button
              type="button"
              onClick={() => {
                setSource("regular");
                regenerateSubTasks({ title: regularTitle.trim() });
              }}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-bold transition-all",
                source === "regular"
                  ? "bg-white text-blue-700 shadow-sm dark:bg-zinc-900 dark:text-blue-400"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              )}
            >
              هدف عادي
            </button>
          </div>

          {source === "systematic" ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  المادة
                </label>
                <Select
                  value={subjectId}
                  onValueChange={(v) => {
                    setSubjectId(v ?? "");
                    setLessonId("");
                    regenerateSubTasks({ title: "" });
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="اختر المادة">
                      {(v: string | null) =>
                        v
                          ? subjects?.find((s) => String(s.subjectID) === v)
                              ?.name
                          : "اختر المادة"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    {subjects?.map((subject) => (
                      <SelectItem
                        key={subject.subjectID}
                        value={String(subject.subjectID)}
                      >
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  الدرس
                </label>
                <Select
                  value={lessonId}
                  onValueChange={(v) => {
                    const next = v ?? "";
                    setLessonId(next);
                    const lesson = lessonsData?.lessons?.find(
                      (l) => String(l.lessonId) === next
                    );
                    regenerateSubTasks({ title: lesson?.title ?? "" });
                  }}
                  disabled={!subjectId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        lessonsLoading ? "جارِ التحميل..." : "اختر الدرس"
                      }
                    >
                      {(v: string | null) =>
                        v
                          ? lessonsData?.lessons?.find(
                              (l) => String(l.lessonId) === v
                            )?.title
                          : lessonsLoading
                          ? "جارِ التحميل..."
                          : "اختر الدرس"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    {lessonsData?.lessons?.map((lesson) => (
                      <SelectItem
                        key={lesson.lessonId}
                        value={String(lesson.lessonId)}
                      >
                        {lesson.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                عنوان الهدف
              </label>
              <input
                value={regularTitle}
                onChange={(e) => {
                  setRegularTitle(e.target.value);
                  regenerateSubTasks({ title: e.target.value.trim() });
                }}
                placeholder="مثال: مراجعة الفصل الثاني"
                className="w-full rounded-xl border border-zinc-200 bg-transparent px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-700 dark:text-zinc-100 dark:focus:ring-blue-950"
              />
            </div>
          )}
        </div>

        {/* تفاصيل الهدف */}
        <div className="space-y-4 rounded-xl border border-zinc-100 p-4 dark:border-zinc-800">
          <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
            تفاصيل الهدف
          </h3>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              نوع الهدف
            </label>
            <Select
              value={goalType}
              onValueChange={(v) => setGoalType(v as GoalType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(v: string | null) =>
                    goalTypeOptions.find((opt) => opt.value === v)?.label
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent dir="rtl">
                {goalTypeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              الساعات المقدرة
            </label>
            <NumberStepper
              value={estimatedHours}
              onChange={(v) => {
                setEstimatedHours(v);
                regenerateSubTasks({ estimatedHours: v });
              }}
              min={0.5}
              max={40}
              step={0.5}
              suffix=" س"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              تقسيم المهام (عدد الأيام)
            </label>
            <NumberStepper
              value={breakdownCount}
              onChange={(v) => {
                const next = Math.round(v);
                setBreakdownCount(next);
                regenerateSubTasks({ breakdownCount: next });
              }}
              min={1}
              max={WEEKDAY_NAMES.length}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              الأولوية
            </label>
            <Select
              value={priority}
              onValueChange={(v) => setPriority(v as TaskPriority)}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(v: string | null) =>
                    goalPriorityOptions.find((opt) => opt.value === v)?.label
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent dir="rtl">
                {goalPriorityOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              ترحيل تلقائي للأسبوع القادم عند عدم الإكمال
            </label>
            <Switch checked={rollover} onCheckedChange={setRollover} />
          </div>
        </div>
      </div>

      {/* المهام التفصيلية */}
      {subTasks.length > 0 && resolvedTitle && (
        <div className="mt-6 space-y-2">
          <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
            المهام التفصيلية
          </h3>

          <div className="space-y-2">
            {subTasks.map((st, i) => (
              <div
                key={st.id}
                className="flex flex-wrap items-center gap-2 rounded-xl bg-zinc-50 p-2 dark:bg-zinc-800/60"
              >
                <input
                  value={st.title}
                  onChange={(e) => updateSubTask(i, { title: e.target.value })}
                  className="min-w-40 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm text-zinc-900 outline-none focus:border-blue-400 dark:text-zinc-100"
                />

                <Select
                  value={String(st.dayIndex)}
                  onValueChange={(v) => updateSubTask(i, { dayIndex: Number(v) })}
                >
                  <SelectTrigger size="sm">
                    <SelectValue>
                      {(v: string | null) =>
                        v ? WEEKDAY_NAMES[Number(v) - 1] : undefined
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    {WEEKDAY_NAMES.map((dayName, dayIdx) => (
                      <SelectItem key={dayName} value={String(dayIdx + 1)}>
                        {dayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <input
                  type="number"
                  min={0}
                  value={st.estimatedMinutes}
                  onChange={(e) =>
                    updateSubTask(i, {
                      estimatedMinutes: Math.max(0, Number(e.target.value)),
                    })
                  }
                  className="w-20 rounded-lg border border-zinc-200 bg-transparent px-2 py-1.5 text-center text-sm text-zinc-900 outline-none focus:border-blue-400 dark:border-zinc-700 dark:text-zinc-100"
                />
                <span className="text-xs text-zinc-400">دقيقة</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={handleSubmit}
          disabled={!isValid}
          className="px-6"
        >
          إضافة الهدف إلى القائمة
        </Button>
      </div>

      {/* الأهداف المضافة */}
      {goals.length > 0 && (
        <div className="mt-8 space-y-3 border-t border-zinc-100 pt-6 dark:border-zinc-800">
          <h3 className="mb-2 text-sm font-bold text-zinc-700 dark:text-zinc-300">
            أهداف الأسبوع القادم ({goals.length})
          </h3>

          {goals.map((goal) => (
            <div
              key={goal.id}
              className="animate-in fade-in-0 zoom-in-95 relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-blue-100 p-5 shadow-md shadow-indigo-500/10 duration-300 dark:border-indigo-900/50 dark:from-indigo-950/30 dark:via-zinc-900 dark:to-blue-950/40"
            >
              <Sparkles
                className="pointer-events-none absolute -left-3 -top-3 text-indigo-100 dark:text-indigo-900/50"
                size={80}
                strokeWidth={1}
              />

              <div className="relative flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-1 flex-wrap items-center gap-2.5">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                    <BookOpen size={18} />
                  </span>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                      {goal.title}
                    </span>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        {
                          goalTypeOptions.find((o) => o.value === goal.goalType)
                            ?.label
                        }
                      </span>
                      <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        {
                          goalPriorityOptions.find(
                            (o) => o.value === goal.priority
                          )?.label
                        }
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-zinc-500 shadow-sm dark:bg-zinc-800 dark:text-zinc-400">
                        {goal.estimatedHours} س · مقسم إلى {goal.breakdownCount}
                      </span>
                      {goal.rolloverToNextWeek && (
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                          يُرحّل تلقائيًا
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemove(goal.id)}
                  className="relative shrink-0 rounded-lg p-1.5 text-zinc-400 hover:bg-white hover:text-red-500 dark:hover:bg-zinc-800"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* توليد الخطة بالذكاء الاصطناعي */}
      <div className="mt-6 border-t border-zinc-100 pt-6 dark:border-zinc-800">
        <button
          type="button"
          disabled={goals.length === 0}
          onClick={() => onGeneratePlan?.(goals)}
          className="flex w-[60%] m-auto items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-indigo-600 to-blue-400 px-6 py-4 text-base font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          <Sparkles size={20} />
          توليد خطة الأسبوع القادم بالذكاء الاصطناعي
        </button>

        {goals.length === 0 && (
          <p className="mt-2 flex items-center justify-center gap-1 text-center text-xs text-zinc-400">
            <RefreshCw size={12} />
            أضف هدفًا واحدًا على الأقل ليتمكن الذكاء الاصطناعي من توليد الخطة
          </p>
        )}
      </div>
    </div>
  );
}
