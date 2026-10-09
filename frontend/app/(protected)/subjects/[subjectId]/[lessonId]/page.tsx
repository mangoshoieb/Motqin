"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";

import { useGetLessonInformation } from "@/app/hooks/useGetLessonInformation";
import { useGetLessons } from "@/app/hooks/useGetLessons";
import { QuestionCard } from "@/components/QuestionCard";
import { AddQuestionDialog } from "@/components/AddQuestionDialog";
import { AiQuestionsDialog } from "@/components/AiQuestionsDialog";
import { cn } from "@/app/lib/utils";
import {
  QUESTION_CATEGORIES as CATEGORY_TABS,
  type QuestionCategoryValue as CategoryValue,
} from "@/app/constants/question.constants";

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
  const [isGenerating, setIsGenerating] = useState(false);

  const hideQuestion = (id: number) => {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const switchCategory = (value: CategoryValue) => {
    setActiveCategory(value);
  };

  // A new question goes after every existing one in the lesson.
  const nextDisplayOrder =
    (information ?? []).reduce((max, item) => Math.max(max, item.displayOrder), 0) + 1;

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

      {/* Add question — by hand, or generated by the AI from a file */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-dashed border-blue-400 text-blue-600 font-medium transition hover:bg-blue-50 dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-950/40"
        >
          <Plus className="size-4" />
          إضافة سؤال
        </button>

        <button
          type="button"
          onClick={() => setIsGenerating(true)}
          className="group relative inline-flex items-center gap-1.5 overflow-hidden px-5 py-2.5 rounded-full bg-gradient-to-l from-indigo-600 to-blue-400 text-white font-semibold shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40"
        >
          {/* Light sweep on hover */}
          <span className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer" />
          <Sparkles className="size-4 transition-transform group-hover:rotate-12" />
          توليد أسئلة بالذكاء الاصطناعي
        </button>
      </div>

      {isAdding && (
        <AddQuestionDialog
          lessonId={Number(lessonId)}
          defaultCategory={activeCategory}
          displayOrder={nextDisplayOrder}
          onCreated={(category) => {
            setIsAdding(false);
            // Show the tab the new question landed in.
            setActiveCategory(category);
          }}
          onCancel={() => setIsAdding(false)}
        />
      )}

      {isGenerating && (
        <AiQuestionsDialog
          lessonId={Number(lessonId)}
          onDone={() => setIsGenerating(false)}
          onCancel={() => setIsGenerating(false)}
        />
      )}
    </div>
  );
};

export default LessonQuestionsPage;
