"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import { useGetLessonInformation } from "@/app/hooks/useGetLessonInformation";
import { useGetLessons } from "@/app/hooks/useGetLessons";
import { QuestionCard } from "@/components/QuestionCard";
import { AddQuestionForm } from "@/components/AddQuestionForm";
import { cn } from "@/app/lib/utils";

// Category tabs are fixed per the product spec. The values must match the
// backend's `informationCategory` string verbatim.
const CATEGORY_TABS = [
  { value: "أساسيات", label: "أساسي" },
  { value: "معلومات إضافية", label: "إضافية" },
  { value: "معلومات مهمة", label: "متقدم" },
] as const;

type CategoryValue = (typeof CATEGORY_TABS)[number]["value"];

// There is deliberately no question-type filter. Every information row has
// both an MCQ and a fill-in-the-blank form, and the session algorithm chooses
// between them from the question's score — the fill-in-the-blank is the
// graduation gate. Letting the student pin one form would defeat that.

const LessonQuestionsPage = () => {
  const params = useParams();
  const subjectIdSlug = params.subjectId as string;
  const subjectId = subjectIdSlug.split("-")[0];
  const lessonId = params.lessonId as string;

  const { data: information, isLoading, error } = useGetLessonInformation(lessonId);
  const { data: lessonsData } = useGetLessons(subjectId);

  const lessonTitle = lessonsData?.lessons?.find(
    (l) => String(l.lessonId) === lessonId
  )?.title;

  const [activeCategory, setActiveCategory] = useState<CategoryValue>(
    CATEGORY_TABS[0].value
  );
  const [hiddenIds, setHiddenIds] = useState<Set<number>>(new Set());
  const [isAdding, setIsAdding] = useState(false);

  const hideQuestion = (id: number) => {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  // Reset the "add question" form state whenever the active tab changes so
  // it doesn't linger open under the wrong category.
  const switchCategory = (value: CategoryValue) => {
    setActiveCategory(value);
    setIsAdding(false);
  };

  const visibleQuestions = useMemo(() => {
    return (information ?? [])
      .filter(
        (item) =>
          !hiddenIds.has(item.informationID) &&
          (item.informationCategory ?? "").trim() === activeCategory
      )
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [information, hiddenIds, activeCategory]);

  if (isLoading) {
    return (
      <div className="p-10 text-zinc-500 dark:text-zinc-400">
        جاري تحميل الأسئلة...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-red-600 dark:text-red-400">
        حدث خطأ أثناء تحميل الأسئلة
      </div>
    );
  }

  return (
    <div dir="rtl" className="bg-zinc-100 dark:bg-zinc-950 min-h-screen px-10 py-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold text-blue-950 dark:text-blue-100">
          {lessonTitle ?? "أسئلة الدرس"}
        </h1>

        <Link
          // activeCategory is Arabic text — it must be percent-encoded, or it
          // ends up raw in an HTTP header and throws
          // "Cannot convert argument to a ByteString".
          href={`/subjects/${subjectIdSlug}/${lessonId}/quiz?category=${encodeURIComponent(
            activeCategory
          )}`}
          aria-disabled={visibleQuestions.length === 0}
          className={cn(
            "px-6 py-3 rounded-full bg-blue-600 text-white font-semibold transition",
            visibleQuestions.length === 0
              ? "opacity-50 pointer-events-none"
              : "hover:bg-blue-700 dark:hover:bg-blue-500"
          )}
        >
          ابدأ
        </Link>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="inline-flex items-center gap-1.5 rounded-2xl bg-zinc-200/70 dark:bg-zinc-900 p-1.5">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => switchCategory(tab.value)}
              className={cn(
                "px-8 py-3.5 rounded-xl text-base font-bold transition-all",
                activeCategory === tab.value
                  ? "bg-white text-blue-700 shadow-sm dark:bg-zinc-800 dark:text-blue-400"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Questions list */}
      <div className="flex flex-col gap-4">
        {visibleQuestions.length === 0 && (
          <p className="text-zinc-500 dark:text-zinc-400 py-6">
            لا توجد أسئلة مضافة بعد
          </p>
        )}

        {visibleQuestions.map((item) => (
          <QuestionCard
            key={item.informationID}
            information={item}
            onHide={hideQuestion}
          />
        ))}
      </div>

      {/* Add question */}
      <div className="mt-6">
        {isAdding ? (
          <AddQuestionForm
            lessonId={Number(lessonId)}
            category={activeCategory}
            onDone={() => setIsAdding(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="px-5 py-2.5 rounded-full border border-dashed border-blue-400 text-blue-600 font-medium transition hover:bg-blue-50 dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-950/40"
          >
            + إضافة سؤال
          </button>
        )}
      </div>
    </div>
  );
};

export default LessonQuestionsPage;
