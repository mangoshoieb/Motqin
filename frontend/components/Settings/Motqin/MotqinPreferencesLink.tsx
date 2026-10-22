import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";

// Way into the Motqin settings (spaced-repetition intervals) from the
// subjects pages — the counterpart of the planner's "تفضيلات المخطط".
export const MotqinPreferencesLink = () => (
  <Link
    href="/settings/quiz"
    className="inline-flex shrink-0 items-center gap-2 rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-white dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
  >
    <SlidersHorizontal className="size-4" />
    تفضيلات متقن
  </Link>
);
