"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  CalendarCheck2,
  CheckCircle2,
  History,
  Play,
  RefreshCw,
  Repeat,
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import Skeleton from "@/components/ui/Skeleton";
import { QUESTION_CATEGORIES } from "@/app/constants/question.constants";
import {
  categoryLabel,
  dueLabel,
  formatDayLong,
  relativeDayLabel,
  reviewQuizHref,
} from "@/app/lib/review-format";
import {
  useReviewTimeline,
  type ReviewTimelineState,
  type ReviewTimelineTask,
} from "@/app/hooks/useReviewTimeline";
import {
  ReviewTimelineScrubber,
  STOP_COLOR,
  type TimelineStop,
} from "@/components/SpacedRepetition/ReviewTimelineScrubber";

const STATE = {
  upcoming: {
    label: "قادمة",
    card: "border-sky-200 border-s-sky-500 bg-sky-50 dark:border-sky-900/70 dark:border-s-sky-500 dark:bg-sky-950/30",
    chip: "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200",
    button: "bg-sky-600 hover:bg-sky-700",
  },
  today: {
    label: "اليوم",
    card: "border-emerald-200 border-s-emerald-500 bg-emerald-50 dark:border-emerald-900/70 dark:border-s-emerald-500 dark:bg-emerald-950/30",
    chip: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200",
    button: "bg-emerald-600 hover:bg-emerald-700",
  },
  completed: {
    label: "مكتملة",
    card: "border-orange-200 border-s-orange-500 bg-orange-50 dark:border-orange-900/70 dark:border-s-orange-500 dark:bg-orange-950/30",
    chip: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200",
    button: "bg-orange-600 hover:bg-orange-700",
  },
  missed: {
    label: "فائتة",
    card: "border-red-200 border-s-red-500 bg-red-50 dark:border-red-900/70 dark:border-s-red-500 dark:bg-red-950/30",
    chip: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200",
    button: "bg-red-600 hover:bg-red-700",
  },
} as const satisfies Record<ReviewTimelineState, Record<string, string>>;

const LEGEND: ReviewTimelineState[] = ["upcoming", "today", "completed", "missed"];

// Space kept above a day when jumping to it, so its header isn't flush
// with the list's edge.
const SCROLL_PAD = 8;

// "مراجعة واحدة / مراجعتان / 3 مراجعات / 11 مراجعة"
const reviewsWord = (n: number) =>
  n === 1 ? "مراجعة واحدة" : n === 2 ? "مراجعتان" : n <= 10 ? `${n} مراجعات` : `${n} مراجعة`;

interface ReviewDay {
  day: string;
  daysFromToday: number;
  tasks: ReviewTimelineTask[];
}

// Newest day first, today always among them (an anchor even when empty).
// Within a day: what's still due first, then what was done, latest first.
function groupByDay(tasks: ReviewTimelineTask[], today: string): ReviewDay[] {
  const days = new Map<string, ReviewDay>([[today, { day: today, daysFromToday: 0, tasks: [] }]]);
  for (const task of tasks) {
    const day = days.get(task.day) ?? { day: task.day, daysFromToday: task.daysFromToday, tasks: [] };
    day.tasks.push(task);
    days.set(task.day, day);
  }
  for (const day of days.values()) {
    day.tasks.sort(
      (a, b) =>
        Number(a.done) - Number(b.done) ||
        (b.finishedAt ?? 0) - (a.finishedAt ?? 0) ||
        (a.lessonTitle ?? "").localeCompare(b.lessonTitle ?? "", "ar"),
    );
  }
  return [...days.values()].sort((a, b) => b.day.localeCompare(a.day));
}

// A past day is red while any of its reviews is still undone.
const dayState = ({ daysFromToday, tasks }: ReviewDay): ReviewTimelineState =>
  daysFromToday > 0
    ? "upcoming"
    : daysFromToday === 0
      ? "today"
      : tasks.some((task) => !task.done)
        ? "missed"
        : "completed";

function statusText(task: ReviewTimelineTask) {
  if (task.state === "today") return task.done ? "أُنجزت اليوم" : "مستحقة اليوم";
  if (task.state === "completed") return "مكتملة";
  return dueLabel(task.daysFromToday);
}

function ReviewCard({ task }: { task: ReviewTimelineTask }) {
  const router = useRouter();
  const styles = STATE[task.state];
  // Same rule as the subjects page: a review can start once it's due, not
  // before — starting early would shorten the spacing.
  const canStart = !task.done && task.daysFromToday <= 0;

  return (
    <div className={cn("flex items-center gap-3 rounded-xl border border-s-4 p-3", styles.card)}>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-zinc-900 dark:text-zinc-100" dir="auto">
          {task.lessonTitle ?? `الدرس #${task.lessonId}`}
        </p>
        <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400" dir="auto">
          {task.subjectName ? `${task.subjectName} · ` : ""}
          {categoryLabel(task.category)}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-500 dark:text-zinc-400">
          <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-semibold", styles.chip)}>
            {task.done && <CheckCircle2 className="size-3" />}
            {statusText(task)}
          </span>
          <span className="flex items-center gap-1">
            <Repeat className="size-3" />
            {task.repetitionNumber === 0 ? "الدراسة الأولى" : `المراجعة #${task.repetitionNumber}`}
          </span>
          {task.score && (
            <span className="flex items-center gap-1 tabular-nums">
              <CheckCircle2 className="size-3" />
              {task.done ? "النتيجة" : "آخر نتيجة"} {task.score.correct}/{task.score.total}
            </span>
          )}
        </div>
      </div>

      {canStart && (
        <button
          type="button"
          onClick={() => router.push(reviewQuizHref(task))}
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

function DaySection({
  day,
  sectionRef,
}: {
  day: ReviewDay;
  sectionRef: (element: HTMLElement | null) => void;
}) {
  const state = dayState(day);
  const isToday = day.daysFromToday === 0;

  return (
    <section ref={sectionRef} data-day={day.day} className="flex flex-col gap-2 pb-5">
      <header
        className={cn(
          "sticky top-0 z-[1] flex items-center gap-2 py-2 backdrop-blur",
          isToday ? "bg-emerald-50/95 dark:bg-emerald-950/80" : "bg-zinc-100/95 dark:bg-zinc-950/90",
          isToday && "-mx-2 rounded-lg px-2"
        )}
      >
        <span className={cn("size-2.5 shrink-0 rounded-full", STOP_COLOR[state])} />
        <h2 className="whitespace-nowrap font-bold text-zinc-900 dark:text-zinc-100">{formatDayLong(day.day)}</h2>
        <span
          className={cn(
            "whitespace-nowrap text-xs",
            isToday
              ? "rounded-full bg-emerald-600 px-2 py-0.5 font-semibold text-white"
              : "text-zinc-500 dark:text-zinc-400"
          )}
        >
          {relativeDayLabel(day.daysFromToday)}
        </span>
        {day.tasks.length > 0 && (
          <span className="ms-auto hidden whitespace-nowrap text-xs text-zinc-500 sm:inline dark:text-zinc-400">
            {reviewsWord(day.tasks.length)}
          </span>
        )}
      </header>

      {day.tasks.length > 0 ? (
        day.tasks.map((task) => <ReviewCard key={task.key} task={task} />)
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-emerald-300 p-3 text-sm text-emerald-800 dark:border-emerald-800 dark:text-emerald-300">
          <CalendarCheck2 className="size-4 shrink-0" />
          لا توجد مراجعات اليوم.
        </div>
      )}
    </section>
  );
}

// Every spaced-repetition review the student has, one section per day:
// coming ones above today, past ones (done or missed) below it. Opens on
// today; the timeline on the left jumps between the days that have reviews.
export default function SpacedRepetitionTablePage() {
  const { tasks, today, isLoading, isError, refetch } = useReviewTimeline();
  const [subjectFilter, setSubjectFilter] = useState<number | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const listRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef(new Map<string, HTMLElement>());
  // The day whose section is at the top of the list.
  const [topDay, setTopDay] = useState(today);

  const isFiltered = subjectFilter !== "all" || categoryFilter !== "all";
  const shown = tasks.filter(
    (task) =>
      (subjectFilter === "all" || task.subjectId === subjectFilter) &&
      (categoryFilter === "all" || task.category === categoryFilter),
  );
  const days = groupByDay(shown, today);
  const stops: TimelineStop[] = days
    .filter((day) => day.tasks.length > 0)
    .map((day) => ({ day: day.day, daysFromToday: day.daysFromToday, state: dayState(day) }));

  // Today among the stops: on one when it has reviews, else between the
  // last coming day and the first past one.
  const comingStops = stops.filter((stop) => stop.daysFromToday > 0).length;
  const todayPosition = stops[comingStops]?.daysFromToday === 0 ? comingStops : comingStops - 0.5;
  const currentStop = stops.findIndex((stop) => stop.day === topDay);

  // Subjects that actually have a review, for the subject filter.
  const subjectOptions = [
    ...new Map(tasks.map((task) => [task.subjectId, task.subjectName ?? `المادة #${task.subjectId}`])),
  ];
  const counts = Object.fromEntries(
    LEGEND.map((state) => [state, shown.filter((task) => task.state === state).length]),
  ) as Record<ReviewTimelineState, number>;

  const scrollToDay = useCallback((day: string, behavior: ScrollBehavior = "auto") => {
    const list = listRef.current;
    const section = sectionRefs.current.get(day);
    if (!list || !section) return;
    list.scrollTo({ top: Math.max(section.offsetTop - SCROLL_PAD, 0), behavior });
  }, []);

  // Which section the top of the list is in: the last one starting at or
  // above it.
  const syncTopDay = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const line = list.scrollTop + SCROLL_PAD + 1;
    let found: string | null = null;
    for (const section of list.querySelectorAll<HTMLElement>("section[data-day]")) {
      if (section.offsetTop > line) break;
      found = section.dataset.day!;
    }
    const first = list.querySelector<HTMLElement>("section[data-day]");
    setTopDay(found ?? first?.dataset.day ?? today);
  }, [today]);

  // Open on today — and come back to it whenever the filters change what's
  // listed above and below it.
  const hasData = !isLoading && !isError;
  useLayoutEffect(() => {
    if (!hasData) return;
    scrollToDay(today);
    syncTopDay();
  }, [hasData, subjectFilter, categoryFilter, today, scrollToDay, syncTopDay]);

  const resetFilters = () => {
    setSubjectFilter("all");
    setCategoryFilter("all");
  };

  return (
    <main dir="rtl" className="flex h-[calc(100dvh-65px)] flex-col bg-zinc-100 dark:bg-zinc-950">
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col gap-4 px-4 pt-6 sm:px-8">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <Link
            href="/subjects"
            className="inline-flex w-fit items-center gap-1.5 text-sm text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <ArrowRight className="size-4" />
            المواد الدراسية
          </Link>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <h1 className="flex items-center gap-2 text-2xl font-bold text-blue-950 dark:text-blue-100">
                <BrainCircuit className="size-7 text-violet-500" />
                جدول المراجعات المتباعدة
              </h1>

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

            {/* Colour key, with how many reviews of each are listed */}
            {hasData && (
              <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-600 dark:text-zinc-300">
                {LEGEND.map((state) => (
                  <li key={state} className="flex items-center gap-1.5">
                    <span className={cn("size-2.5 rounded-full", STOP_COLOR[state])} />
                    {STATE[state].label}
                    <span className="tabular-nums text-zinc-400 dark:text-zinc-500">{counts[state]}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Body */}
        {isError ? (
          <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-white p-4 text-sm text-red-700 dark:border-red-900 dark:bg-zinc-900 dark:text-red-300">
            <AlertTriangle className="size-5 shrink-0" />
            <span className="flex-1">تعذّر تحميل المراجعات المتباعدة.</span>
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/40"
            >
              <RefreshCw className="size-3.5" />
              إعادة المحاولة
            </button>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-48" />
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-violet-100 bg-white p-10 text-center dark:border-violet-900/50 dark:bg-zinc-900">
            <BrainCircuit className="size-8 text-violet-500" />
            <p className="font-bold text-zinc-900 dark:text-zinc-100">لا توجد مراجعات متباعدة بعد</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              عندما تُنهي جلسة على أي درس، سنجدول مراجعاته هنا في الأوقات المناسبة لتثبيت المعلومة.
            </p>
          </div>
        ) : shown.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            <p>لا توجد مراجعات تطابق التصفية.</p>
            <button
              type="button"
              onClick={resetFilters}
              className="font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              إعادة الضبط
            </button>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 gap-3 sm:gap-6">
            <div
              ref={listRef}
              onScroll={syncTopDay}
              className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 [scrollbar-width:thin]"
            >
              {days.map((day) => (
                <DaySection
                  key={day.day}
                  day={day}
                  sectionRef={(element) => {
                    if (element) sectionRefs.current.set(day.day, element);
                    else sectionRefs.current.delete(day.day);
                  }}
                />
              ))}

              {/* The end of the history — tall enough that the oldest day
                  can still scroll up to the top of the list. */}
              <div className="flex h-[calc(100%-8rem)] items-start justify-center pt-4 text-xs text-zinc-400 dark:text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <History className="size-3.5" />
                  بداية سجل المراجعات
                </span>
              </div>
            </div>

            <ReviewTimelineScrubber
              stops={stops}
              current={currentStop === -1 ? null : currentStop}
              today={today}
              todayPosition={todayPosition}
              atToday={topDay === today}
              onJump={(index) => scrollToDay(stops[index].day)}
              onBackToToday={() => scrollToDay(today, "smooth")}
            />
          </div>
        )}
      </div>
    </main>
  );
}
