"use client";

import { useState } from "react";
import { CalendarRange, Check, Pencil, Plus, Target, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import {
  useCreateUserGoal,
  useDeleteUserGoal,
  useUpdateUserGoal,
  useUserGoals,
} from "@/app/hooks/useUserGoals";
import { UserGoal } from "@/app/services/motqin";
import { cn } from "@/app/lib/utils";
import Skeleton from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ExecutionBoard/ConfirmDialog";

const fieldClass =
  "w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-blue-950";

interface GoalDraft {
  title: string;
  startDate: string;
  endDate: string;
}

const emptyDraft: GoalDraft = { title: "", startDate: "", endDate: "" };

const draftFrom = (goal: UserGoal): GoalDraft => ({
  title: goal.title,
  startDate: goal.startDate ?? "",
  endDate: goal.endDate ?? "",
});

const validateDraft = (draft: GoalDraft) => {
  if (!draft.title.trim()) return "عنوان الهدف مطلوب.";
  if (draft.startDate && draft.endDate && draft.endDate < draft.startDate) {
    return "تاريخ النهاية يجب أن يكون بعد تاريخ البداية.";
  }
  return null;
};

// Title + start/end date inputs, used for both the add row and inline edit.
function GoalFields({
  draft,
  onChange,
  onSubmit,
  autoFocus,
}: {
  draft: GoalDraft;
  onChange: (next: GoalDraft) => void;
  onSubmit: () => void;
  autoFocus?: boolean;
}) {
  const onEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
      <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
        عنوان الهدف
        <input
          autoFocus={autoFocus}
          value={draft.title}
          maxLength={250}
          onChange={(e) => onChange({ ...draft, title: e.target.value })}
          onKeyDown={onEnter}
          placeholder="مثال: إتقان الفصل الأول في الفيزياء"
          className={cn(fieldClass, "mt-1")}
        />
      </label>
      <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
        تاريخ البداية
        <input
          type="date"
          value={draft.startDate}
          onChange={(e) => onChange({ ...draft, startDate: e.target.value })}
          onKeyDown={onEnter}
          className={cn(fieldClass, "mt-1")}
        />
      </label>
      <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
        تاريخ النهاية
        <input
          type="date"
          value={draft.endDate}
          min={draft.startDate || undefined}
          onChange={(e) => onChange({ ...draft, endDate: e.target.value })}
          onKeyDown={onEnter}
          className={cn(fieldClass, "mt-1")}
        />
      </label>
    </div>
  );
}

const formatRange = (goal: UserGoal) => {
  if (!goal.startDate && !goal.endDate) return null;
  return `${goal.startDate ?? "…"} ← ${goal.endDate ?? "…"}`;
};

export default function GoalsManager() {
  const { data: goals = [], isLoading, isError } = useUserGoals();
  const createGoal = useCreateUserGoal();
  const updateGoal = useUpdateUserGoal();
  const deleteGoal = useDeleteUserGoal();

  const [adding, setAdding] = useState(false);
  const [newDraft, setNewDraft] = useState<GoalDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<GoalDraft>(emptyDraft);
  const [pendingDelete, setPendingDelete] = useState<UserGoal | null>(null);

  const submitNew = () => {
    const error = validateDraft(newDraft);
    if (error) return toast.error(error);
    createGoal.mutate(
      {
        title: newDraft.title.trim(),
        startDate: newDraft.startDate || null,
        endDate: newDraft.endDate || null,
      },
      {
        onSuccess: () => {
          toast.success("تمت إضافة الهدف");
          setNewDraft(emptyDraft);
          setAdding(false);
        },
        onError: () => toast.error("تعذر إضافة الهدف."),
      },
    );
  };

  const startEdit = (goal: UserGoal) => {
    setEditingId(goal.id);
    setEditDraft(draftFrom(goal));
  };

  const submitEdit = () => {
    if (editingId === null) return;
    const error = validateDraft(editDraft);
    if (error) return toast.error(error);
    updateGoal.mutate(
      {
        id: editingId,
        title: editDraft.title.trim(),
        startDate: editDraft.startDate || null,
        endDate: editDraft.endDate || null,
      },
      {
        onSuccess: () => {
          toast.success("تم تحديث الهدف");
          setEditingId(null);
        },
        onError: () => toast.error("تعذر تحديث الهدف."),
      },
    );
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);
    deleteGoal.mutate(target.id, {
      onSuccess: () => toast.success("تم حذف الهدف"),
      onError: () => toast.error("تعذر حذف الهدف."),
    });
  };

  return (
    <section
      dir="rtl"
      className="mt-10 rounded-3xl border border-zinc-200 bg-zinc-100 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Target className="text-blue-600 dark:text-blue-400" size={22} />
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">أهدافي</h2>
          {goals.length > 0 && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              {goals.length}
            </span>
          )}
        </div>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Plus size={16} />
            إضافة هدف
          </button>
        )}
      </div>

      {adding && (
        <div className="mb-4 space-y-3 rounded-2xl border border-blue-200 bg-white p-4 dark:border-blue-900/50 dark:bg-zinc-950">
          <GoalFields draft={newDraft} onChange={setNewDraft} onSubmit={submitNew} autoFocus />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setNewDraft(emptyDraft);
              }}
              className="rounded-xl border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={submitNew}
              disabled={createGoal.isPending || !newDraft.title.trim()}
              className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createGoal.isPending ? "جاري الحفظ..." : "حفظ الهدف"}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : isError ? (
        <p className="text-sm text-red-500">تعذر تحميل الأهداف. حاول تحديث الصفحة.</p>
      ) : goals.length === 0 && !adding ? (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed border-zinc-300 px-4 py-8 text-sm text-zinc-500 transition hover:border-blue-500 hover:text-blue-600 dark:border-zinc-700"
        >
          <Target size={28} className="text-zinc-300 dark:text-zinc-600" />
          لا توجد أهداف بعد — أضف هدفك الأول لتربط به مهامك
        </button>
      ) : (
        <ul className="space-y-2">
          {goals.map((goal) => {
            const editing = editingId === goal.id;
            const range = formatRange(goal);

            return (
              <li
                key={goal.id}
                className={cn(
                  "rounded-2xl border bg-white p-4 dark:bg-zinc-950",
                  editing
                    ? "border-blue-200 dark:border-blue-900/50"
                    : "border-zinc-200 dark:border-zinc-800",
                )}
              >
                {editing ? (
                  <div className="space-y-3">
                    <GoalFields draft={editDraft} onChange={setEditDraft} onSubmit={submitEdit} autoFocus />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="flex items-center gap-1 rounded-xl border border-zinc-300 px-3 py-1.5 text-xs dark:border-zinc-700"
                      >
                        <X size={14} />
                        إلغاء
                      </button>
                      <button
                        type="button"
                        onClick={submitEdit}
                        disabled={updateGoal.isPending}
                        className="flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                      >
                        <Check size={14} />
                        {updateGoal.isPending ? "جاري الحفظ..." : "حفظ"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
                      <Target size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {goal.title}
                      </p>
                      {range ? (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                          <CalendarRange size={12} />
                          {range}
                        </p>
                      ) : (
                        <p className="mt-0.5 text-xs text-zinc-400">بدون تاريخ محدد</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => startEdit(goal)}
                      title="تعديل الهدف"
                      className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-blue-600 dark:hover:bg-zinc-800 dark:hover:text-blue-400"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDelete(goal)}
                      title="حذف الهدف"
                      className="rounded-lg p-2 text-zinc-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="هل تريد حذف هذا الهدف؟"
          description={`سيتم حذف "${pendingDelete.title}" نهائيًا، ولن يظهر في قائمة الأهداف عند إضافة المهام.`}
          confirmLabel="حذف"
          onConfirm={confirmDelete}
          onClose={() => setPendingDelete(null)}
        />
      )}
    </section>
  );
}
