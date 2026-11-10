import type { ReactNode } from "react";

// Pinned to the bottom of the screen on phones (hidden from lg up, where the
// summary card sits beside the content): the price and the next step.
export function MobilePriceBar({
  price,
  note,
  warn,
  action,
}: {
  price: ReactNode;
  note?: ReactNode;
  warn?: boolean; // the note is a problem (not enough balance), not a saving
  action: ReactNode;
}) {
  return (
    <div
      dir="rtl"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,0.06)] backdrop-blur lg:hidden dark:border-zinc-800 dark:bg-zinc-900/95"
    >
      <div className="mx-auto flex max-w-xl items-center gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xl font-extrabold tabular-nums text-blue-950 dark:text-blue-100">{price}</p>
          {note && <p className={`truncate text-xs ${warn ? "text-amber-600" : "text-emerald-600"}`}>{note}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}
