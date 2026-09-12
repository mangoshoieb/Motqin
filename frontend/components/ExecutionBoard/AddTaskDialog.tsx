"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, X } from "lucide-react";
import { toast } from "sonner";

import { useGetLessons } from "@/app/hooks/useGetLessons";
import { useGetSubjects } from "@/app/hooks/useGetSubjects";
import {
  CreateStudyPlanPayload,
  studyPlansService,
} from "@/app/services/motqin";
import { cn } from "@/app/lib/utils";
import { ExecutionSession, ExecutionTask } from "@/app/types/execution-board.types";
import { studySessionToExecutionSession } from "@/app/lib/study-plan";
import { GoalPicker } from "@/components/Planner/GoalPicker";

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";

interface AddTaskDialogProps {
  date: string;
  // `sessions` are the ones the backend generated for a newly created task.
  onCreated: (task: ExecutionTask, sessions: ExecutionSession[]) => void;
  onClose: () => void;
  task?: ExecutionTask;
}

export const AddTaskDialog = ({ date, onCreated, onClose, task }: AddTaskDialogProps) => {
  const queryClient = useQueryClient();
  const isEditing = Boolean(task);
  const [source, setSource] = useState<"systematic" | "regular">("regular");
  const [subjectId, setSubjectId] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [title, setTitle] = useState(task?.title ?? "");
  const [goalCategoryId, setGoalCategoryId] = useState<number | null>(task?.goalCategoryId ?? null);
  const [duration, setDuration] = useState(String(task?.estimatedMinutes ?? 60));
  const { data: subjects } = useGetSubjects();
  const { data: lessonsData, isFetching: lessonsLoading } = useGetLessons(subjectId);
  const selectedLesson = lessonsData?.lessons?.find((lesson) => String(lesson.lessonId) === lessonId);
  const resolvedTitle = source === "systematic" ? selectedLesson?.title ?? "" : title.trim();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!resolvedTitle) throw new Error("title-required");
      if (isEditing && task) {
        return studyPlansService.update(Number(task.id), {
          title: resolvedTitle,
          goalCategoryId,
        });
      }
      if (source === "systematic" && (!subjectId || !lessonId)) {
        throw new Error("lesson-required");
      }
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
    onSuccess: (created) => {
      const taskId = String(created.id ?? task?.id ?? crypto.randomUUID());
      const sessions = (created.studySessions ?? []).map((session) =>
        studySessionToExecutionSession(session, taskId, created.title),
      );
      onCreated({
        ...task,
        id: taskId,
        kind: task?.kind ?? "daily",
        title: created.title,
        goalCategoryId: created.goalCategoryId ?? goalCategoryId ?? undefined,
        priority: created.priority ?? task?.priority,
        subjectName: subjects?.find((subject) => subject.subjectID === Number(subjectId))?.name,
        estimatedMinutes: created.durationInMinutes,
        completed: task?.completed ?? false,
        quizLink: task?.quizLink,
      }, sessions);
       queryClient.invalidateQueries({ queryKey: ["study-plans"] });
      toast.success(isEditing ? "تم تحديث المهمة" : "تمت إضافة المهمة");
      onClose();
    },
    onError: (error) => toast.error(error.message === "title-required" ? "العنوان مطلوب." : error.message === "lesson-required" ? "يرجى اختيار المادة والدرس." : error.message === "duration-required" ? "المدة يجب أن تكون أكبر من صفر." : "حدث خطأ أثناء حفظ المهمة."),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" dir="rtl">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2"><BookOpen className="text-blue-600" size={20} /><h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">إضافة مهمة</h2></div>
          <button type="button" onClick={onClose} title="إغلاق" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white"><X size={20} /></button>
        </div>

        {!isEditing && <div className="mb-5 flex gap-2 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
          {(["systematic", "regular"] as const).map((value) => (
            <button key={value} type="button" onClick={() => setSource(value)} className={cn("flex-1 rounded-lg px-3 py-2 text-sm font-semibold", source === value ? "bg-white text-blue-700 shadow-sm dark:bg-zinc-900 dark:text-blue-400" : "text-zinc-500")}>{value === "systematic" ? "مهمة مرتبطة بالتطبيق" : "مهمة عادية"}</button>
          ))}
        </div>}

        {isEditing ? (
          <label className="block text-sm text-zinc-700 dark:text-zinc-300">عنوان المهمة<input value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass} /></label>
        ) : source === "systematic" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm text-zinc-700 dark:text-zinc-300">المادة<select value={subjectId} onChange={(event) => { setSubjectId(event.target.value); setLessonId(""); }} className={inputClass}><option value="">اختر المادة</option>{subjects?.map((subject) => <option key={subject.subjectID} value={subject.subjectID}>{subject.name}</option>)}</select></label>
            <label className="text-sm text-zinc-700 dark:text-zinc-300">الدرس<select value={lessonId} onChange={(event) => setLessonId(event.target.value)} disabled={!subjectId || lessonsLoading} className={inputClass}><option value="">{lessonsLoading ? "جاري التحميل..." : "اختر الدرس"}</option>{lessonsData?.lessons?.map((lesson) => <option key={lesson.lessonId} value={lesson.lessonId}>{lesson.title}</option>)}</select></label>
          </div>
        ) : (
          <label className="block text-sm text-zinc-700 dark:text-zinc-300">عنوان المهمة<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="مثال: قراءة الفصل الثاني" className={inputClass} /></label>
        )}

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="text-sm text-zinc-700 dark:text-zinc-300">فئة الهدف <span className="text-xs text-zinc-400">(اختياري)</span><div className="mt-1"><GoalPicker value={goalCategoryId} onChange={(id) => setGoalCategoryId(id)} className="rounded-lg border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800" /></div></div>
          {!isEditing && <label className="text-sm text-zinc-700 dark:text-zinc-300">المدة بالدقائق<input type="number" min={1} value={duration} onChange={(event) => setDuration(event.target.value)} className={inputClass} /></label>}
        </div>

        <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg border border-zinc-200 px-4 py-2 text-sm dark:border-zinc-700">إلغاء</button><button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending} className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">{mutation.isPending ? "جاري الحفظ..." : isEditing ? "حفظ التعديل" : "إضافة المهمة"}</button></div>
      </div>
    </div>
  );
};