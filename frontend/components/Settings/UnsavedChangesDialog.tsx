"use client";

import { AlertTriangle } from "lucide-react";

interface UnsavedChangesDialogProps {
  // Save first, then leave — hidden while a save is already running.
  onSaveAndLeave: () => void;
  onDiscard: () => void;
  onStay: () => void;
  isSaving?: boolean;
}

// Shown when the user tries to navigate away with unsaved settings edits.
export const UnsavedChangesDialog = ({
  onSaveAndLeave,
  onDiscard,
  onStay,
  isSaving = false,
}: UnsavedChangesDialogProps) => (
  <div
    dir="rtl"
    role="dialog"
    aria-modal="true"
    onClick={onStay}
    className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4"
  >
    <div
      onClick={(event) => event.stopPropagation()}
      className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
          <AlertTriangle size={18} />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            لديك تغييرات غير محفوظة
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            إذا خرجت الآن ستفقد التعديلات التي أجريتها على التفضيلات. هل تريد حفظها أولًا؟
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onStay}
          className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          البقاء هنا
        </button>
        <button
          type="button"
          onClick={onDiscard}
          disabled={isSaving}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:hover:bg-red-950/30"
        >
          الخروج دون حفظ
        </button>
        <button
          type="button"
          autoFocus
          onClick={onSaveAndLeave}
          disabled={isSaving}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "جاري الحفظ..." : "حفظ ثم الخروج"}
        </button>
      </div>
    </div>
  </div>
);
