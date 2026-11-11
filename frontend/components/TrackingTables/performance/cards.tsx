"use client";

import { AlertTriangle, Award, BookOpen, Repeat, TrendingDown, TrendingUp, Trophy } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { formatNumber } from "@/app/lib/tracking-table";
import {
  ClassStats,
  ExamStats,
  PerformanceHighlight,
  PerformanceHighlights,
  Standing,
} from "@/app/types/tracking-table.types";
import { DistributionChart, StandingBar } from "./charts";
import { num, pct, signed, spreadWord } from "./format";

export type StandingPick = { standing: Standing; examId?: string };

const card = "flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900";

// Arabic agreement: امتحانين, 3–10 امتحانات, 11+ امتحانًا.
const examsLabel = (count: number) =>
  count === 2
    ? "امتحانين"
    : count <= 10
      ? `${formatNumber(count)} امتحانات`
      : `${formatNumber(count)} امتحانًا`;

const Spread = ({ stdDev }: { stdDev: number | null }) => (
  <span title={stdDev == null ? undefined : `الانحراف المعياري ${formatNumber(stdDev)}`} className="cursor-help underline decoration-dotted underline-offset-4">
    {spreadWord(stdDev)}
  </span>
);

// All chosen exams together, worked out on each student's average. Shown
// only with two exams or more — with one it repeats the exam's card.
export function OverallCard({
  overall,
  examNames,
  pick,
  onPick,
}: {
  overall: ClassStats;
  examNames: string[];
  pick: StandingPick | null;
  onPick: (pick: StandingPick) => void;
}) {
  return (
    <section className={card}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-zinc-500">متوسط الفصل في {examsLabel(examNames.length)}</p>
          <p className="mt-1 text-5xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{pct(overall.mean)}</p>
          <p className="mt-1 text-sm text-zinc-500">
            الوسيط {pct(overall.median)} · أقل {pct(overall.min)} · أعلى {pct(overall.max)}
          </p>
        </div>
        <div className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-300">
          <p>
            مستوى الفصل: <span className="font-bold text-zinc-900 dark:text-zinc-100"><Spread stdDev={overall.stdDev} /></span>
          </p>
          {overall.averageFrom != null && overall.averageTo != null && (
            <p>
              المتوسط من {pct(overall.averageFrom)} إلى {pct(overall.averageTo)}
            </p>
          )}
          <p>{formatNumber(overall.counted)} طالب</p>
        </div>
      </div>
      <StandingBar
        counts={overall}
        active={pick && !pick.examId ? pick.standing : null}
        onPick={(standing) => onPick({ standing })}
      />
      <div className="flex flex-wrap gap-1.5">
        {examNames.map((name, i) => (
          <span key={i} className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {name}
          </span>
        ))}
      </div>
    </section>
  );
}

export function ExamCard({
  exam,
  pick,
  onPick,
}: {
  exam: ExamStats;
  pick: StandingPick | null;
  onPick: (pick: StandingPick) => void;
}) {
  return (
    <section className={card}>
      <div>
        <h3 className="font-bold text-zinc-900 dark:text-zinc-100">
          {exam.name} <span className="font-normal text-zinc-500">(من {formatNumber(exam.maxScore)})</span>
        </h3>
        <p className="mt-0.5 text-xs text-zinc-500">
          حضر {formatNumber(exam.counted)} · غاب {formatNumber(exam.absent)}
          {exam.missing > 0 && ` · لم تُسجَّل ${formatNumber(exam.missing)}`}
        </p>
      </div>

      <div>
        <p className="text-3xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
          {num(exam.meanScore)} / {formatNumber(exam.maxScore)}{" "}
          <span className="text-lg font-semibold text-zinc-500">({pct(exam.mean)})</span>
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          الوسيط {pct(exam.median)} · أقل {pct(exam.min)} · أعلى {pct(exam.max)}
        </p>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-600 dark:text-zinc-300">
        <span>
          المستوى: <span className="font-bold text-zinc-900 dark:text-zinc-100"><Spread stdDev={exam.stdDev} /></span>
        </span>
        {exam.passRate != null && (
          <span>
            نسبة النجاح <span className="font-bold text-zinc-900 dark:text-zinc-100">{pct(exam.passRate)}</span>
          </span>
        )}
        {exam.fullMarks > 0 && (
          <span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100">{formatNumber(exam.fullMarks)}</span> درجة نهائية
          </span>
        )}
        {exam.averageFrom != null && exam.averageTo != null && (
          <span>
            المتوسط من {pct(exam.averageFrom)} إلى {pct(exam.averageTo)}
          </span>
        )}
      </div>

      <StandingBar
        counts={exam}
        active={pick?.examId === exam.columnId ? pick.standing : null}
        onPick={(standing) => onPick({ standing, examId: exam.columnId })}
      />
      <DistributionChart bins={exam.distribution} />
    </section>
  );
}

const HighlightCard = ({
  icon: Icon,
  title,
  tone = "neutral",
  children,
}: {
  icon: typeof Trophy;
  title: string;
  tone?: "neutral" | "good" | "bad";
  children: React.ReactNode;
}) => (
  <div
    className={cn(
      "flex flex-col gap-2 rounded-2xl border bg-white p-4 dark:bg-zinc-900",
      tone === "bad" ? "border-orange-300 border-s-4 dark:border-orange-800" : "border-zinc-200 dark:border-zinc-800",
    )}
  >
    <p className="flex items-center gap-1.5 text-xs font-bold text-zinc-500">
      <Icon size={14} className={tone === "good" ? "text-emerald-600 dark:text-emerald-400" : tone === "bad" ? "text-orange-600 dark:text-orange-400" : "text-blue-600 dark:text-blue-400"} />
      {title}
    </p>
    {children}
  </div>
);

// The cards a teacher reads first. Anything null is left out.
export function Highlights({
  highlights,
  multiExam,
  onFollowUp,
}: {
  highlights: PerformanceHighlights;
  multiExam: boolean;
  onFollowUp: (student: PerformanceHighlight) => void;
}) {
  const { top, needsFollowUp, mostImproved, mostDeclined, hardestExam, easiestExam, mostConsistent, leastConsistent } =
    highlights;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {top.length > 0 && (
        <HighlightCard icon={Trophy} title="الأعلى معدلًا" tone="good">
          <ol className="flex flex-col gap-1">
            {top.map((student, i) => (
              <li key={student.rowId ?? i} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate font-semibold text-zinc-900 dark:text-zinc-100">
                  <span className="me-1.5 text-zinc-400 tabular-nums">{formatNumber(i + 1)}</span>
                  {student.name}
                </span>
                <span className="shrink-0 font-bold tabular-nums">{pct(student.value)}</span>
              </li>
            ))}
          </ol>
        </HighlightCard>
      )}

      {needsFollowUp.length > 0 && (
        <HighlightCard icon={AlertTriangle} title={`يحتاجون متابعة (${formatNumber(needsFollowUp.length)})`} tone="bad">
          <ul className="flex max-h-36 flex-col gap-1 overflow-y-auto">
            {needsFollowUp.map((student, i) => (
              <li key={student.rowId ?? i} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate text-zinc-900 dark:text-zinc-100">{student.name}</span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="font-bold tabular-nums">{pct(student.value)}</span>
                  <button
                    type="button"
                    onClick={() => onFollowUp(student)}
                    className="rounded-full border border-orange-300 px-2 py-0.5 text-[11px] font-bold text-orange-700 transition hover:bg-orange-50 dark:border-orange-800 dark:text-orange-300 dark:hover:bg-orange-500/10"
                  >
                    متابعة
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </HighlightCard>
      )}

      {multiExam && (mostImproved || mostDeclined) && (
        <HighlightCard icon={TrendingUp} title="التغيّر منذ أول امتحان">
          {mostImproved && (
            <p className="flex items-center justify-between gap-2 text-sm">
              <span className="flex min-w-0 items-center gap-1.5 text-zinc-500">
                <TrendingUp size={14} className="shrink-0 text-emerald-600 dark:text-emerald-400" /> أكثر تحسنًا:
                <span className="truncate font-semibold text-zinc-900 dark:text-zinc-100">{mostImproved.name}</span>
              </span>
              <span className="shrink-0 font-bold tabular-nums text-emerald-700 dark:text-emerald-400">{signed(mostImproved.value)}</span>
            </p>
          )}
          {mostDeclined && (
            <p className="flex items-center justify-between gap-2 text-sm">
              <span className="flex min-w-0 items-center gap-1.5 text-zinc-500">
                <TrendingDown size={14} className="shrink-0 text-orange-600 dark:text-orange-400" /> أكثر تراجعًا:
                <span className="truncate font-semibold text-zinc-900 dark:text-zinc-100">{mostDeclined.name}</span>
              </span>
              <span className="shrink-0 font-bold tabular-nums text-orange-700 dark:text-orange-400">{signed(mostDeclined.value)}</span>
            </p>
          )}
        </HighlightCard>
      )}

      {multiExam && (hardestExam || easiestExam) && (
        <HighlightCard icon={BookOpen} title="الامتحانات">
          {hardestExam && (
            <p className="text-sm text-zinc-500">
              أصعب امتحان: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{hardestExam.name}</span> ({pct(hardestExam.value)})
            </p>
          )}
          {easiestExam && (
            <p className="text-sm text-zinc-500">
              أسهل امتحان: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{easiestExam.name}</span> ({pct(easiestExam.value)})
            </p>
          )}
        </HighlightCard>
      )}

      {multiExam && (mostConsistent || leastConsistent) && (
        <HighlightCard icon={Repeat} title="الثبات">
          {mostConsistent && (
            <p className="text-sm text-zinc-500">
              الأكثر ثباتًا: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{mostConsistent.name}</span>
            </p>
          )}
          {leastConsistent && (
            <p className="text-sm text-zinc-500">
              الأقل ثباتًا: <span className="font-semibold text-zinc-900 dark:text-zinc-100">{leastConsistent.name}</span>
            </p>
          )}
        </HighlightCard>
      )}

      {!multiExam && top.length === 0 && needsFollowUp.length === 0 && (
        <HighlightCard icon={Award} title="ملاحظات">
          <p className="text-sm text-zinc-500">لا توجد ملاحظات بعد.</p>
        </HighlightCard>
      )}
    </div>
  );
}
