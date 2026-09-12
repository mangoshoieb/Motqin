"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, CalendarDays, Clock, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { weekData } from "@/app/data/days";
import { useGetLessons } from "@/app/hooks/useGetLessons";
import { useGetSubjects } from "@/app/hooks/useGetSubjects";
import { cn } from "@/app/lib/utils";
import { currentWeekDates, formatPlannerDate } from "@/app/lib/study-plan";
import {
  CreateStudyPlanPayload,
  StudyPlanDuration,
  StudyPlanItem,
  studyPlansService,
} from "@/app/services/motqin";
import { GoalPicker } from "@/components/Planner/GoalPicker";

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";

// ---------------------------------------------------------------------------
// Add-task form shown inside an expanded day card. Same fields as the
// execution board's AddTaskDialog, but the date is fixed to the card's day.
// ---------------------------------------------------------------------------
function NextWeekTaskForm({ date, onDone }: { date: string; onDone: () => void }) {
  const queryClient = useQueryClient();
  const [source, setSource] = useState<"systematic" | "regular">("regular");
  const [subjectId, setSubjectId] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [title, setTitle] = useState("");
  const [goalCategoryId, setGoalCategoryId] = useState<number | null>(null);
  const [duration, setDuration] = useState("60");

  const { data: subjects } = useGetSubjects();
  const { data: lessonsData, isFetching: lessonsLoading } = useGetLessons(subjectId);
  const selectedLesson = lessonsData?.lessons?.find((lesson) => String(lesson.lessonId) === lessonId);
  const resolvedTitle = source === "systematic" ? selectedLesson?.title ?? "" : title.trim();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!resolvedTitle) throw new Error("title-required");
      if (source === "systematic" && (!subjectId || !lessonId)) throw new Error("lesson-required");
      if (goalCategoryId === null) throw new Error("goal-required");
      if (!duration || Number(duration) <= 0) throw new Error("duration-required");

      const payload: CreateStudyPlanPayload = {
        date,
        title: resolvedTitle,
        durationInMinutes: Number(duration),
        goalCategoryId,
      };
      if (source === "systematic") {
        payload.subjectId = Number(subjectId);
        payload.lessonId = Number(lessonId);
      }
      return studyPlansService.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["study-plans"] });
      toast.success("تمت إضافة المهمة");
      onDone();
    },
    onError: (error) =>
      toast.error(
        error.message === "title-required"
          ? "العنوان مطلوب."
          : error.message === "lesson-required"
            ? "يرجى اختيار المادة والدرس."
            : error.message === "goal-required"
              ? "يرجى اختيار الهدف."
              : error.message === "duration-required"
                ? "المدة يجب أن تكون أكبر من صفر."
                : "حدث خطأ أثناء حفظ المهمة.",
      ),
  });

  return (
    <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
      <div className="flex gap-1.5 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
        {(["systematic", "regular"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setSource(value)}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-all",
              source === value
                ? "bg-white text-blue-700 shadow-sm dark:bg-zinc-900 dark:text-blue-400"
                : "text-zinc-500",
            )}
          >
            {value === "systematic" ? "مهمة مرتبطة بالتطبيق" : "مهمة عادية"}
          </button>
        ))}
      </div>

      {source === "systematic" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
            المادة
            <select
              value={subjectId}
              onChange={(e) => {
                setSubjectId(e.target.value);
                setLessonId("");
              }}
              className={cn(inputClass, "mt-1")}
            >
              <option value="">اختر المادة</option>
              {subjects?.map((subject) => (
                <option key={subject.subjectID} value={subject.subjectID}>
                  {subject.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
            الدرس
            <select
              value={lessonId}
              onChange={(e) => setLessonId(e.target.value)}
              disabled={!subjectId || lessonsLoading}
              className={cn(inputClass, "mt-1")}
            >
              <option value="">{lessonsLoading ? "جاري التحميل..." : "اختر الدرس"}</option>
              {lessonsData?.lessons?.map((lesson) => (
                <option key={lesson.lessonId} value={lesson.lessonId}>
                  {lesson.title}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : (
        <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300">
          عنوان المهمة
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: قراءة الفصل الثاني"
            className={cn(inputClass, "mt-1")}
          />
        </label>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
          الهدف
          <div className="mt-1">
            <GoalPicker
              value={goalCategoryId}
              onChange={(id) => setGoalCategoryId(id)}
              className="rounded-lg border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>
        </div>
        <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
          المدة بالدقائق
          <input
            type="number"
            min={1}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className={cn(inputClass, "mt-1")}
          />
        </label>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border border-zinc-200 px-4 py-2 text-sm dark:border-zinc-700"
        >
          إلغاء
        </button>
        <button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {mutation.isPending ? "جاري الحفظ..." : "إضافة المهمة"}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// One day column. Collapsed it lists the day's tasks; expanded (3× wide) it
// also shows the add-task form for that date.
// ---------------------------------------------------------------------------
function NextWeekDayCard({
  index,
  dayName,
  date,
  items,
  expanded,
  onToggle,
}: {
  index: number;
  dayName: string;
  date: string;
  items: StudyPlanItem[];
  expanded: boolean;
  onToggle: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const totalMinutes = items.reduce((sum, item) => sum + item.durationInMinutes, 0);

  return (
    <div
      dir="rtl"
      onClick={expanded ? undefined : onToggle}
      className={cn(
        "flex h-full min-w-0 flex-col overflow-hidden bg-white transition-all duration-300 dark:bg-zinc-900",
        expanded ? "flex-[3] shadow-inner" : "flex-1 cursor-pointer hover:bg-blue-50/40 dark:hover:bg-zinc-800/60",
        index !== 7 && "border-l border-zinc-200 dark:border-zinc-800",
      )}
    >
      {/* Header — always toggles */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={cn(
          "flex w-full items-center justify-between border-b border-zinc-100 p-3 text-right dark:border-zinc-800",
          expanded ? "bg-blue-600/30" : "bg-blue-600/20",
        )}
      >
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{dayName}</h3>
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {formatPlannerDate(date)}
          </span>
        </div>
        <div className="flex flex-col items-end gap-0.5 text-xs font-semibold text-blue-700 dark:text-blue-400">
          <span>{items.length} مهام</span>
          {totalMinutes > 0 && (
            <span className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
              <Clock size={11} />
              {Math.round((totalMinutes / 60) * 10) / 10} س
            </span>
          )}
        </div>
      </button>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        {items.length === 0 ? (
          <p className="py-3 text-center text-xs text-zinc-400">لا توجد مهام بعد</p>
        ) : (
          <ul className="space-y-1.5">
            {items.map((item) => (
              <li
                key={item.id}
                title={item.title}
                className="flex items-center justify-between gap-2 rounded-lg bg-zinc-50 px-2.5 py-1.5 text-sm text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300"
              >
                <span className="min-w-0 flex-1 truncate">{item.title}</span>
                {expanded && (
                  <span className="shrink-0 text-xs text-zinc-400">{item.durationInMinutes} د</span>
                )}
              </li>
            ))}
          </ul>
        )}

        {expanded && (
          <div className="mt-auto border-t border-zinc-100 pt-3 dark:border-zinc-800">
            {showForm ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm font-bold text-zinc-800 dark:text-zinc-100">
                    <BookOpen size={16} className="text-blue-600" />
                    إضافة مهمة
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowForm(false);
                    }}
                    title="إغلاق"
                    className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                  >
                    <X size={16} />
                  </button>
                </div>
                <NextWeekTaskForm date={date} onDone={() => setShowForm(false)} />
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowForm(true);
                }}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-blue-300 px-3 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950/40"
              >
                <Plus size={16} />
                إضافة مهمة لهذا اليوم
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The manual-planning board: next week's seven days, fetched with
// Duration=NextWeek. Shorter than the main week board — no performance
// numbers, since none of these days have happened yet.
// ---------------------------------------------------------------------------
export default function NextWeekBoard() {
  const dates = currentWeekDates(1);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["study-plans", "week", 1, dates[0], dates[6]],
    queryFn: () =>
      studyPlansService.filter({
        duration: StudyPlanDuration.NextWeek,
        startDate: dates[0],
        endDate: dates[6],
      }),
  });

  return (
    <div dir="rtl" className="mt-6 space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <CalendarDays className="text-blue-600 dark:text-blue-400" size={20} />
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">الأسبوع القادم</h2>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {formatPlannerDate(dates[0])} - {formatPlannerDate(dates[6])}
          </span>
        </div>
        <p className="text-xs text-zinc-400">اضغط على أي يوم لإضافة مهام له</p>
      </div>

      <div className="flex h-[52vh] overflow-hidden rounded-xl border border-zinc-200 shadow-sm dark:border-zinc-800">
        {weekData.map((day, i) => {
          const date = dates[i];
          return (
            <NextWeekDayCard
              key={day.index}
              index={day.index}
              dayName={day.dayName}
              date={date}
              items={data?.items.filter((item) => item.date === date) ?? []}
              expanded={expandedIndex === day.index}
              onToggle={() =>
                setExpandedIndex((prev) => (prev === day.index ? null : day.index))
              }
            />
          );
        })}
      </div>

      {isLoading && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">جاري تحميل مهام الأسبوع القادم...</p>
      )}
    </div>
  );
}
