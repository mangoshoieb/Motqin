import { formatNumber } from "@/app/lib/tracking-table";
import { Standing } from "@/app/types/tracking-table.types";

// The report's numbers arrive rounded to 1 decimal — add % and don't round
// again. Any null reads "—".
export const pct = (value: number | null | undefined) => (value == null ? "—" : `${formatNumber(value)}%`);
export const num = (value: number | null | undefined) => (value == null ? "—" : formatNumber(value));

// "+5" / "−10" — a real minus sign, so it doesn't read as a hyphen.
export const signed = (value: number) =>
  `${value > 0 ? "+" : value < 0 ? "−" : ""}${formatNumber(Math.abs(value))}`;

// The class spread as a word, per the guide: the number goes in a tooltip.
export const spreadWord = (stdDev: number | null | undefined) => {
  if (stdDev == null) return "—";
  if (stdDev < 10) return "متقارب";
  if (stdDev <= 20) return "متوسط التفاوت";
  return "متفاوت جداً";
};

// Diverging, from the warm pole through a neutral midpoint to the cool one
// (validated for colour-blind separation and contrast in both themes). Every
// use also carries a text label, so colour is never the only cue.
export const STANDING_STYLE: Record<
  Standing,
  { bar: string; chip: string; cell: string }
> = {
  above: {
    bar: "bg-blue-600 dark:bg-blue-500",
    chip: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
    cell: "bg-blue-50 text-blue-800 dark:bg-blue-500/10 dark:text-blue-200",
  },
  average: {
    bar: "bg-zinc-500",
    chip: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    cell: "text-zinc-800 dark:text-zinc-200",
  },
  below: {
    bar: "bg-orange-600 dark:bg-orange-700",
    chip: "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
    cell: "bg-orange-50 text-orange-800 dark:bg-orange-500/10 dark:text-orange-200",
  },
};

// Display order, top of the class first.
export const STANDING_ORDER: Standing[] = ["above", "average", "below"];
