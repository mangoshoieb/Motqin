"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FileText, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import {
  useCreateLesson,
  useDeleteLesson,
  useGetLessons,
  useUpdateLesson,
} from "@/app/hooks/useGetLessons";
import { useGetSubjects } from "@/app/hooks/useGetSubjects";
import { getApiErrorMessage } from "@/app/lib/api-error";
import type { CustomLessonPayload } from "@/app/services/lesson.service";
import { LessonCardClient } from "@/components/LessonCard.client";
import { LessonFormDialog } from "@/components/LessonFormDialog";
import { PdfLessonDialog } from "@/components/PdfLessonDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";

import { useParams, useRouter } from "next/navigation";
import { MotqinPreferencesLink } from "@/components/Settings/Motqin/MotqinPreferencesLink";

const iconButtonClass =
  "p-2 rounded-full bg-white/90 border border-zinc-200 text-zinc-500 transition hover:text-zinc-900 hover:bg-zinc-50";

export const SubjectPage = () => {
  const params = useParams()
  const router = useRouter();
  const subjectId = params.subjectId as string;
  const id = subjectId.split("-")[0];
  // Already ordered system lessons first, then the student's own.
  const { data, isLoading, error } = useGetLessons(id);
  const { data: subjects } = useGetSubjects();
  const subject = subjects?.find((s) => String(s.subjectID) === id);

  const createLesson = useCreateLesson();
  const updateLesson = useUpdateLesson();
  const deleteLesson = useDeleteLesson();

  const [isAdding, setIsAdding] = useState(false);
  const [isAddingFromPdf, setIsAddingFromPdf] = useState(false);
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [deleting, setDeleting] = useState<Lesson | null>(null);

  if (isLoading) return <div dir="rtl" className="p-10 text-zinc-500">جاري تحميل الدروس...</div>;

  if (error) return <div dir="rtl" className="p-10 text-red-600">حدث خطأ ما، حاول مرة أخرى.</div>;

  const handleCreate = (payload: CustomLessonPayload) =>
    createLesson.mutate(
      { subjectId: Number(id), ...payload },
      {
        onSuccess: () => {
          setIsAdding(false);
          toast.success("تمت إضافة الدرس");
        },
        onError: (err) => toast.error(getApiErrorMessage(err)),
      },
    );

  // Create the lesson, then open it with the PDF popup waiting (?ai=pdf) —
  // step 2, the upload, happens on the lesson's own page.
  const handleCreateFromPdf = (title: string) =>
    createLesson.mutate(
      { subjectId: Number(id), title },
      {
        onSuccess: (created) => {
          if (!created?.lessonId) {
            setIsAddingFromPdf(false);
            toast.success("تمت إضافة الدرس");
            return;
          }
          router.push(`/subjects/${subjectId}/${created.lessonId}?ai=pdf`);
        },
        onError: (err) => toast.error(getApiErrorMessage(err)),
      },
    );

  const handleUpdate = (payload: CustomLessonPayload) => {
    if (!editing) return;
    updateLesson.mutate(
      { id: editing.lessonId, ...payload },
      {
        onSuccess: () => {
          setEditing(null);
          toast.success("تم تعديل الدرس");
        },
        onError: (err) => toast.error(getApiErrorMessage(err)),
      },
    );
  };

  const handleDelete = () => {
    if (!deleting) return;
    const lessonId = deleting.lessonId;
    setDeleting(null);
    deleteLesson.mutate(lessonId, {
      onSuccess: () => toast.success("تم حذف الدرس"),
      onError: (err) => toast.error(getApiErrorMessage(err)),
    });
  };

  return (
    <div dir="rtl" className="p-10 flex-col gap-10 ">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h1 className="text-3xl text-blue-950 font-bold">{subject?.name ?? "الدروس"}</h1>
        <div className="flex flex-wrap items-center gap-3">
          <MotqinPreferencesLink />
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 text-white font-semibold transition hover:bg-blue-700"
          >
            <Plus className="size-4" />
            إضافة درس
          </button>
          <button
            type="button"
            onClick={() => setIsAddingFromPdf(true)}
            className="group relative inline-flex items-center gap-2 overflow-hidden px-5 py-2.5 rounded-full bg-gradient-to-l from-indigo-600 to-blue-400 text-white font-semibold shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40"
          >
            {/* Light sweep on hover */}
            <span className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer" />
            <FileText className="size-4" />
            إنشاء درس من PDF
            <Sparkles className="size-3.5 transition-transform group-hover:rotate-12" />
          </button>
        </div>
      </div>

      {data?.lessons?.length === 0 && (
        <p className="text-zinc-500">لا توجد دروس بعد.</p>
      )}

      {data?.lessons?.map((lesson: Lesson) => (
        <LessonCardClient
          key={lesson.lessonId}
          name={lesson.title}
          href={`/subjects/${subjectId}/${lesson.lessonId}`}
          // Only the student's own lessons can be edited or deleted;
          // system lessons are read-only.
          badge={
            lesson.isMine && (
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                درسي
              </span>
            )
          }
          actions={
            lesson.isMine && (
              <>
                <button
                  type="button"
                  aria-label={`تعديل ${lesson.title}`}
                  onClick={() => setEditing(lesson)}
                  className={iconButtonClass}
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label={`حذف ${lesson.title}`}
                  onClick={() => setDeleting(lesson)}
                  className={`${iconButtonClass} hover:!text-red-600`}
                >
                  <Trash2 className="size-4" />
                </button>
              </>
            )
          }
        />
      ))}

      {isAdding && (
        <LessonFormDialog
          title="إضافة درس"
          submitLabel="إضافة"
          isPending={createLesson.isPending}
          onSubmit={handleCreate}
          onCancel={() => setIsAdding(false)}
        />
      )}

      {isAddingFromPdf && (
        <PdfLessonDialog
          isPending={createLesson.isPending}
          onSubmit={handleCreateFromPdf}
          onCancel={() => setIsAddingFromPdf(false)}
        />
      )}

      {editing && (
        <LessonFormDialog
          title="تعديل الدرس"
          submitLabel="حفظ"
          initialLesson={editing}
          isPending={updateLesson.isPending}
          onSubmit={handleUpdate}
          onCancel={() => setEditing(null)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="حذف الدرس؟"
          message={`سيُزال "${deleting.title}" من قائمتك، وتظل الخطط والجلسات والأسئلة المرتبطة به تعمل كما هي.`}
          confirmLabel="حذف"
          cancelLabel="إلغاء"
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div >
  );
};


export default SubjectPage;
