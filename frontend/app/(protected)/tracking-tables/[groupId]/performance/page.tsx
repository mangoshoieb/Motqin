"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BarChart3, Check, ChevronRight, Info, Loader2, Play } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { getApiErrorMessage, getApiErrorStatus } from "@/app/lib/api-error";
import { apiErrorCode, formatNumber } from "@/app/lib/tracking-table";
import { useTableHeader, usePerformanceReport } from "@/app/hooks/useTrackingTables";
import { MAX_REPORT_EXAMS } from "@/app/constants/tracking-table.constants";
import Skeleton from "@/components/ui/Skeleton";
import { primaryButton, secondaryButton } from "@/components/TrackingTables/ui";
import { ExamCard, Highlights, OverallCard, StandingPick } from "@/components/TrackingTables/performance/cards";
import { StudentFilter, StudentsTable } from "@/components/TrackingTables/performance/StudentsTable";

const NO_FILTER: StudentFilter = { pick: null, flag: "", search: "" };

// How the class did across the exams the teacher picks. It only reads, so
// assistants can open it on any shared table.
export default function PerformanceReportPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { data: table, isLoading: tableLoading, error: tableError } = useTableHeader(groupId);
  const report = usePerformanceReport(groupId);

  // Exam columns in the table's own order — sent oldest first, since the
  // order drives trends and drops.
  const examColumns = useMemo(
    () => (table?.columns ?? []).filter((c) => c.type === "Exam").sort((a, b) => a.position - b.position),
    [table],
  );
  // null = the default: every exam, or the latest 20.
  const [picked, setPicked] = useState<string[] | null>(null);
  const chosen = picked ?? examColumns.slice(-MAX_REPORT_EXAMS).map((c) => c.id);
  const chosenInOrder = examColumns.filter((c) => chosen.includes(c.id)).map((c) => c.id);
  // The exams the report on screen was run with.
  const ranIds = report.variables?.examColumnIds ?? [];
  const [filter, setFilter] = useState<StudentFilter>(NO_FILTER);
  const studentsRef = useRef<HTMLDivElement>(null);

  const run = (ids: string[]) => {
    if (ids.length === 0) return;
    setFilter(NO_FILTER);
    report.mutate({ examColumnIds: ids });
  };

  // Open with a report on every exam rather than an empty page.
  const { mutate } = report;
  const autoRan = useRef(false);
  useEffect(() => {
    if (autoRan.current || examColumns.length === 0) return;
    autoRan.current = true;
    mutate({ examColumnIds: examColumns.slice(-MAX_REPORT_EXAMS).map((c) => c.id) });
  }, [examColumns, mutate]);

  const toggle = (id: string) => {
    const next = chosen.includes(id) ? chosen.filter((x) => x !== id) : [...chosen, id];
    if (next.length <= MAX_REPORT_EXAMS) setPicked(next);
  };

  const data = report.data;
  const multiExam = (data?.exams.length ?? 0) > 1;
  const stale = data && chosenInOrder.join() !== ranIds.join();

  const pickStanding = (pick: StandingPick) => {
    setFilter((prev) => ({
      ...prev,
      pick: prev.pick?.standing === pick.standing && prev.pick.examId === pick.examId ? null : pick,
    }));
    studentsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const reportError = report.error
    ? getApiErrorStatus(report.error) === 404 && apiErrorCode(report.error) !== "table_not_found"
      ? "تقرير الأداء غير متاح على الخادم بعد."
      : getApiErrorMessage(report.error)
    : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <Link
        href={`/tracking-tables/${groupId}`}
        className="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 transition hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        <ChevronRight size={16} /> {table?.groupName ?? "الجدول"}
      </Link>

      <header className="mt-3 flex items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 dark:from-blue-700 to-indigo-600 dark:to-indigo-800 text-white shadow-lg">
          <BarChart3 size={24} />
        </span>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">تقرير الأداء</h1>
          {table ? (
            <p className="truncate text-sm text-zinc-500">{table.groupName}</p>
          ) : (
            <Skeleton className="mt-1 h-4 w-40" />
          )}
        </div>
      </header>

      {tableError ? (
        <p className="mt-8 rounded-3xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
          {getApiErrorMessage(tableError)}
        </p>
      ) : tableLoading ? (
        <Skeleton className="mt-6 h-32 w-full rounded-3xl" />
      ) : examColumns.length === 0 ? (
        <div className="mt-6 rounded-3xl border-2 border-dashed border-zinc-300 bg-white px-6 py-14 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <p className="font-bold text-zinc-900 dark:text-zinc-100">لا توجد أعمدة امتحانات في هذا الجدول</p>
          <p className="mt-1 text-sm text-zinc-500">أضف عمودًا من نوع «امتحان» وسجّل الدرجات، ثم عد إلى هنا.</p>
          <Link href={`/tracking-tables/${groupId}`} className={cn(primaryButton, "mt-5")}>
            العودة إلى الجدول
          </Link>
        </div>
      ) : (
        <>
          {/* Exam picker */}
          <section className="mt-6 flex flex-col gap-3 rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="me-auto font-bold text-zinc-900 dark:text-zinc-100">
                الامتحانات{" "}
                <span className="font-normal text-zinc-500">
                  ({formatNumber(chosen.length)} / {formatNumber(Math.min(examColumns.length, MAX_REPORT_EXAMS))})
                </span>
              </h2>
              <button
                type="button"
                onClick={() =>
                  setPicked(
                    chosen.length === Math.min(examColumns.length, MAX_REPORT_EXAMS)
                      ? []
                      : examColumns.slice(-MAX_REPORT_EXAMS).map((c) => c.id),
                  )
                }
                className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
              >
                {chosen.length === Math.min(examColumns.length, MAX_REPORT_EXAMS) ? "إلغاء الكل" : "كل الامتحانات"}
              </button>
              <button
                type="button"
                onClick={() => run(chosenInOrder)}
                disabled={chosen.length === 0 || report.isPending}
                className={primaryButton}
              >
                {report.isPending ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                عرض التقرير
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {examColumns.map((column) => {
                const on = chosen.includes(column.id);
                return (
                  <button
                    key={column.id}
                    type="button"
                    onClick={() => toggle(column.id)}
                    aria-pressed={on}
                    disabled={!on && chosen.length >= MAX_REPORT_EXAMS}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-semibold transition disabled:opacity-40",
                      on
                        ? "border-blue-600 bg-blue-600 dark:bg-blue-700 text-white"
                        : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800",
                    )}
                  >
                    {on && <Check size={14} />}
                    {column.name}
                  </button>
                );
              })}
            </div>
            <p className="flex items-start gap-1.5 text-xs text-zinc-500">
              <Info size={13} className="mt-0.5 shrink-0" />
              الامتحانات بلا تاريخ: لتقرير أسبوعي أو شهري اختر امتحانات تلك الفترة. تُرتَّب بترتيب أعمدة الجدول، من
              الأقدم إلى الأحدث.
            </p>
            {stale && (
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                غيّرت الامتحانات المختارة. اضغط «عرض التقرير» لتحديثه.
              </p>
            )}
          </section>

          {reportError && (
            <p className="mt-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
              {reportError}
            </p>
          )}

          {report.isPending && !data && (
            <div className="mt-6 flex flex-col gap-4">
              <Skeleton className="h-44 w-full rounded-3xl" />
              <Skeleton className="h-64 w-full rounded-3xl" />
            </div>
          )}

          {data && (
            <div className={cn("mt-6 flex flex-col gap-5 transition-opacity", report.isPending && "opacity-60")}>
              {multiExam && data.overall && (
                <OverallCard
                  overall={data.overall}
                  examNames={data.exams.map((e) => e.name)}
                  pick={filter.pick}
                  onPick={pickStanding}
                />
              )}

              <Highlights
                highlights={data.highlights}
                multiExam={multiExam}
                onFollowUp={(student) => {
                  setFilter({ ...NO_FILTER, search: student.name });
                  studentsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              />

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {data.exams.map((exam) => (
                  <ExamCard key={exam.columnId} exam={exam} pick={filter.pick} onPick={pickStanding} />
                ))}
              </div>

              <div ref={studentsRef} className="scroll-mt-4">
                <StudentsTable students={data.students} exams={data.exams} filter={filter} onFilter={setFilter} />
              </div>

              <Link href={`/tracking-tables/${groupId}`} className={cn(secondaryButton, "self-start")}>
                <ChevronRight size={16} /> العودة إلى الجدول
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
