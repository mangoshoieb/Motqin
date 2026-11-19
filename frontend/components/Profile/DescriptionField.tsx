"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/app/lib/utils";
import { DESCRIPTION_MAX, profileErrors } from "@/app/lib/profile";
import { useUpdateMe } from "@/app/hooks/useUpdateMe";

// الوصف: shown as text (line breaks kept) with an edit icon, or as
// "+ إضافة وصف" when empty. Editing happens in place and saves on its own
// (PUT /users/me { description }), apart from the تعديل form.
export default function DescriptionField({ description }: { description: string | null }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { mutate: updateMe, isPending } = useUpdateMe();

  const open = () => {
    setDraft(description ?? "");
    setError(null);
    setEditing(true);
  };

  // "" removes it: the server answers description: null.
  const save = (text: string) => {
    updateMe(
      { description: text },
      {
        onSuccess: (user) => {
          setEditing(false);
          toast.success(user.description ? "تم حفظ الوصف" : "تم حذف الوصف");
        },
        onError: (err) => {
          const errors = profileErrors(err);
          setError(errors.description ?? errors.general ?? null);
        },
      },
    );
  };

  return (
    <div>
      <label className="mb-2 block font-medium">الوصف</label>

      {editing ? (
        <div className="flex flex-col gap-2">
          <textarea
            autoFocus
            rows={4}
            value={draft}
            maxLength={DESCRIPTION_MAX}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="اكتب نبذة قصيرة عنك..."
            className={cn(
              "w-full resize-y rounded-xl border bg-white px-4 py-3 dark:bg-zinc-900",
              error ? "border-red-400 dark:border-red-500/60" : "border-zinc-400 dark:border-zinc-700",
            )}
          />
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "text-xs tabular-nums",
                draft.length >= DESCRIPTION_MAX ? "font-bold text-amber-600 dark:text-amber-400" : "text-zinc-500 dark:text-zinc-400",
              )}
              dir="ltr"
            >
              {draft.length} / {DESCRIPTION_MAX}
            </span>
            {error && <span className="text-xs text-red-500 dark:text-red-400">{error}</span>}
            <div className="ms-auto flex gap-2">
              {description && (
                <button
                  type="button"
                  onClick={() => save("")}
                  disabled={isPending}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-500/10"
                >
                  <Trash2 size={15} />
                  حذف الوصف
                </button>
              )}
              <button
                type="button"
                onClick={() => setEditing(false)}
                disabled={isPending}
                className="rounded-xl border border-zinc-300 px-4 py-2 text-sm transition hover:bg-zinc-200 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => save(draft)}
                disabled={isPending}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white transition hover:bg-blue-700 disabled:opacity-60 dark:bg-blue-700 dark:hover:bg-blue-800"
              >
                {isPending ? "جاري الحفظ..." : "حفظ"}
              </button>
            </div>
          </div>
        </div>
      ) : description ? (
        <div className="group flex items-start gap-3 rounded-xl border border-zinc-300 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900">
          <p className="min-w-0 flex-1 whitespace-pre-line break-words text-zinc-700 dark:text-zinc-300">{description}</p>
          <button
            type="button"
            onClick={open}
            title="تعديل الوصف"
            aria-label="تعديل الوصف"
            className="shrink-0 rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-100 hover:text-blue-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-blue-400"
          >
            <Pencil size={16} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={open}
          className="flex items-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-blue-300/30 px-4 py-3 text-zinc-500 transition hover:border-blue-500 hover:bg-blue-300/50 hover:text-blue-600 dark:border-zinc-700 dark:bg-blue-500/15 dark:hover:bg-blue-500/20 dark:hover:text-blue-300"
        >
          <Plus size={16} />
          إضافة وصف
        </button>
      )}
    </div>
  );
}
