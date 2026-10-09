"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { SubjectCardClient } from "@/components/SubjectCard.client";
import { SubjectNameDialog } from "@/components/SubjectNameDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  useCreateSubject,
  useDeleteSubject,
  useGetSubjects,
  useUpdateSubject,
} from "@/app/hooks/useGetSubjects";
import { getApiErrorMessage } from "@/app/lib/api-error";

const subjectHref = (subject: Subject) =>
  `/subjects/${subject.subjectID}-${subject.name.toLowerCase().replace(/\s+/g, "-")}`;

const iconButtonClass =
  "p-2 rounded-full bg-white/90 border border-zinc-200 text-zinc-500 transition hover:text-zinc-900 hover:bg-zinc-50";

const SubjectsPage = () => {
  // Already ordered system subjects first, then the student's own.
  const { data: subjects, isPending, isError } = useGetSubjects();
  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();
  const deleteSubject = useDeleteSubject();

  const [isAdding, setIsAdding] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [deleting, setDeleting] = useState<Subject | null>(null);

  const handleCreate = (name: string) =>
    createSubject.mutate(
      { name },
      {
        onSuccess: () => {
          setIsAdding(false);
          toast.success("تمت إضافة المادة");
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );

  const handleUpdate = (name: string) => {
    if (!editing) return;
    updateSubject.mutate(
      { id: editing.subjectID, name },
      {
        onSuccess: () => {
          setEditing(null);
          toast.success("تم تعديل اسم المادة");
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  };

  const handleDelete = () => {
    if (!deleting) return;
    const id = deleting.subjectID;
    setDeleting(null);
    deleteSubject.mutate(id, {
      onSuccess: () => toast.success("تم حذف المادة"),
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });
  };

  return (
    <div dir="rtl" className="bg-zinc-100 min-h-screen flex flex-col gap-6 px-10">
      {/* Header */}
      <div className="p-10 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl text-blue-950 font-bold">المواد الدراسية</h1>
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 text-white font-semibold transition hover:bg-blue-700"
        >
          <Plus className="size-4" />
          إضافة مادة
        </button>
      </div>

      {/* Subjects List */}
      <div className="flex flex-col gap-6 m-5 px-7">
        {isPending && <p className="text-zinc-500">جاري تحميل المواد...</p>}

        {isError && (
          <p className="text-red-600">تعذّر تحميل المواد. حاول مرة أخرى.</p>
        )}

        {subjects?.map((subject) => (
          <SubjectCardClient
            key={subject.subjectID}
            title={subject.name}
            href={subjectHref(subject)}
            // Only the student's own subjects can be renamed or deleted;
            // curriculum (system) subjects are read-only.
            badge={
              subject.isMine && (
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                  مادتي
                </span>
              )
            }
            actions={
              subject.isMine && (
                <>
                  <button
                    type="button"
                    aria-label={`تعديل ${subject.name}`}
                    onClick={() => setEditing(subject)}
                    className={iconButtonClass}
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`حذف ${subject.name}`}
                    onClick={() => setDeleting(subject)}
                    className={`${iconButtonClass} hover:!text-red-600`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </>
              )
            }
          ></SubjectCardClient>
        ))}
      </div>

      {isAdding && (
        <SubjectNameDialog
          title="إضافة مادة"
          submitLabel="إضافة"
          isPending={createSubject.isPending}
          onSubmit={handleCreate}
          onCancel={() => setIsAdding(false)}
        />
      )}

      {editing && (
        <SubjectNameDialog
          title="تعديل اسم المادة"
          submitLabel="حفظ"
          initialName={editing.name}
          isPending={updateSubject.isPending}
          onSubmit={handleUpdate}
          onCancel={() => setEditing(null)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="حذف المادة؟"
          message={`ستُزال "${deleting.name}" والدروس التي أضفتها تحتها من قائمتك، وتظل الخطط والجلسات المرتبطة بها تعمل كما هي.`}
          confirmLabel="حذف"
          cancelLabel="إلغاء"
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  );
};

export default SubjectsPage;
