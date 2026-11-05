"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Search, X } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { formatNumber } from "@/app/lib/tracking-table";
import { usePerformanceFlags } from "@/app/hooks/useLookups";
import { GOOD_FLAGS, WORRYING_FLAGS } from "@/app/constants/tracking-table.constants";
import { ExamStats, PerformanceFlag, Standing, StudentPerformance } from "@/app/types/tracking-table.types";
import { inputClass } from "../ui";
import { StandingPick } from "./cards";
import { STANDING_STYLE, num, pct, signed } from "./format";

type SortKey = "rank" | "name" | "average" | "trend" | "change";

export interface StudentFilter {
  pick: StandingPick | null; // from the bars
  flag: PerformanceFlag | "";
  search: string;
}

const headerButton =
  "inline-flex items-center gap-1 whitespace-nowrap text-xs font-bold text-zinc-500 transition hover:text-zinc-900 dark:hover:text-zinc-100";

// One row per student: rank, name with flags, a cell per exam coloured by
// its standing, the average, the overall standing and (several exams) the
// trend. Opens sorted by rank; students absent from every exam go last.
export function StudentsTable({
  students,
  exams,
  filter,
  onFilter,
}: {
  students: StudentPerformance[];
  exams: ExamStats[];
  filter: StudentFilter;
  onFilter: (filter: StudentFilter) => void;
}) {
  const { standings, flags } = usePerformanceFlags();
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: "rank", desc: false });
  const multiExam = exams.length > 1;
  const standingName = (key: Standing) => standings.find((s) => s.key === key)?.nameAr ?? key;
  const flagName = (key: PerformanceFlag) => flags.find((f) => f.key === key)?.nameAr ?? key;
  const examIndex = (columnId: string) => exams.findIndex((e) => e.columnId === columnId);

  const presentFlags = useMemo(
    () => flags.filter((f) => students.some((s) => s.flags.includes(f.key))),
    [flags, students],
  );

  const rows = useMemo(() => {
    const search = filter.search.trim();
    const pickedIndex = filter.pick?.examId ? exams.findIndex((e) => e.columnId === filter.pick?.examId) : -1;
    const matches = students.filter((s) => {
      if (search && !s.name.includes(search)) return false;
      if (filter.flag && !s.flags.includes(filter.flag)) return false;
      if (filter.pick) {
        const standing = filter.pick.examId ? s.scores[pickedIndex]?.standing : s.standing;
        if (standing !== filter.pick.standing) return false;
      }
      return true;
    });

    const value = (s: StudentPerformance): number | string | null => {
      switch (sort.key) {
        case "rank":
          return s.rank;
        case "name":
          return s.name;
        case "average":
          return s.average;
        case "trend":
          return s.trend;
        case "change":
          return s.change;
      }
    };
    return [...matches].sort((a, b) => {
      // No average (absent from every exam) always sits at the end.
      if (a.average == null !== (b.average == null)) return a.average == null ? 1 : -1;
      const va = value(a);
      const vb = value(b);
      if (va == null || vb == null) return va == null ? (vb == null ? 0 : 1) : -1;
      const order = typeof va === "string" ? va.localeCompare(String(vb), "ar") : va - (vb as number);
      return sort.desc ? -order : order;
    });
  }, [students, exams, filter, sort]);

  const sortBy = (key: SortKey) =>
    setSort((prev) => (prev.key === key ? { key, desc: !prev.desc } : { key, desc: key !== "rank" && key !== "name" }));

  const sortHeader = (label: string, sortKey: SortKey) => (
    <button type="button" onClick={() => sortBy(sortKey)} className={headerButton}>
      {label}
      {sort.key === sortKey && (sort.desc ? <ArrowDown size={12} /> : <ArrowUp size={12} />)}
    </button>
  );

  const pickedExam = filter.pick?.examId ? exams[examIndex(filter.pick.examId)] : null;
  const filtered = !!filter.pick || !!filter.flag || !!filter.search.trim();

  return (
    <section className="flex flex-col gap-3 rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="me-auto font-bold text-zinc-900 dark:text-zinc-100">
          الطلاب <span className="font-normal text-zinc-500">({formatNumber(rows.length)})</span>
        </h2>
        <div className="relative w-full sm:w-56">
          <Search size={15} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            value={filter.search}
            onChange={(e) => onFilter({ ...filter, search: e.target.value })}
            placeholder="ابحث باسم الطالب"
            className={cn(inputClass, "py-2 ps-9")}
          />
        </div>
        <select
          value={filter.pick && !filter.pick.examId ? filter.pick.standing : ""}
          onChange={(e) =>
            onFilter({ ...filter, pick: e.target.value ? { standing: e.target.value as Standing } : null })
          }
          aria-label="المستوى"
          className={cn(inputClass, "w-auto py-2")}
        >
          <option value="">كل المستويات</option>
          {standings.map((s) => (
            <option key={s.key} value={s.key}>
              {s.nameAr}
            </option>
          ))}
        </select>
        {presentFlags.length > 0 && (
          <select
            value={filter.flag}
            onChange={(e) => onFilter({ ...filter, flag: e.target.value as PerformanceFlag | "" })}
            aria-label="ملاحظة"
            className={cn(inputClass, "w-auto py-2")}
          >
            <option value="">كل الملاحظات</option>
            {presentFlags.map((f) => (
              <option key={f.key} value={f.key}>
                {f.nameAr}
              </option>
            ))}
          </select>
        )}
      </div>

      {filtered && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {filter.pick && (
            <span className={cn("rounded-full px-2.5 py-1 font-semibold", STANDING_STYLE[filter.pick.standing].chip)}>
              {standingName(filter.pick.standing)}
              {pickedExam ? ` في ${pickedExam.name}` : ""}
            </span>
          )}
          <button
            type="button"
            onClick={() => onFilter({ pick: null, flag: "", search: "" })}
            className="inline-flex items-center gap-1 font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            <X size={13} /> مسح التصفية
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-max border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="text-start">
              <th className="border-b border-zinc-200 px-2 py-2 text-start dark:border-zinc-800">
                {sortHeader("الترتيب", "rank")}
              </th>
              <th className="border-b border-zinc-200 px-2 py-2 text-start dark:border-zinc-800">
                {sortHeader("الطالب", "name")}
              </th>
              {exams.map((exam) => (
                <th key={exam.columnId} className="border-b border-zinc-200 px-2 py-2 text-start text-xs font-bold text-zinc-500 dark:border-zinc-800">
                  {exam.name}
                </th>
              ))}
              <th className="border-b border-zinc-200 px-2 py-2 text-start dark:border-zinc-800">
                {sortHeader("المعدل", "average")}
              </th>
              <th className="border-b border-zinc-200 px-2 py-2 text-start text-xs font-bold text-zinc-500 dark:border-zinc-800">
                المستوى
              </th>
              {multiExam && (
                <>
                  <th className="border-b border-zinc-200 px-2 py-2 text-start dark:border-zinc-800">
                    {sortHeader("الاتجاه", "trend")}
                  </th>
                  <th className="border-b border-zinc-200 px-2 py-2 text-start dark:border-zinc-800">
                    {sortHeader("منذ أول امتحان", "change")}
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((student) => (
              <tr key={student.rowId} className="align-top">
                <td className="border-b border-zinc-100 px-2 py-2.5 dark:border-zinc-800">
                  {student.rank != null ? (
                    <span className="flex items-center gap-1 tabular-nums">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">#{formatNumber(student.rank)}</span>
                      {multiExam && student.rankChange != null && student.rankChange !== 0 && (
                        <span
                          className={cn(
                            "text-[11px] font-semibold",
                            student.rankChange > 0 ? "text-emerald-700 dark:text-emerald-400" : "text-orange-700 dark:text-orange-400",
                          )}
                          title={student.rankChange > 0 ? "تقدّم في الترتيب" : "تراجع في الترتيب"}
                        >
                          {student.rankChange > 0 ? "▲" : "▼"} {formatNumber(Math.abs(student.rankChange))}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-zinc-400">—</span>
                  )}
                </td>
                <td className="border-b border-zinc-100 px-2 py-2.5 dark:border-zinc-800">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {student.name}
                    {student.absent > 0 && (
                      <span className="ms-2 text-xs font-normal text-zinc-500">غياب {formatNumber(student.absent)}</span>
                    )}
                  </p>
                  {(student.flags.length > 0 || (multiExam && student.stdDev != null && student.stdDev < 5)) && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {multiExam && student.stdDev != null && student.stdDev < 5 && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                          ثابت
                        </span>
                      )}
                      {student.flags.map((flag) => (
                        <span
                          key={flag}
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            WORRYING_FLAGS.includes(flag)
                              ? "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300"
                              : GOOD_FLAGS.includes(flag)
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
                          )}
                        >
                          {flagName(flag)}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                {exams.map((exam, i) => {
                  const score = student.scores[i];
                  return (
                    <td key={exam.columnId} className="border-b border-zinc-100 px-2 py-2.5 dark:border-zinc-800">
                      {!score || (score.score == null && !score.absent) ? (
                        <span className="text-zinc-400">—</span>
                      ) : score.absent ? (
                        <span className="rounded-md bg-zinc-200 px-2 py-0.5 text-xs font-semibold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                          غائب
                        </span>
                      ) : (
                        <span
                          title={score.standing ? standingName(score.standing) : undefined}
                          className={cn(
                            "inline-flex rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums",
                            score.standing && STANDING_STYLE[score.standing].cell,
                          )}
                        >
                          {num(score.score)} / {formatNumber(exam.maxScore)}
                        </span>
                      )}
                    </td>
                  );
                })}
                <td className="border-b border-zinc-100 px-2 py-2.5 text-base font-bold tabular-nums text-zinc-900 dark:border-zinc-800 dark:text-zinc-100">
                  {pct(student.average)}
                </td>
                <td className="border-b border-zinc-100 px-2 py-2.5 dark:border-zinc-800">
                  {student.standing ? (
                    <span className={cn("whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold", STANDING_STYLE[student.standing].chip)}>
                      {standingName(student.standing)}
                    </span>
                  ) : (
                    <span className="text-zinc-400">—</span>
                  )}
                </td>
                {multiExam && (
                  <>
                    <td className="border-b border-zinc-100 px-2 py-2.5 dark:border-zinc-800">
                      {student.trend == null ? (
                        <span className="text-zinc-400">—</span>
                      ) : (
                        <span
                          className={cn(
                            "whitespace-nowrap text-xs font-semibold tabular-nums",
                            student.trend > 0
                              ? "text-emerald-700 dark:text-emerald-400"
                              : student.trend < 0
                                ? "text-orange-700 dark:text-orange-400"
                                : "text-zinc-500",
                          )}
                        >
                          {student.trend > 0 ? "▲ " : student.trend < 0 ? "▼ " : ""}
                          {signed(student.trend)} نقطة لكل امتحان
                        </span>
                      )}
                    </td>
                    <td className="border-b border-zinc-100 px-2 py-2.5 dark:border-zinc-800">
                      {student.change == null ? (
                        <span className="text-zinc-400">—</span>
                      ) : (
                        <span
                          className={cn(
                            "whitespace-nowrap text-xs font-semibold tabular-nums",
                            student.change > 0
                              ? "text-emerald-700 dark:text-emerald-400"
                              : student.change < 0
                                ? "text-orange-700 dark:text-orange-400"
                                : "text-zinc-500",
                          )}
                        >
                          {signed(student.change)} نقطة
                        </span>
                      )}
                    </td>
                  </>
                )}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={exams.length + (multiExam ? 6 : 4)} className="px-4 py-10 text-center text-sm text-zinc-500">
                  لا يوجد طلاب يطابقون التصفية.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
