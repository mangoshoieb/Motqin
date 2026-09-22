"use client";

import { Star } from "lucide-react";
import type { BoardDragState } from "@/app/hooks/useBoardDrag";

// The task in the air on the week board, following the pointer.
export const BoardDragGhost = ({ drag }: { drag: BoardDragState | null }) => {
  if (!drag?.active) return null;
  const stars =
    drag.priorityValue != null && drag.priorityValue >= 1 && drag.priorityValue <= 3
      ? 4 - drag.priorityValue
      : 0;
  return (
    <div
      dir="rtl"
      aria-hidden
      style={{ left: drag.x, top: drag.y }}
      className="pointer-events-none fixed z-[70] flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-lg border border-blue-400 bg-white px-3 py-1.5 text-sm text-zinc-800 shadow-xl shadow-blue-500/20 dark:bg-zinc-800 dark:text-zinc-100"
    >
      <span className="max-w-48 truncate">{drag.title}</span>
      {stars > 0 && (
        <span className="flex gap-px text-amber-400">
          {Array.from({ length: stars }).map((_, star) => (
            <Star key={star} size={11} fill="currentColor" />
          ))}
        </span>
      )}
    </div>
  );
};
