"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Clock, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { weekData } from "@/app/data/days";
import { useGetLessons } from "@/app/hooks/useGetLessons";
import { useGetSubjects } from "@/app/hooks/useGetSubjects";
import { cn } from "@/app/lib/utils";
import {
  currentWeekDates,
  formatPlannerDate,
} from "@/app/lib/study-plan";
import {
  CreateStudyPlanPayload,
  StudyPlanDuration,
  StudyPlanItem,
  studyPlansService,
} from "@/app/services/motqin";
import { GoalPicker } from "@/components/Planner/GoalPicker";
import { DurationFields } from "@/components/ui/DurationFields";
import { useBoardDrag } from "@/app/hooks/useBoardDrag";
import { BoardDragGhost } from "@/components/Planner/BoardDragGhost";
import type { BoardDrag, DropResolution } from "@/components/DayCard";
import { ConfirmDialog } from "@/components/ExecutionBoard/ConfirmDialog";

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";

// ---------------------------------------------------------------------------
// Task form shown inside an expanded day card: adds a task for the card's
// day, or — given `item` — edits that task in place (title, goal, duration;
// the lesson link can't change, same as the execution board's dialog).
// ---------------------------------------------------------------------------
function NextWeekTaskForm({
  date,
  item,
  onDone,
}: {
  date: string;
  item?: StudyPlanItem;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const isEditing = Boolean(item);
  const [source, setSource] = useState<"systematic" | "regular">("regular");
  const [subjectId, setSubjectId] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [title, setTitle] = useState(item?.title ?? "");
  const [goalCategoryId, setGoalCategoryId] = useState<number | null>(item?.goalCategoryId ?? null);
  const [duration, setDuration] = useState(String(item?.durationInMinutes ?? 60));

  const { data: subjects } = useGetSubjects();
  const { data: lessonsData, isFetching: lessonsLoading } =
    useGetLessons(subjectId);
  const selectedLesson = lessonsData?.lessons?.find(
    (lesson) => String(lesson.lessonId) === lessonId,
  );
  const resolvedTitle =
    source === "systematic" && !isEditing ? (selectedLesson?.title ?? "") : title.trim();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!resolvedTitle) throw new Error("title-required");
      if (!duration || Number(duration) <= 0)
        throw new Error("duration-required");
      if (item) {
        return studyPlansService.update(item.id, {
          title: resolvedTitle,
          goalCategoryId,
          durationInMinutes: Number(duration),
        });
      }
      if (source === "systematic" && (!subjectId || !lessonId))
        throw new Error("lesson-required");

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
      toast.success(isEditing ? "تم تحديث المهمة" : "تمت إضافة المهمة");
      onDone();
    },
    onError: (error) =>
      toast.error(
        error.message === "title-required"
          ? "العنوان مطلوب."
          : error.message === "lesson-required"
            ? "يرجى اختيار المادة والدرس."
            : error.message === "duration-required"
              ? "المدة يجب أن تكون أكبر من صفر."
              : "حدث خطأ أثناء حفظ المهمة.",
      ),
  });

  return (
    <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
      {!isEditing && <div className="flex gap-1.5 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
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
            {value === "systematic" ? "مهمة مرتبطة بمواد الدراسة" : "مهمة أخرى"}
          </button>
        ))}
      </div>}

      {source === "systematic" && !isEditing ? (
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
              <option value="">
                {lessonsLoading ? "جاري التحميل..." : "اختر الدرس"}
              </option>
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
          الأسم
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: قراءة الفصل الثاني"
            className={cn(inputClass, "mt-1")}
          />
        </label>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 ">
          فئة الهدف
          <span className="font-normal text-zinc-400 ">(اختياري)</span>
          <div className="mt-1">
            <GoalPicker
              value={goalCategoryId}
              onChange={(id) => setGoalCategoryId(id)}
              className="rounded-lg border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>
        </div>
        <DurationFields
          minutes={Number(duration)}
          onChange={(total) => setDuration(String(total))}
          label="المدة"
          labelClassName="text-xs font-semibold text-zinc-600 dark:text-zinc-300 flex gap-2 items-center"
          inputClassName={inputClass}
        />
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
          {mutation.isPending ? "جاري الحفظ..." : isEditing ? "حفظ التعديل" : "إضافة المهمة"}
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
  onEdit,
  onDelete,
  editing,
  onEditDone,
  boardDrag,
  onTaskPointerDown,
  registerDropResolver,
}: {
  index: number;
  dayName: string;
  date: string;
  items: StudyPlanItem[];
  expanded: boolean;
  onToggle: () => void;
  onEdit: (item: StudyPlanItem) => void;
  onDelete: (item: StudyPlanItem) => void;
  // The task of this day being edited in the expanded form, if any.
  editing: StudyPlanItem | null;
  onEditDone: () => void;
  // Drag and drop runs on pointer events owned by the board (useBoardDrag)
  // — the card reports presses on its rows, tells the board it accepts
  // drops, and lights up while it's the target.
  boardDrag: BoardDrag | null;
  onTaskPointerDown: (taskId: string, event: React.PointerEvent) => void;
  registerDropResolver: (dayIndex: number, resolve: ((clientY: number) => DropResolution) | null) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  // Next week keeps no order, so any height in the column is the same
  // drop: registering a resolver is what marks the day as a target.
  useEffect(() => {
    registerDropResolver(index, () => ({ index: 0 }));
    return () => registerDropResolver(index, null);
  }, [registerDropResolver, index]);
  const dragOver = Boolean(boardDrag?.active) && boardDrag?.targetDayIndex === index;
  const liftedId = boardDrag?.active ? boardDrag.taskId : null;
  const totalMinutes = items.reduce(
    (sum, item) => sum + item.durationInMinutes,
    0,
  );

  const collapse = () => {
    setShowForm(false);
    onEditDone();
    onToggle();
  };
  const formOpen = showForm || editing !== null;

  // From the collapsed card: expand straight into the add-task form.
  const openForm = () => {
    setShowForm(true);
    if (!expanded) onToggle();
  };

  return (
    <div
      dir="rtl"
      data-day-index={index}
      onClick={expanded ? undefined : onToggle}
      className={cn(
        "flex h-full min-w-0 flex-col overflow-hidden bg-white transition-all duration-300 dark:bg-zinc-900",
        expanded
          ? "flex-[3] shadow-inner"
          : "flex-1 cursor-pointer hover:bg-blue-50/40 dark:hover:bg-zinc-800/60",
        index !== 7 && "border-l border-zinc-200 dark:border-zinc-800",
        dragOver &&
          "bg-blue-50 ring-2 ring-inset ring-blue-400 dark:bg-blue-950/30",
      )}
    >
      {/* Header — always toggles */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (expanded) collapse();
          else onToggle();
        }}
        className={cn(
          "flex w-full items-center justify-between border-b border-zinc-100 p-3 text-right dark:border-zinc-800",
          expanded ? "bg-blue-600/30" : "bg-blue-600/20",
        )}
      >
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            {dayName}
          </h3>
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
          <p className="py-3 text-center text-xs text-zinc-400">
            لا توجد مهام بعد
          </p>
        ) : (
          <ul className="space-y-1.5">
            {items.map((item) => (
              <li
                key={item.id}
                title={item.title}
                onPointerDown={(e) => onTaskPointerDown(String(item.id), e)}
                style={{ touchAction: "none" }}
                className={cn(
                  "flex cursor-grab select-none items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-sm text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:shadow-md active:cursor-grabbing dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300 dark:hover:border-zinc-600",
                  liftedId === String(item.id) && "opacity-40",
                  editing?.id === item.id && "border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/30",
                )}
              >
                <span className="min-w-0 flex-1 truncate">{item.title}</span>
                {expanded && (
                  <span className="shrink-0 text-xs text-zinc-400">
                    {item.durationInMinutes} د
                  </span>
                )}
                <span className="flex shrink-0 items-center gap-0.5">
                  <button
                    type="button"
                    title="تعديل المهمة"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(item);
                    }}
                    className="flex size-6 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-blue-600 dark:hover:bg-zinc-700"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    title="حذف المهمة"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(item);
                    }}
                    className="flex size-6 items-center justify-center rounded-md text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                  >
                    <Trash2 size={13} />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}

        {!expanded && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openForm();
            }}
            title="إضافة مهمة لهذا اليوم"
            className="mt-auto flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-blue-300 px-2 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950/40"
          >
            <Plus size={14} />
            إضافة مهمة
          </button>
        )}

        {expanded && (
          <div className="mt-auto border-t border-zinc-100 pt-3 dark:border-zinc-800">
            {formOpen ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm font-bold text-zinc-800 dark:text-zinc-100">
                    {editing ? (
                      <Pencil size={16} className="text-blue-600" />
                    ) : (
                      <BookOpen size={16} className="text-blue-600" />
                    )}
                    {editing ? `تعديل: ${editing.title}` : "إضافة مهمة"}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowForm(false);
                      onEditDone();
                    }}
                    title="إغلاق"
                    className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                  >
                    <X size={16} />
                  </button>
                </div>
                {/* Keyed so switching between tasks (or to "add") resets the fields. */}
                <NextWeekTaskForm
                  key={editing ? `edit-${editing.id}` : "add"}
                  date={date}
                  item={editing ?? undefined}
                  onDone={() => {
                    setShowForm(false);
                    onEditDone();
                  }}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openForm();
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
  const queryClient = useQueryClient();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [editing, setEditing] = useState<StudyPlanItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<StudyPlanItem | null>(
    null,
  );

  const queryKey = ["study-plans", "week", 1, dates[0], dates[6]];
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      studyPlansService.filter({
        duration: StudyPlanDuration.NextWeek,
        startDate: dates[0],
        endDate: dates[6],
      }),
  });

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["study-plans"] });

  const deleteMutation = useMutation({
    mutationFn: (item: StudyPlanItem) => studyPlansService.remove(item.id),
    onSuccess: () => {
      toast.success("تم حذف المهمة");
      refresh();
    },
    onError: () => toast.error("تعذر حذف المهمة"),
    onSettled: () => setPendingDelete(null),
  });

  // Pointer-based drag between days (the same hook as the week board);
  // a drop hands the target day's date to moveTask.
  const {
    drag: boardDrag,
    onTaskPointerDown,
    registerDropResolver,
    shouldSuppressClick,
  } = useBoardDrag({
    tasks: (data?.items ?? []).map((item) => ({ id: String(item.id), title: item.title })),
    onDrop: (taskId, dayIndex) => void moveTask(taskId, dates[dayIndex - 1]),
  });

  // Dragging a task onto another day: PUT the new date, shown right away
  // and confirmed (or reverted) by the refetch. Nothing else changes —
  // next week's tasks have no priority order yet.
  const moveTask = async (taskId: string, targetDate: string) => {
    const moved = data?.items.find((item) => String(item.id) === taskId);
    if (!moved || moved.date === targetDate) return;
    queryClient.setQueryData<typeof data>(
      queryKey,
      (current) =>
        current && {
          ...current,
          items: current.items.map((item) =>
            item.id === moved.id ? { ...item, date: targetDate } : item,
          ),
        },
    );
    try {
      await studyPlansService.update(moved.id, { date: targetDate });
      toast.success(`تم نقل المهمة إلى ${formatPlannerDate(targetDate)}`);
    } catch {
      toast.error("تعذر نقل المهمة إلى هذا اليوم");
    } finally {
      refresh();
    }
  };

  return (
    <div dir="rtl" className="mt-6 space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          {/* <CalendarDays className="text-blue-600 dark:text-blue-400" size={20} />
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">الأسبوع القادم</h2>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {formatPlannerDate(dates[0])} - {formatPlannerDate(dates[6])}
          </span> */}
        </div>
        <p className="text-xs text-zinc-400">
          اضغط على أي يوم لإضافة مهام له، واسحب المهمة لنقلها إلى يوم آخر
        </p>
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
              onToggle={() => {
                // The click that ends a drag must not open/close the day.
                if (shouldSuppressClick()) return;
                setExpandedIndex((prev) =>
                  prev === day.index ? null : day.index,
                );
              }}
              onEdit={(item) => {
                setEditing(item);
                setExpandedIndex(day.index);
              }}
              onDelete={setPendingDelete}
              editing={editing?.date === date ? editing : null}
              onEditDone={() => setEditing(null)}
              boardDrag={boardDrag}
              onTaskPointerDown={onTaskPointerDown}
              registerDropResolver={registerDropResolver}
            />
          );
        })}
      </div>

      <BoardDragGhost drag={boardDrag} />

      {isLoading && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          جاري تحميل مهام الأسبوع القادم...
        </p>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="حذف المهمة"
          description={`سيتم حذف «${pendingDelete.title}» من خطة الأسبوع القادم.`}
          confirmLabel={deleteMutation.isPending ? "جاري الحذف..." : "حذف"}
          onConfirm={() => deleteMutation.mutate(pendingDelete)}
          onClose={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
