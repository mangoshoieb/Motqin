"use client";

import { X } from "lucide-react";
import { PresentationCard } from "@/components/PresentationCard";

interface InfoCardDialogProps {
  information: LessonInformation;
  onClose: () => void;
}

// A question's info card, outside a session — the same PresentationCard the
// quiz shows, filled the same way (see toSessionItem in useLessonSession).
export const InfoCardDialog = ({ information, onClose }: InfoCardDialogProps) => {
  const item = {
    title: information.title ?? information.infoCard?.title ?? null,
    description: information.infoCard?.explanation ?? "",
    imageUrl: information.infoCard?.imageUrl ?? null,
    audioUrl: information.infoCard?.audioUrl ?? null,
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      onKeyDown={(event) => event.key === "Escape" && onClose()}
    >
      <div
        dir="rtl"
        role="dialog"
        aria-modal="true"
        className="relative flex w-full max-w-2xl flex-col items-center gap-4"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          autoFocus
          onClick={onClose}
          aria-label="إغلاق"
          className="absolute left-4 top-4 z-10 rounded-full bg-white/90 p-1.5 text-zinc-500 shadow-sm transition hover:text-zinc-800 dark:bg-zinc-800/90 dark:text-zinc-300 dark:hover:text-zinc-100"
        >
          <X className="size-5" />
        </button>

        <PresentationCard item={item} />
      </div>
    </div>
  );
};
