"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { useGetSubjects } from "@/app/hooks/useGetSubjects";
import {
  CourseSchedule,
  courseSchedulesService,
} from "@/app/services/motqin";
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
  days: WeekDay[];
  startTime: string;
  endTime: string;
}

const emptyDraft: Draft = {
  subjectId: "",
  days: [],
  startTime: "09:00",
  endTime: "10:00",
};

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
    : `${String(date.getHours()).padStart(2, "0")}:${String(
        date.getMinutes(),
      ).padStart(2, "0")}`;
};

const scheduleId = (schedule: CourseSchedule) => schedule.id;

export const CourseScheduleEditor = () => {
  const queryClient = useQueryClient();
  const { data: subjects, isPending: subjectsLoading } = useGetSubjects();
  const { data: schedules = [], isPending: schedulesLoading } = useQuery({
    queryKey: ["course-schedules"],
    queryFn: courseSchedulesService.getAll,
  });
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<number | null>(null);

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["course-schedules"] });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!draft.subjectId || draft.days.length === 0) {
        throw new Error("subject-and-days-required");
      }
      if (draft.startTime >= draft.endTime) {
        throw new Error("invalid-time-range");
      }

      const payload = (day: WeekDay) => ({
        subjectId: Number(draft.subjectId),
        startTime: getWeekDate(day, draft.startTime),
        endTime: getWeekDate(day, draft.endTime),
      });

      if (editingId !== null) {
        return courseSchedulesService.update(editingId, payload(draft.days[0]));
      }

      return Promise.all(draft.days.map((day) => courseSchedulesService.create(payload(day))));
    },
    onSuccess: () => {
      toast.success(editingId === null ? "تمت إضافة جدول المادة" : "تم تحديث جدول المادة");
      setDraft(emptyDraft);
      setEditingId(null);
      refresh();
    },
    onError: (error) => {
      const message =
        error.message === "invalid-time-range"
          ? "وقت النهاية يجب أن يكون بعد وقت البداية."
          : error.message === "subject-and-days-required"
            ? "يرجى اختيار المادة ويوم واحد على الأقل."
            : "حدث خطأ أثناء حفظ جدول المادة.";
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: courseSchedulesService.remove,
    onSuccess: () => {
      toast.success("تم حذف جدول المادة");
      refresh();
    },
    onError: () => toast.error("حدث خطأ أثناء حذف جدول المادة."),
  });

  const toggleDay = (day: WeekDay) => {
    setDraft((current) => ({
      ...current,
      days: current.days.includes(day)
        ? current.days.filter((selectedDay) => selectedDay !== day)
        : [...current.days, day],
    }));
  };

  const editSchedule = (schedule: CourseSchedule) => {
    const day = WEEKDAYS.find(
      ({ key }) => new Date(schedule.startTime).getDay() === dayNumbers[key],
    )?.key;
    if (!day) return;
    setEditingId(scheduleId(schedule));
    setDraft({
      subjectId: String(schedule.subjectId),
      days: [day],
      startTime: getTime(schedule.startTime),
      endTime: getTime(schedule.endTime),
    });
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto_auto] lg:items-end">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          المادة
          <select
            value={draft.subjectId}
            onChange={(event) => setDraft({ ...draft, subjectId: event.target.value })}
            disabled={subjectsLoading || saveMutation.isPending}
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

        <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          من
          <input type="time" value={draft.startTime} onChange={(event) => setDraft({ ...draft, startTime: event.target.value })} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          إلى
          <input type="time" value={draft.endTime} onChange={(event) => setDraft({ ...draft, endTime: event.target.value })} className={inputClass} />
        </label>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">أيام المحاضرة</p>
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map(({ key, label }) => (
            <label key={key} className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700">
              <input type="checkbox" checked={draft.days.includes(key)} onChange={() => toggleDay(key)} disabled={saveMutation.isPending} />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
          <Plus size={16} />
          {saveMutation.isPending ? "جاري الحفظ..." : editingId === null ? "إضافة جدول" : "حفظ التعديل"}
        </button>
        {editingId !== null && (
          <button type="button" onClick={() => { setDraft(emptyDraft); setEditingId(null); }} className="flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-300">
            <X size={16} /> إلغاء
          </button>
        )}
      </div>

      <div className="space-y-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">الجداول المضافة</h3>
        {schedulesLoading && <p className="text-sm text-zinc-500">جاري التحميل...</p>}
        {!schedulesLoading && schedules.length === 0 && <p className="text-sm text-zinc-500 dark:text-zinc-400">لم تتم إضافة جداول بعد.</p>}
        {schedules.map((schedule) => (
          <div key={scheduleId(schedule)} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700">
            <span className="text-zinc-700 dark:text-zinc-300">
              {subjects?.find((subject) => subject.subjectID === schedule.subjectId)?.name ?? `مادة ${schedule.subjectId}`} - {new Date(schedule.startTime).toLocaleDateString("ar", { weekday: "long" })} من {getTime(schedule.startTime)} إلى {getTime(schedule.endTime)}
            </span>
            <span className="flex gap-2">
              <button type="button" title="تعديل" onClick={() => editSchedule(schedule)} className="text-zinc-500 hover:text-blue-600"><Pencil size={16} /></button>
              <button type="button" title="حذف" onClick={() => deleteMutation.mutate(scheduleId(schedule))} className="text-zinc-500 hover:text-red-600"><Trash2 size={16} /></button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};