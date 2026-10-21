"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronsDownUp, ChevronsUpDown, Sparkles } from "lucide-react";

import { useGetLessons } from "@/app/hooks/useGetLessons";
import { lessonInformationKey } from "@/app/hooks/useGetLessonInformation";
import { useUnsavedChangesGuard } from "@/app/hooks/useUnsavedChangesGuard";
import { useAiQuestionsReviewStore } from "@/app/lib/ai-questions-review.store";
import {
  hasDraftErrors,
  questionDraftToInput,
  validateQuestionDraft,
  type QuestionDraftErrors,
} from "@/app/lib/question-draft";
import { questionService } from "@/app/services/question.service";
import { getApiErrorMessage } from "@/app/lib/api-error";
import { cn } from "@/app/lib/utils";
import {
  QUESTION_CATEGORIES,
  type QuestionCategoryValue,
} from "@/app/constants/question.constants";
import { ReviewQuestionCard } from "@/components/ReviewQuestionCard";
import { ConfirmDialog } from "@/components/ConfirmDialog";

type Filter = "all" | "invalid" | QuestionCategoryValue;

// "سؤال واحد / سؤالان / 3 أسئلة / 24 سؤالًا"
const questionsCount = (n: number) =>
  n === 1 ? "سؤال واحد" : n === 2 ? "سؤالان" : n >= 3 && n <= 10 ? `${n} أسئلة` : `${n} سؤالًا`;

// Temporary page for AI-generated questions: the student checks and edits
// them here, and only "save" writes them — one add-user-question call each.
// The batch lives in memory (useAiQuestionsReviewStore), so this page is
// guarded against leaving while it still holds unsaved questions.
const ReviewAiQuestionsPage = () => {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const subjectIdSlug = params.subjectId as string;
  const subjectId = subjectIdSlug.split("-")[0];
  const lessonId = params.lessonId as string;
  const lessonHref = `/subjects/${subjectIdSlug}/${lessonId}`;

  const { data: lessonsData } = useGetLessons(subjectId);
  const lessonTitle = lessonsData?.lessons?.find((l) => String(l.lessonId) === lessonId)?.title;

  const storeLessonId = useAiQuestionsReviewStore((s) => s.lessonId);
  const storeItems = useAiQuestionsReviewStore((s) => s.items);
  const { updateDraft, remove, insert, setSaveError, clear } = useAiQuestionsReviewStore.getState();
  // A batch for another lesson isn't this page's to show.
  const items = useMemo(
    () => (storeLessonId === Number(lessonId) ? storeItems : []),
    [storeLessonId, storeItems, lessonId]
  );

  const [filter, setFilter] = useState<Filter>("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  // Set on the way out, so the emptied batch doesn't flash the empty state.
  const [isLeaving, setIsLeaving] = useState(false);
  const isSaving = progress !== null;

  const { pendingHref, confirmLeave, cancelLeave } = useUnsavedChangesGuard(items.length > 0);

  const errorsByKey = useMemo(() => {
    const map = new Map<string, QuestionDraftErrors>();
    items.forEach((item) => map.set(item.key, validateQuestionDraft(item.draft)));
    return map;
  }, [items]);
  const isInvalid = (key: string) => hasDraftErrors(errorsByKey.get(key) ?? {});
  const invalidCount = items.filter((item) => isInvalid(item.key)).length;

  const numberByKey = useMemo(() => new Map(items.map((item, i) => [item.key, i + 1])), [items]);
  const visible = items.filter((item) =>
    filter === "all"
      ? true
      : filter === "invalid"
        ? isInvalid(item.key) || !!item.saveError
        : item.draft.category === filter
  );

  const filters: { value: Filter; label: string; count: number }[] = [
    { value: "all", label: "الكل", count: items.length },
    ...QUESTION_CATEGORIES.map((c) => ({
      value: c.value,
      label: c.label,
      count: items.filter((item) => item.draft.category === c.value).length,
    })),
  ];

  // Open one card on its own and bring it into view.
  const focusCard = (key: string) => {
    setExpanded(new Set([key]));
    requestAnimationFrame(() =>
      document
        .getElementById(`ai-question-${key}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" })
    );
  };

  const toggle = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const handleRemove = (key: string) => {
    const removed = remove(key);
    if (!removed) return;
    setExpanded((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
    toast("تم حذف السؤال", {
      action: { label: "تراجع", onClick: () => insert(removed.item, removed.index) },
    });
  };

  const discardAndLeave = (href: string) => {
    setIsLeaving(true);
    clear();
    router.push(href);
  };

  const handleSave = async () => {
    if (isSaving) return;

    if (invalidCount > 0) {
      const first = items.find((item) => isInvalid(item.key));
      setFilter("all");
      if (first) focusCard(first.key);
      toast.error(`${questionsCount(invalidCount)} بحاجة إلى تعديل قبل الحفظ.`);
      return;
    }

    const queue = [...items];
    setProgress({ done: 0, total: queue.length });

    // New questions go after whatever the lesson already has — re-read so a
    // retry after a partial save continues from the ones that made it.
    let lastOrder = 0;
    try {
      const existing = await questionService.getAllCustomizedInformation(lessonId);
      lastOrder = existing.reduce((max, q) => Math.max(max, q.displayOrder), 0);
    } catch {
      // Fall back to 0: the order is a nicety, not worth blocking the save.
    }

    let failed = 0;
    for (const [index, item] of queue.entries()) {
      try {
        await questionService.addUserQuestion(
          questionDraftToInput(item.draft, Number(lessonId), lastOrder + index + 1)
        );
        // Saved ones leave the list, so a retry never sends them twice.
        remove(item.key);
      } catch (error) {
        failed++;
        setSaveError(item.key, getApiErrorMessage(error));
      }
      setProgress({ done: index + 1, total: queue.length });
    }

    queryClient.invalidateQueries({ queryKey: lessonInformationKey(lessonId) });
    setProgress(null);

    if (failed === 0) {
      toast.success(`تم حفظ ${questionsCount(queue.length)}`);
      discardAndLeave(lessonHref);
    } else {
      setFilter("invalid");
      toast.error(
        `تعذّر حفظ ${questionsCount(failed)} من ${queue.length}. راجعها وأعد المحاولة.`
      );
    }
  };

  if (isLeaving) {
    return <div dir="rtl" className="min-h-screen bg-zinc-100 p-10 text-zinc-500 dark:bg-zinc-950">جاري العودة إلى الدرس...</div>;
  }

  if (items.length === 0 && !isSaving) {
    return (
      <div dir="rtl" className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-100 px-6 text-center dark:bg-zinc-950">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
          <Sparkles className="size-6" />
        </span>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">لا توجد أسئلة للمراجعة</h1>
        <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
          الأسئلة المولّدة تبقى هنا حتى تحفظها فقط، وقد أُغلقت الصفحة أو حُدّثت قبل الحفظ. يمكنك توليدها مرة أخرى من صفحة الدرس.
        </p>
        <Link
          href={lessonHref}
          className="rounded-full bg-blue-600 px-6 py-2.5 font-semibold text-white transition hover:bg-blue-700"
        >
          العودة إلى الدرس
        </Link>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-blue-950 dark:text-blue-100">
              <Sparkles className="size-6 text-indigo-500" />
              مراجعة الأسئلة المولّدة
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {lessonTitle && <>درس: {lessonTitle} · </>}
              {questionsCount(items.length)}
              {invalidCount > 0 && (
                <span className="text-red-600 dark:text-red-400">
                  {" "}· {questionsCount(invalidCount)} بحاجة إلى تعديل
                </span>
              )}
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              راجع الأسئلة وعدّلها كما تشاء، ثم احفظها لتُضاف إلى الدرس.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setExpanded(new Set(visible.map((item) => item.key)))}
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3.5 py-2 text-sm text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
            >
              <ChevronsUpDown className="size-4" />
              توسيع الكل
            </button>
            <button
              type="button"
              onClick={() => setExpanded(new Set())}
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3.5 py-2 text-sm text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
            >
              <ChevronsDownUp className="size-4" />
              طي الكل
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {filters.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition",
                filter === f.value
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
              )}
            >
              {f.label} <span className="tabular-nums opacity-80">{f.count}</span>
            </button>
          ))}
          {(invalidCount > 0 || filter === "invalid") && (
            <button
              type="button"
              onClick={() => setFilter("invalid")}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition",
                filter === "invalid"
                  ? "border-red-600 bg-red-600 text-white"
                  : "border-red-200 bg-white text-red-600 hover:border-red-400 dark:border-red-900 dark:bg-zinc-900 dark:text-red-400"
              )}
            >
              تحتاج تعديل{" "}
              <span className="tabular-nums opacity-80">
                {items.filter((item) => isInvalid(item.key) || item.saveError).length}
              </span>
            </button>
          )}
        </div>

        {/* Questions */}
        <div className="flex flex-col gap-3 pb-6">
          {visible.length === 0 && (
            <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              لا توجد أسئلة في هذا التصنيف.
            </p>
          )}

          {visible.map((item, index) => {
            const prev = visible[index - 1];
            const next = visible[index + 1];
            return (
              <ReviewQuestionCard
                key={item.key}
                item={item}
                number={numberByKey.get(item.key) ?? index + 1}
                errors={errorsByKey.get(item.key) ?? {}}
                expanded={expanded.has(item.key)}
                disabled={isSaving}
                onToggle={() => toggle(item.key)}
                onChange={(patch) => updateDraft(item.key, patch)}
                onRemove={() => handleRemove(item.key)}
                onPrev={prev ? () => focusCard(prev.key) : undefined}
                onNext={next ? () => focusCard(next.key) : undefined}
              />
            );
          })}
        </div>
      </div>

      {/* Save / cancel */}
      <div className="sticky bottom-0 z-30 border-t border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-3 px-4 py-3 sm:px-8">
          <div className="min-w-0 flex-1 text-sm text-zinc-500 dark:text-zinc-400">
            {progress ? (
              <div>
                <p>
                  جاري الحفظ {progress.done} من {progress.total}...
                </p>
                <div className="mt-1.5 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-[width]"
                    style={{ width: `${(progress.done / progress.total) * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <p>سيُضاف {questionsCount(items.length)} إلى الدرس.</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setConfirmCancel(true)}
            disabled={isSaving}
            className="rounded-full border border-zinc-200 px-6 py-2.5 text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-full bg-blue-600 px-6 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {isSaving
              ? "جاري الحفظ..."
              : items.some((item) => item.saveError)
                ? "إعادة المحاولة"
                : `حفظ ${questionsCount(items.length)}`}
          </button>
        </div>
      </div>

      {confirmCancel && (
        <ConfirmDialog
          title="تجاهل الأسئلة المولّدة؟"
          message="لن تُحفظ هذه الأسئلة، وستحتاج إلى توليدها من جديد إذا أردتها لاحقًا."
          confirmLabel="تجاهل"
          cancelLabel="متابعة المراجعة"
          onConfirm={() => discardAndLeave(lessonHref)}
          onCancel={() => setConfirmCancel(false)}
        />
      )}

      {pendingHref && (
        <ConfirmDialog
          title="مغادرة دون حفظ؟"
          message="الأسئلة المولّدة لم تُحفظ بعد، وستفقدها إذا غادرت هذه الصفحة."
          confirmLabel="مغادرة"
          cancelLabel="البقاء"
          onConfirm={() => {
            setIsLeaving(true);
            clear();
            confirmLeave();
          }}
          onCancel={cancelLeave}
        />
      )}
    </div>
  );
};

export default ReviewAiQuestionsPage;
