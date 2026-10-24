"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, Play, RotateCcw } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { useRestartRepetition } from "@/app/hooks/useRestartRepetition";
import { getApiErrorMessage } from "@/app/lib/api-error";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface StartQuizButtonProps {
  lessonId: string;
  category: string;
  quizHref: string;
  // Some questions of this category are already finished — the main action
  // then continues ("أكمل") rather than starts ("ابدأ").
  hasProgress: boolean;
  disabled?: boolean;
}

// Split button: the main part starts / continues the quiz; the arrow opens
// a menu offering the same, or starting the category over
// (POST /spaced-repetition/restart) before going to the quiz.
export const StartQuizButton = ({
  lessonId,
  category,
  quizHref,
  hasProgress,
  disabled = false,
}: StartQuizButtonProps) => {
  const router = useRouter();
  const restart = useRestartRepetition(lessonId);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const mainLabel = hasProgress ? "أكمل" : "ابدأ";

  // Close on a click outside or Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const handleRestart = () => {
    setConfirmRestart(false);
    restart.mutate(category, {
      onSuccess: () => router.push(quizHref),
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });
  };

  const busy = restart.isPending;

  return (
    <div ref={rootRef} className="relative">
      <div
        className={cn(
          "inline-flex items-stretch overflow-hidden rounded-full bg-blue-600 text-white font-semibold",
          (disabled || busy) && "opacity-50 pointer-events-none"
        )}
      >
        <Link
          href={quizHref}
          aria-disabled={disabled}
          className="flex items-center px-6 py-3 transition hover:bg-blue-700 dark:hover:bg-blue-500"
        >
          {busy ? "جاري إعادة الضبط..." : mainLabel}
        </Link>
        <span className="w-px bg-white/30" aria-hidden />
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label="خيارات البدء"
          className="flex items-center px-3 transition hover:bg-blue-700 dark:hover:bg-blue-500"
        >
          <ChevronDown className={cn("size-4 transition-transform", menuOpen && "rotate-180")} />
        </button>
      </div>

      {menuOpen && (
        <div
          role="menu"
          className="absolute end-0 top-full z-40 mt-2 w-64 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
        >
          <Link
            href={quizHref}
            role="menuitem"
            onClick={() => setMenuOpen(false)}
            className="flex items-start gap-3 rounded-xl px-3 py-2.5 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <Play className="mt-0.5 size-4 shrink-0 text-blue-600 dark:text-blue-400" />
            <span>
              <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">{mainLabel}</span>
              <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                {hasProgress ? "تابع من حيث توقفت" : "ابدأ أسئلة هذه الفئة"}
              </span>
            </span>
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              setConfirmRestart(true);
            }}
            className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-right transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <RotateCcw className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">البدء من جديد</span>
              <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                تُعاد كل أسئلة هذه الفئة إلى غير مكتملة
              </span>
            </span>
          </button>
        </div>
      )}

      {confirmRestart && (
        <ConfirmDialog
          title="البدء من جديد؟"
          message="ستعود كل الأسئلة التي أنهيتها في هذه الفئة إلى غير مكتملة، وتبدأ الأسئلة من أولها. موعد مراجعتك القادمة لن يتغير."
          confirmLabel="ابدأ من جديد"
          cancelLabel="إلغاء"
          onConfirm={handleRestart}
          onCancel={() => setConfirmRestart(false)}
        />
      )}
    </div>
  );
};
