"use client";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

// Generic yes/no confirmation popup for any destructive/interrupting
// navigation action (e.g. leaving an active quiz session).
export const ConfirmDialog = ({
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-6">
      <div
        dir="rtl"
        className="w-full max-w-sm flex flex-col gap-4 rounded-3xl bg-white border border-zinc-200 p-6 text-center dark:bg-zinc-900 dark:border-zinc-800"
      >
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{title}</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{message}</p>

        <div className="flex items-center gap-3 mt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-5 py-2.5 rounded-full border border-zinc-200 text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 px-5 py-2.5 rounded-full bg-red-600 text-white font-semibold hover:bg-red-700 transition"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
