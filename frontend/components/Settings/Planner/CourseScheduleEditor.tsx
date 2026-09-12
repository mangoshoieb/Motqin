"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Check, Clock, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { useGetSubjects } from "@/app/hooks/useGetSubjects";
import { cn } from "@/app/lib/utils";
import { CourseSchedule, courseSchedulesService } from "@/app/services/motqin";
import { WEEKDAYS, WeekDay } from "@/app/types/planner-preferences.types";

const inputClass =
  "rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-blue-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-blue-500";

const dayNumbers: Record<WeekDay, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

interface Draft {
  subjectId: string;
  startTime: string;
  endTime: string;
}

const emptyDraft: Draft = { subjectId: "", startTime: "09:00", endTime: "10:00" };

// The backend stores a lecture as a full datetime; we anchor it to the
// matching weekday of the current week so only the weekday + time matter.
const getWeekDate = (day: WeekDay, time: string) => {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  date.setDate(date.getDate() - date.getDay() + dayNumbers[day]);
  const [hours, minutes] = time.split(":").map(Number);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
};

const getTime = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

const dayOf = (schedule: CourseSchedule): WeekDay | undefined =>
  WEEKDAYS.find(({ key }) => new Date(schedule.startTime).getDay() === dayNumbers[key])?.key;

// Subject + from/to row, used for both adding under a day and editing a row.
function LectureForm({
  draft,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
  pending,
  subjects,
  subjectsLoading,
}: {
  draft: Draft;
  onChange: (next: Draft) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
  pending: boolean;
  subjects?: { subjectID: number; name: string }[];
  subjectsLoading: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 rounded-xl border border-blue-200 bg-blue-50/40 p-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end dark:border-blue-900/50 dark:bg-blue-950/20">
      <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-300">
        المادة
        <select
          autoFocus
          value={draft.subjectId}
          onChange={(e) => onChange({ ...draft, subjectId: e.target.value })}
          disabled={subjectsLoading || pending}
          className={inputClass}
        >
          <option value="">اختر المادة</option>
          {subjects?.map((subject) => (
            <option key={subject.subjectID} value={subject.subjectID}>
              {subject.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-300">
        من
        <input
          type="time"
          value={draft.startTime}
          onChange={(e) => onChange({ ...draft, startTime: e.target.value })}
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-300">
        إلى
        <input
          type="time"
          value={draft.endTime}
          onChange={(e) => onChange({ ...draft, endTime: e.target.value })}
          className={inputClass}
        />
      </label>
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={onSubmit}
          disabled={pending}
          className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Check size={14} />
          {pending ? "جاري الحفظ..." : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          title="إلغاء"
          className="flex items-center rounded-lg border border-zinc-200 px-2.5 py-2 text-xs text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

export const CourseScheduleEditor = () => {
  const queryClient = useQueryClient();
  const { data: subjects, isPending: subjectsLoading } = useGetSubjects();
  const { data: schedules = [], isPending: schedulesLoading } = useQuery({
    queryKey: ["course-schedules"],
    queryFn: courseSchedulesService.getAll,
  });

  // Which day has its add form open, and which lecture row is being edited.
  const [addingDay, setAddingDay] = useState<WeekDay | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["course-schedules"] });

  const closeForms = () => {
    setAddingDay(null);
    setEditingId(null);
    setDraft(emptyDraft);
  };

  const saveMutation = useMutation({
    mutationFn: async ({ day, id }: { day: WeekDay; id: number | null }) => {
      if (!draft.subjectId) throw new Error("subject-required");
      if (draft.startTime >= draft.endTime) throw new Error("invalid-time-range");

      const payload = {
        subjectId: Number(draft.subjectId),
        startTime: getWeekDate(day, draft.startTime),
        endTime: getWeekDate(day, draft.endTime),
      };
      return id === null
        ? courseSchedulesService.create(payload)
        : courseSchedulesService.update(id, payload);
    },
    onSuccess: (_, { id }) => {
      toast.success(id === null ? "تمت إضافة المحاضرة" : "تم تحديث المحاضرة");
      closeForms();
      refresh();
    },
    onError: (error) =>
      toast.error(
        error.message === "invalid-time-range"
          ? "وقت النهاية يجب أن يكون بعد وقت البداية."
          : error.message === "subject-required"
            ? "يرجى اختيار المادة."
            : "حدث خطأ أثناء حفظ المحاضرة.",
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: courseSchedulesService.remove,
    onSuccess: () => {
      toast.success("تم حذف المحاضرة");
      refresh();
    },
    onError: () => toast.error("حدث خطأ أثناء حذف المحاضرة."),
  });

  const openAdd = (day: WeekDay) => {
    setEditingId(null);
    setAddingDay(day);
    setDraft(emptyDraft);
  };

  const openEdit = (schedule: CourseSchedule) => {
    setAddingDay(null);
    setEditingId(schedule.id);
    setDraft({
      subjectId: String(schedule.subjectId),
      startTime: getTime(schedule.startTime),
      endTime: getTime(schedule.endTime),
    });
  };

  const subjectName = (id: number) =>
    subjects?.find((subject) => subject.subjectID === id)?.name ?? `مادة ${id}`;

  const byDay = WEEKDAYS.map(({ key, label }) => ({
    key,
    label,
    lectures: schedules
      .filter((schedule) => dayOf(schedule) === key)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
  }));

  if (schedulesLoading) {
    return <p className="text-sm text-zinc-500">جاري التحميل...</p>;
  }

  return (
    <div className="space-y-3">
      {byDay.map(({ key, label, lectures }) => {
        const isAdding = addingDay === key;

        return (
          <section
            key={key}
            className={cn(
              "rounded-xl border p-3 transition-colors",
              isAdding
                ? "border-blue-200 dark:border-blue-900/50"
                : "border-zinc-200 dark:border-zinc-800",
            )}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-sm font-bold text-zinc-800 dark:text-zinc-200">
                {label}
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  {lectures.length === 0 ? "لا محاضرات" : `${lectures.length} محاضرة`}
                </span>
              </h3>
              {!isAdding && (
                <button
                  type="button"
                  onClick={() => openAdd(key)}
                  className="flex items-center gap-1 rounded-lg border border-dashed border-blue-300 px-2.5 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950/40"
                >
                  <Plus size={14} />
                  إضافة محاضرة
                </button>
              )}
            </div>

            {lectures.length > 0 && (
              <ul className="space-y-1.5">
                {lectures.map((schedule) =>
                  editingId === schedule.id ? (
                    <li key={schedule.id}>
                      <LectureForm
                        draft={draft}
                        onChange={setDraft}
                        onSubmit={() => saveMutation.mutate({ day: key, id: schedule.id })}
                        onCancel={closeForms}
                        submitLabel="حفظ"
                        pending={saveMutation.isPending}
                        subjects={subjects}
                        subjectsLoading={subjectsLoading}
                      />
                    </li>
                  ) : (
                    <li
                      key={schedule.id}
                      className="flex items-center gap-2 rounded-lg bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-800/60"
                    >
                      <BookOpen size={15} className="shrink-0 text-blue-600 dark:text-blue-400" />
                      <span className="min-w-0 flex-1 truncate font-medium text-zinc-800 dark:text-zinc-200">
                        {subjectName(schedule.subjectId)}
                      </span>
                      <span className="flex shrink-0 items-center gap-1 rounded-md bg-white px-2 py-0.5 text-xs tabular-nums text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                        <Clock size={12} />
                        {getTime(schedule.startTime)} – {getTime(schedule.endTime)}
                      </span>
                      <button
                        type="button"
                        title="تعديل"
                        onClick={() => openEdit(schedule)}
                        className="text-zinc-400 transition hover:text-blue-600"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        title="حذف"
                        onClick={() => deleteMutation.mutate(schedule.id)}
                        className="text-zinc-400 transition hover:text-red-600"
                      >
                        <Trash2 size={15} />
                      </button>
                    </li>
                  ),
                )}
              </ul>
            )}

            {isAdding && (
              <div className={cn(lectures.length > 0 && "mt-2")}>
                <LectureForm
                  draft={draft}
                  onChange={setDraft}
                  onSubmit={() => saveMutation.mutate({ day: key, id: null })}
                  onCancel={closeForms}
                  submitLabel="إضافة"
                  pending={saveMutation.isPending}
                  subjects={subjects}
                  subjectsLoading={subjectsLoading}
                />
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
};
