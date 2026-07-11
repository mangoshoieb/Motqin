"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import { useGetQuestionsByLesson } from "@/app/hooks/useGetQuestionsByLesson";
import { useGetLessons } from "@/app/hooks/useGetLessons";
import { QuestionCard } from "@/components/QuestionCard";
import { AddQuestionForm } from "@/components/AddQuestionForm";
import { cn } from "@/app/lib/utils";

// Category tabs are fixed per the product spec (Basic / Hard / Advanced).
// Matching casing seen in the backend's questionCategory field.
const CATEGORY_TABS = [
  { value: "أساسيات", label: "أساسي" },
  { value: "معلومات إضافية", label: "إضافية" },
  { value: "معلومات مهمة", label: "متقدم" },
] as const;

type CategoryValue = (typeof CATEGORY_TABS)[number]["value"];

const TYPE_FILTERS = [
  { value: "all", label: "كل الأنواع" },
  { value: "MultipleChoiceQuestion", label: "اختيار من متعدد" },
  { value: "FillInTheBlankQuestion", label: "أكمل الفراغ" },
] as const;

type TypeFilterValue = (typeof TYPE_FILTERS)[number]["value"];

const LessonQuestionsPage = () => {
  const params = useParams();
  const subjectIdSlug = params.subjectId as string;
  const subjectId = subjectIdSlug.split("-")[0];
  const lessonId = params.lessonId as string;

  const { data: questions, isLoading, error } = useGetQuestionsByLesson(lessonId);
  const { data: lessonsData } = useGetLessons(subjectId);
  console.log(questions)

  const lessonTitle = lessonsData?.lessons?.find(
    (l) => String(l.lessonId) === lessonId
  )?.title;

  const [activeCategory, setActiveCategory] = useState<CategoryValue>(
    CATEGORY_TABS[0].value
  );
  const [typeFilter, setTypeFilter] = useState<TypeFilterValue>("all");
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
    return (questions ?? []).filter((q) => {
      if (hiddenIds.has(q.questionID)) return false;
      if (typeFilter !== "all" && q.questionType !== typeFilter) return false;
      return (q.questionCategory ?? "").toLowerCase() === activeCategory.toLowerCase();
    });
  }, [questions, hiddenIds, typeFilter, activeCategory]);

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
          href={`/subjects/${subjectIdSlug}/${lessonId}/quiz?category=${activeCategory}&type=${typeFilter}`}
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

      {/* Category tabs + question type select, same row */}
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

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TypeFilterValue)}
          className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 outline-none transition cursor-pointer focus:border-blue-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:focus:border-blue-500"
        >
          {TYPE_FILTERS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Questions list */}
      <div className="flex flex-col gap-4">
        {visibleQuestions.length === 0 && (
          <p className="text-zinc-500 dark:text-zinc-400 py-6">
            لا توجد أسئلة مضافة بعد
          </p>
        )}

        {visibleQuestions.map((q) => (
          <QuestionCard key={q.questionID} question={q} onHide={hideQuestion} />
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
