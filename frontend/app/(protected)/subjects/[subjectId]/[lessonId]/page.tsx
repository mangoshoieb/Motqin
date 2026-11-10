"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, FileText, ImageIcon, Plus, Sparkles } from "lucide-react";

import { useGetAllLessonInformation } from "@/app/hooks/useGetLessonInformation";
import { useGetLessons } from "@/app/hooks/useGetLessons";
import { QuestionCard } from "@/components/QuestionCard";
import { InfoCardDialog } from "@/components/InfoCardDialog";
import { StartQuizButton } from "@/components/StartQuizButton";
import { IgnoredQuestions } from "@/components/IgnoredQuestions";
import { useIgnoreQuestion, useRestoreQuestion } from "@/app/hooks/useIgnoredQuestions";
import { getApiErrorMessage } from "@/app/lib/api-error";
import { AddQuestionDialog } from "@/components/AddQuestionDialog";
import { AiQuestionsDialog, type GeneratedQuestion } from "@/components/AiQuestionsDialog";
import { useAiQuestionsReviewStore } from "@/app/lib/ai-questions-review.store";
import type { QuestionDraft } from "@/app/lib/question-draft";
import { PdfQuestionsDialog } from "@/components/PdfQuestionsDialog";
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

  // All three category tabs at once, so switching tabs is instant and the
  // next display order is the lesson-wide one.
  const { data: information, isLoading, error } = useGetAllLessonInformation(lessonId);
  const { data: lessonsData } = useGetLessons(subjectId);

  const lesson = lessonsData?.lessons?.find((l) => String(l.lessonId) === lessonId);
  const lessonTitle = lesson?.title;

  const [activeCategory, setActiveCategory] = useState<CategoryValue>(
    CATEGORY_TABS[0].value
  );
  const [openInfo, setOpenInfo] = useState<LessonInformation | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  // A question the AI filled in from a photo, opened in the add popup.
  const [prefilledDraft, setPrefilledDraft] = useState<QuestionDraft | null>(null);
  const startReview = useAiQuestionsReviewStore((state) => state.start);
  const [isGenerating, setIsGenerating] = useState(false);

  // "?ai=pdf" is how the lessons page hands over a lesson it just created
  // from a PDF: open the PDF popup straight away, then drop the flag so a
  // refresh or a back-navigation doesn't reopen it.
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isGeneratingFromPdf, setIsGeneratingFromPdf] = useState(
    () => searchParams.get("ai") === "pdf"
  );
  useEffect(() => {
    if (searchParams.get("ai") === "pdf") router.replace(pathname, { scroll: false });
  }, [searchParams, router, pathname]);

  // Only system questions can be ignored: none in the student's own lesson,
  // and none the student added (once the rows say so with isMine).
  const ignoreQuestion = useIgnoreQuestion(lessonId);
  const restoreQuestion = useRestoreQuestion(lessonId);
  const canIgnore = (item: LessonInformation) => !lesson?.isMine && item.isMine !== true;
  const handleIgnore = (item: LessonInformation) =>
    ignoreQuestion.mutate(item, {
      onSuccess: () =>
        toast("تم تجاهل السؤال", {
          action: {
            label: "تراجع",
            onClick: () =>
              restoreQuestion.mutate(item, {
                onError: (error) => toast.error(getApiErrorMessage(error)),
              }),
          },
        }),
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });

  // One question from a photo opens prefilled in the add popup; several go
  // to the review page, the same one the PDF flow uses.
  const handleGeneratedFromImage = (generated: GeneratedQuestion[]) => {
    setIsGenerating(false);
    if (generated.length === 1) {
      setPrefilledDraft(generated[0].draft);
      setIsAdding(true);
      return;
    }
    const stamp = Date.now();
    startReview(
      Number(lessonId),
      generated.map(({ draft, pageNumber }, i) => ({
        key: `${stamp}-${i}`,
        draft,
        pageNumber,
        edited: false,
        saveError: null,
      }))
    );
    router.push(`/subjects/${subjectIdSlug}/${lessonId}/review-ai-questions`);
  };

  const closeAddDialog = () => {
    setIsAdding(false);
    setPrefilledDraft(null);
  };

  const switchCategory = (value: CategoryValue) => {
    setActiveCategory(value);
  };

  // A new question goes after every existing one in the lesson.
  const nextDisplayOrder =
    (information ?? []).reduce((max, item) => Math.max(max, item.displayOrder), 0) + 1;

  // The active tab's questions — what the quiz will run. Ignored ones are
  // already left out by the backend.
  const categoryQuestions = useMemo(() => {
    return (information ?? [])
      .filter((item) => (item.informationCategory ?? "").trim() === activeCategory)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [information, activeCategory]);

  const finishedCount = categoryQuestions.filter((item) => item.isFinished).length;

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

        <div className="flex flex-wrap items-center gap-4">
          {/* Progress only once something is finished. */}
          {finishedCount > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-2 text-sm font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
              <CheckCircle2 className="size-4" />
              أنهيت <span className="tabular-nums">{finishedCount}</span> من{" "}
              <span className="tabular-nums">{categoryQuestions.length}</span>
            </span>
          )}
          <StartQuizButton
            lessonId={lessonId}
            category={activeCategory}
            // activeCategory is Arabic text — it must be percent-encoded, or it
            // ends up raw in an HTTP header and throws
            // "Cannot convert argument to a ByteString".
            quizHref={`/subjects/${subjectIdSlug}/${lessonId}/quiz?category=${encodeURIComponent(
              activeCategory
            )}`}
            // Some of this tab is already done — the quiz picks up from there.
            hasProgress={finishedCount > 0}
            disabled={categoryQuestions.length === 0}
          />
        </div>
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

        {/* Add question — by hand, or generated by the AI from a photo or a PDF */}
        <div className="flex flex-wrap items-center gap-3">
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
            className="group inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 font-semibold transition hover:border-indigo-300 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-950/70"
          >
            <ImageIcon className="size-4" />
            اضافة سؤال من صورة
            <Sparkles className="size-3.5 transition-transform group-hover:rotate-12" />
          </button>

          <button
            type="button"
            onClick={() => setIsGeneratingFromPdf(true)}
            className="group relative inline-flex items-center gap-1.5 overflow-hidden px-5 py-2.5 rounded-full bg-gradient-to-l from-indigo-600 to-blue-400 text-white font-semibold shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40"
          >
            {/* Light sweep on hover */}
            <span className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer" />
            <FileText className="size-4" />
            أسئلة من PDF
            <Sparkles className="size-3.5 transition-transform group-hover:rotate-12" />
          </button>
        </div>
      </div>

      {/* Questions list */}
      <div className="flex flex-col gap-4">
        {categoryQuestions.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400 py-6">
            لا توجد أسئلة مضافة بعد
          </p>
        ) : (
          categoryQuestions.map((item) => (
            <QuestionCard
              key={item.informationID}
              information={item}
              onIgnore={canIgnore(item) ? handleIgnore : undefined}
              isIgnoring={
                ignoreQuestion.isPending &&
                ignoreQuestion.variables?.informationID === item.informationID
              }
              onOpen={setOpenInfo}
            />
          ))
        )}
      </div>

      <IgnoredQuestions lessonId={lessonId} category={activeCategory} />

      {isAdding && (
        <AddQuestionDialog
          lessonId={Number(lessonId)}
          defaultCategory={activeCategory}
          displayOrder={nextDisplayOrder}
          initialDraft={prefilledDraft ?? undefined}
          onCreated={(category) => {
            closeAddDialog();
            // Show the tab the new question landed in.
            setActiveCategory(category);
          }}
          onCancel={closeAddDialog}
        />
      )}

      {isGenerating && (
        <AiQuestionsDialog
          onGenerated={handleGeneratedFromImage}
          onCancel={() => setIsGenerating(false)}
        />
      )}

      {openInfo && <InfoCardDialog information={openInfo} onClose={() => setOpenInfo(null)} />}

      {isGeneratingFromPdf && (
        <PdfQuestionsDialog
          lessonId={Number(lessonId)}
          lessonTitle={lessonTitle}
          reviewHref={`/subjects/${subjectIdSlug}/${lessonId}/review-ai-questions`}
          onCancel={() => setIsGeneratingFromPdf(false)}
        />
      )}
    </div>
  );
};

export default LessonQuestionsPage;
