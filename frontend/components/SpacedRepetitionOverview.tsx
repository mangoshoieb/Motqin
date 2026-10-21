"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BrainCircuit,
  CalendarClock,
  CheckCircle2,
  PartyPopper,
  Play,
  RefreshCw,
  Repeat,
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import Skeleton from "@/components/ui/Skeleton";
import { QUESTION_CATEGORIES } from "@/app/constants/question.constants";
import {
  useReviewOverview,
  type ComingRange,
  type MissedRange,
  type ReviewOverviewItem,
} from "@/app/hooks/useReviewOverview";

type Tone = "missed" | "coming";

const TONE = {
  missed: {
    panel: "border-amber-200 bg-amber-50/70 dark:border-amber-900/60 dark:bg-amber-950/20",
    icon: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    count: "bg-amber-600 text-white",
    chipOn: "border-amber-600 bg-amber-600 text-white",
    chipOff: "border-amber-200 bg-white text-amber-800 hover:border-amber-400 dark:border-amber-900 dark:bg-zinc-900 dark:text-amber-300",
    card: "border-amber-200 dark:border-amber-900/60",
    due: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200",
    button: "bg-amber-600 hover:bg-amber-700",
  },
  coming: {
    panel: "border-sky-200 bg-sky-50/70 dark:border-sky-900/60 dark:bg-sky-950/20",
    icon: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300",
    count: "bg-sky-600 text-white",
    chipOn: "border-sky-600 bg-sky-600 text-white",
    chipOff: "border-sky-200 bg-white text-sky-800 hover:border-sky-400 dark:border-sky-900 dark:bg-zinc-900 dark:text-sky-300",
    card: "border-sky-200 dark:border-sky-900/60",
    due: "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200",
    button: "bg-sky-600 hover:bg-sky-700",
  },
} as const;

const MISSED_RANGES: { value: MissedRange; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "week", label: "آخر 7 أيام" },
  { value: "month", label: "آخر 30 يومًا" },
];

const COMING_RANGES: { value: ComingRange; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "today", label: "اليوم" },
  { value: "week", label: "7 أيام" },
  { value: "month", label: "30 يومًا" },
];

// "يوم / يومين / 3 أيام / 12 يومًا"
const daysWord = (n: number) =>
  n === 1 ? "يوم" : n === 2 ? "يومين" : n <= 10 ? `${n} أيام` : `${n} يومًا`;

const dueLabel = (days: number) => {
  if (days < -1) return `متأخرة ${daysWord(-days)}`;
  if (days === -1) return "متأخرة منذ أمس";
  if (days === 0) return "اليوم";
  if (days === 1) return "غدًا";
  return `بعد ${daysWord(days)}`;
};

const dayFormatter = new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
  weekday: "long",
  day: "numeric",
  month: "long",
});
const formatDay = (day: string) => dayFormatter.format(new Date(`${day}T00:00:00`));

const categoryLabel = (value: string) =>
  QUESTION_CATEGORIES.find((c) => c.value === value)?.label ?? value;

// Same "{id}-{name}" segment the subjects page links with; the quiz page
// only reads the id before the first dash.
const subjectSegment = (item: ReviewOverviewItem) =>
  item.subjectName
    ? `${item.subjectId}-${item.subjectName.toLowerCase().replace(/\s+/g, "-")}`
    : String(item.subjectId);

function ReviewTaskCard({ item, tone }: { item: ReviewOverviewItem; tone: Tone }) {
  const router = useRouter();
  const styles = TONE[tone];
  // A review only makes sense once it's due — starting one early would
  // shorten the interval the spacing depends on.
  const canStart = item.daysFromToday <= 0;

  return (
    <div className={cn("flex items-center gap-3 rounded-xl border bg-white p-3 dark:bg-zinc-900", styles.card)}>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-zinc-900 dark:text-zinc-100" dir="auto">
          {item.lessonTitle ?? `الدرس #${item.lessonId}`}
        </p>
        <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400" dir="auto">
          {item.subjectName ? `${item.subjectName} · ` : ""}
          {categoryLabel(item.category)}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-500 dark:text-zinc-400">
          <span className={cn("rounded-md px-1.5 py-0.5 font-semibold", styles.due)}>
            {dueLabel(item.daysFromToday)}
          </span>
          <span title={item.reviewDay}>{formatDay(item.reviewDay)}</span>
          <span className="flex items-center gap-1">
            <Repeat className="size-3" />
            المراجعة #{item.repetitionNumber}
          </span>
          {item.lastScore && (
            <span className="flex items-center gap-1 tabular-nums">
              <CheckCircle2 className="size-3" />
              آخر نتيجة {item.lastScore.correct}/{item.lastScore.total}
            </span>
          )}
        </div>
      </div>

      {canStart && (
        <button
          type="button"
          onClick={() =>
            router.push(
              `/subjects/${subjectSegment(item)}/${item.lessonId}/quiz?category=${encodeURIComponent(item.category)}`
            )
          }
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold text-white transition",
            styles.button
          )}
        >
          <Play className="size-3.5" />
          ابدأ
        </button>
      )}
    </div>
  );
}

function ReviewColumn<R extends string>({
  tone,
  icon,
  title,
  subtitle,
  items,
  total,
  isLoading,
  ranges,
  range,
  onRangeChange,
  empty,
}: {
  tone: Tone;
  icon: ReactNode;
  title: string;
  subtitle: string;
  items: ReviewOverviewItem[];
  // Before the subject / category filters, for the "x of y" count.
  total: number;
  isLoading: boolean;
  ranges: { value: R; label: string }[];
  range: R;
  onRangeChange: (range: R) => void;
  empty: ReactNode;
}) {
  const styles = TONE[tone];

  return (
    <div className={cn("flex h-[40vh] min-h-[280px] flex-col rounded-2xl border", styles.panel)}>
      {/* Header */}
      <div className="flex flex-col gap-3 p-4 pb-3">
        <div className="flex items-center gap-3">
          <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", styles.icon)}>
            {icon}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100">{title}</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>
          </div>
          {!isLoading && (
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums", styles.count)}>
              {items.length === total ? total : `${items.length} / ${total}`}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ranges.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => onRangeChange(r.value)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition",
                range === r.value ? styles.chipOn : styles.chipOff
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* List — scrolls inside the fixed-height panel */}
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 pb-4">
        {isLoading ? (
          Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-20 shrink-0" />)
        ) : items.length > 0 ? (
          items.map((item) => <ReviewTaskCard key={item.id} item={item} tone={tone} />)
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-1.5 text-center text-sm text-zinc-500 dark:text-zinc-400">
            {empty}
          </div>
        )}
      </div>
    </div>
  );
}

// First section of the subjects page: the student's spaced-repetition
// reviews, from GET /spaced-repetition/plans/filter. Missed (overdue) on the
// right in a warning tone, coming (today onward) on the left in an info
// tone. With no reviews at all it shrinks to a short note instead.
export const SpacedRepetitionOverview = () => {
  const [missedRange, setMissedRange] = useState<MissedRange>("all");
  const [comingRange, setComingRange] = useState<ComingRange>("all");
  const [subjectFilter, setSubjectFilter] = useState<number | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { missed, coming, isLoading, isError, refetch } = useReviewOverview({
    missedRange,
    comingRange,
  });

  const isFiltered =
    missedRange !== "all" || comingRange !== "all" || subjectFilter !== "all" || categoryFilter !== "all";

  const matches = (item: ReviewOverviewItem) =>
    (subjectFilter === "all" || item.subjectId === subjectFilter) &&
    (categoryFilter === "all" || item.category === categoryFilter);
  const shownMissed = missed.filter(matches);
  const shownComing = coming.filter(matches);

  // Subjects that actually have a review, for the subject filter.
  const subjectOptions = [
    ...new Map(
      [...missed, ...coming].map((item) => [item.subjectId, item.subjectName ?? `المادة #${item.subjectId}`])
    ),
  ];

  // Empty-panel wording: "nothing at all", "nothing in this window", or
  // "the subject / category filter hid everything".
  const missedEmpty =
    missed.length > 0 ? "لا توجد مراجعات فائتة تطابق التصفية." : "لا توجد مراجعات فائتة في هذه الفترة.";
  const comingEmpty =
    coming.length > 0
      ? "لا توجد مراجعات قادمة تطابق التصفية."
      : comingRange === "all"
        ? "لا توجد مراجعات قادمة."
        : comingRange === "today"
          ? "لا توجد مراجعات اليوم."
          : "لا توجد مراجعات قادمة في هذه الفترة.";

  const resetFilters = () => {
    setMissedRange("all");
    setComingRange("all");
    setSubjectFilter("all");
    setCategoryFilter("all");
  };

  if (isError) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-white p-4 text-sm text-red-700 dark:border-red-900 dark:bg-zinc-900 dark:text-red-300">
        <AlertTriangle className="size-5 shrink-0" />
        <span className="flex-1">تعذّر تحميل المراجعات المتباعدة.</span>
        <button
          type="button"
          onClick={refetch}
          className="inline-flex items-center gap-1.5 rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/40"
        >
          <RefreshCw className="size-3.5" />
          إعادة المحاولة
        </button>
      </div>
    );
  }

  // Nothing scheduled at all (not merely filtered out): a short note
  // instead of two empty panels.
  if (!isLoading && !isFiltered && missed.length === 0 && coming.length === 0) {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-violet-100 bg-gradient-to-l from-violet-50 to-white p-5 dark:border-violet-900/50 dark:from-violet-950/30 dark:to-zinc-900">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300">
          <BrainCircuit className="size-6" />
        </span>
        <div>
          <p className="font-bold text-zinc-900 dark:text-zinc-100">لا توجد مراجعات متباعدة حاليًا</p>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            عندما تُنهي جلسة على أي درس، سنجدول مراجعاته هنا في الأوقات المناسبة لتثبيت المعلومة.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      {/* Title + shared filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-xl font-bold text-blue-950 dark:text-blue-100">
          <BrainCircuit className="size-6 text-violet-500" />
          المراجعات المتباعدة
        </h2>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={subjectFilter}
            onChange={(event) =>
              setSubjectFilter(event.target.value === "all" ? "all" : Number(event.target.value))
            }
            aria-label="تصفية حسب المادة"
            className="cursor-pointer rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-sm text-zinc-700 outline-none transition focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
          >
            <option value="all">كل المواد</option>
            {subjectOptions.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>

          <div className="inline-flex items-center gap-1 rounded-full bg-zinc-200/70 p-1 dark:bg-zinc-800">
            {[{ value: "all", label: "كل الفئات" }, ...QUESTION_CATEGORIES].map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategoryFilter(c.value)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold transition",
                  categoryFilter === c.value
                    ? "bg-white text-blue-700 shadow-sm dark:bg-zinc-900 dark:text-blue-400"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                )}
              >
                {c.label}
              </button>
            ))}
          </div>

          {isFiltered && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              إعادة الضبط
            </button>
          )}
        </div>
      </div>

      {/* Two sides: in RTL the first column sits on the right */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ReviewColumn
          tone="missed"
          icon={<AlertTriangle className="size-5" />}
          title="مراجعات فائتة"
          subtitle="فات موعدها، ابدأ بها أولًا"
          items={shownMissed}
          total={missed.length}
          isLoading={isLoading}
          ranges={MISSED_RANGES}
          range={missedRange}
          onRangeChange={setMissedRange}
          empty={
            missed.length === 0 && missedRange === "all" ? (
              <>
                <PartyPopper className="size-6 text-amber-500" />
                <p className="font-medium text-zinc-700 dark:text-zinc-200">لا توجد مراجعات فائتة</p>
                <p className="text-xs">أنت ملتزم بمواعيدك، استمر!</p>
              </>
            ) : (
              <p>{missedEmpty}</p>
            )
          }
        />

        <ReviewColumn
          tone="coming"
          icon={<CalendarClock className="size-5" />}
          title="مراجعات قادمة"
          subtitle="اليوم والأيام القادمة"
          items={shownComing}
          total={coming.length}
          isLoading={isLoading}
          ranges={COMING_RANGES}
          range={comingRange}
          onRangeChange={setComingRange}
          empty={
            <>
              <CalendarClock className="size-6 text-sky-500" />
              <p>{comingEmpty}</p>
            </>
          }
        />
      </div>
    </section>
  );
};
