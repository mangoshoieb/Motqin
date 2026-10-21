"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertCircle, BrainCircuit, CalendarClock, CheckCircle2, FlaskConical, Repeat } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { ReviewGroup, ReviewItem, useSpacedRepetitionPlans } from "@/app/hooks/useSpacedRepetitionPlans";

interface SpacedRepetitionColumnProps {
  date: string; // YYYY-MM-DD, the board's day
}

const GROUP_BADGE: Record<ReviewGroup, { label: string; className: string }> = {
  missed: {
    label: "فائتة",
    className: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  },
  coming: {
    label: "قادمة",
    className: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  },
  completed: {
    label: "مكتملة",
    className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
};

// Same "{id}-{name}" segment the subjects page links with; the quiz page
// only reads the id before the first dash.
const subjectSegment = (item: ReviewItem) =>
  item.subjectName
    ? `${item.subjectId}-${item.subjectName.toLowerCase().replace(/\s+/g, "-")}`
    : String(item.subjectId);

// Placeholder reviews for laying out the column while the backend has none
// to return. Only ever offered in development (see the empty state).
const SAMPLE_REVIEWS: ReviewItem[] = [
  {
    id: -1,
    subjectId: 0,
    lessonId: 0,
    category: "أساسيات",
    repetitionNumber: 2,
    group: "missed",
    subjectName: "الكيمياء",
    lessonTitle: "الحمض والقاعدة",
    lastScore: { correct: 4, total: 10 },
  },
  {
    id: -2,
    subjectId: 0,
    lessonId: 0,
    category: "معلومات مهمة",
    repetitionNumber: 1,
    group: "coming",
    subjectName: "الفيزياء",
    lessonTitle: "قوانين نيوتن",
    lastScore: { correct: 7, total: 10 },
  },
  {
    id: -3,
    subjectId: 0,
    lessonId: 0,
    category: "معلومات إضافية",
    repetitionNumber: 3,
    group: "coming",
    subjectName: "الأحياء",
    lessonTitle: "الخلية",
  },
  {
    id: -4,
    subjectId: 0,
    lessonId: 0,
    category: "أساسيات",
    repetitionNumber: 4,
    group: "completed",
    subjectName: "الكيمياء",
    lessonTitle: "الروابط الكيميائية",
    lastScore: { correct: 9, total: 10 },
  },
];

function ReviewCard({ item, onStart }: { item: ReviewItem; onStart: (item: ReviewItem) => void }) {
  const badge = GROUP_BADGE[item.group];
  const done = item.group === "completed";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg bg-white p-4 dark:bg-zinc-900",
        item.group === "missed" && "ring-1 ring-red-200 dark:ring-red-900/50",
      )}
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className={cn("truncate text-sm font-medium", done && "text-zinc-500 line-through opacity-60")}>
            {item.lessonTitle ?? `الدرس #${item.lessonId}`}
          </p>
          <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
            {item.subjectName ? `${item.subjectName} · ` : ""}
            {item.category}
          </p>
        </div>
        <span className={cn("shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold", badge.className)}>
          {badge.label}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1">
          <Repeat size={12} />
          التكرار #{item.repetitionNumber}
        </span>
        {item.lastScore && (
          <span className="flex items-center gap-1 tabular-nums">
            <CheckCircle2 size={12} />
            آخر نتيجة: {item.lastScore.correct}/{item.lastScore.total}
          </span>
        )}
      </div>

      {!done && (
        <button
          type="button"
          onClick={() => onStart(item)}
          className={cn(
            "self-start rounded-full px-4 py-1.5 text-xs font-semibold text-white transition",
            item.group === "missed" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700",
          )}
        >
          ابدأ المراجعة
        </button>
      )}
    </div>
  );
}

// The board's second column: the day's spaced-repetition reviews, from
// GET /spaced-repetition/plans/filter. It stays in place when there are
// none, with a note saying so, so the board keeps the same two-column shape.
export const SpacedRepetitionColumn = ({ date }: SpacedRepetitionColumnProps) => {
  const router = useRouter();
  const { items, isLoading, isError } = useSpacedRepetitionPlans(date);
  const [showSample, setShowSample] = useState(false);

  const sample = showSample && items.length === 0;
  const reviews = sample ? SAMPLE_REVIEWS : items;
  const pending = reviews.filter((item) => item.group !== "completed").length;

  const startReview = (item: ReviewItem) => {
    if (sample) {
      toast.info("هذه بيانات تجريبية للعرض فقط");
      return;
    }
    router.push(
      `/subjects/${subjectSegment(item)}/${item.lessonId}/quiz?category=${encodeURIComponent(item.category)}`,
    );
  };

  return (
    <section className="flex flex-col gap-3">
      <div className="flex min-h-10 items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
          <BrainCircuit size={20} className="text-violet-500" />
          المراجعات المتباعدة
        </h2>
        {reviews.length > 0 && (
          <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
            {pending > 0 ? `${pending} متبقية` : "اكتملت كلها"}
          </span>
        )}
      </div>

      {sample && (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          <FlaskConical size={14} className="shrink-0" />
          <span className="flex-1">بيانات تجريبية للعرض فقط (وضع التطوير)</span>
          <button type="button" onClick={() => setShowSample(false)} className="font-semibold hover:underline">
            إخفاء
          </button>
        </div>
      )}

      {isLoading ? (
        <p className="rounded-lg bg-white p-5 text-sm text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
          جاري تحميل المراجعات...
        </p>
      ) : reviews.length > 0 ? (
        <div className="flex flex-col gap-3">
          {reviews.map((item) => (
            <ReviewCard key={item.id} item={item} onStart={startReview} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-zinc-300 bg-white/60 px-4 py-8 text-center dark:border-zinc-700 dark:bg-zinc-900/60">
          {isError ? (
            <>
              <AlertCircle size={24} className="text-red-500" />
              <p className="text-sm text-zinc-600 dark:text-zinc-300">تعذر تحميل المراجعات</p>
            </>
          ) : (
            <>
              <CalendarClock size={24} className="text-zinc-400" />
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                لا توجد مراجعات متباعدة لهذا اليوم
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                ستظهر هنا الدروس المستحقة للمراجعة عند حلول موعدها
              </p>
            </>
          )}
          {process.env.NODE_ENV === "development" && (
            <button
              type="button"
              onClick={() => setShowSample(true)}
              className="mt-2 flex items-center gap-1 rounded-md border border-amber-300 px-2 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950/40"
            >
              <FlaskConical size={12} />
              عرض بيانات تجريبية
            </button>
          )}
        </div>
      )}
    </section>
  );
};
