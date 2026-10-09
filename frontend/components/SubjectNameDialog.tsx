"use client";

import { useState, type FormEvent } from "react";

// Same bounds the backend puts on CreateCustomizedSubjectDto /
// UpdateCustomizedSubjectDto.name.
const MIN_LENGTH = 2;
const MAX_LENGTH = 100;

interface SubjectNameDialogProps {
  title: string;
  submitLabel: string;
  initialName?: string;
  isPending?: boolean;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}

// Popup with a single name field — used both to add a subject of the
// student's own and to rename one. Only the name is editable: country,
// stage and grade come from their profile.
export const SubjectNameDialog = ({
  title,
  submitLabel,
  initialName = "",
  isPending = false,
  onSubmit,
  onCancel,
}: SubjectNameDialogProps) => {
  const [name, setName] = useState(initialName);
  const trimmed = name.trim();
  const tooShort = trimmed.length < MIN_LENGTH;
  const unchanged = trimmed === initialName.trim();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (tooShort || unchanged || isPending) return;
    onSubmit(trimmed);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-6"
      onClick={onCancel}
    >
      <form
        dir="rtl"
        onSubmit={handleSubmit}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-sm flex flex-col gap-4 rounded-3xl bg-white border border-zinc-200 p-6 dark:bg-zinc-900 dark:border-zinc-800"
      >
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{title}</h2>

        <div className="flex flex-col gap-1.5">
          <input
            autoFocus
            dir="auto"
            value={name}
            maxLength={MAX_LENGTH}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => event.key === "Escape" && onCancel()}
            placeholder="اسم المادة"
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-zinc-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
          {name.length > 0 && tooShort && (
            <p className="text-xs text-red-600">
              يجب أن يتكون الاسم من حرفين على الأقل.
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 mt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-5 py-2.5 rounded-full border border-zinc-200 text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={tooShort || unchanged || isPending}
            className="flex-1 px-5 py-2.5 rounded-full bg-blue-600 text-white font-semibold transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "جاري الحفظ..." : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
};
