"use client";

import { AlertTriangle } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface ConfirmDialogProps {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmDialog = ({
  title,
  description,
  confirmLabel = "تأكيد",
  cancelLabel = "إلغاء",
  tone = "danger",
  onConfirm,
  onClose,
}: ConfirmDialogProps) => (
  <div
    dir="rtl"
    role="dialog"
    aria-modal="true"
    onClick={onClose}
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
  >
    <div
      onClick={(event) => event.stopPropagation()}
      className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900"
    >
      <div className="flex items-start gap-3">
        {tone === "danger" && (
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
            <AlertTriangle size={18} />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          autoFocus
          onClick={onConfirm}
          className={cn(
            "rounded-lg px-5 py-2 text-sm font-semibold text-white transition",
            tone === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700",
          )}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
);
