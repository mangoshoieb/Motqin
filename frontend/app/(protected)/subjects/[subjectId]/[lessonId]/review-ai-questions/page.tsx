"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

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
import { ReviewQuestionView } from "@/components/ReviewQuestionView";
import { ConfirmDialog } from "@/components/ConfirmDialog";

type Filter = "all" | "invalid" | QuestionCategoryValue;

// "سؤال واحد / سؤالان / 3 أسئلة / 24 سؤالًا"
const questionsCount = (n: number) =>
  n === 1 ? "سؤال واحد" : n === 2 ? "سؤالان" : n >= 3 && n <= 10 ? `${n} أسئلة` : `${n} سؤالًا`;

// Temporary page for AI-generated questions: the student checks and edits
// them here, and only "save" writes them — one add-user-question call each.
// One question at a time, as the info card the quiz will show; a sticky
// strip of numbered chips (and the keyboard arrows) moves between them, so a
// long batch never turns into a long scroll.
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
  // The question on screen, and whether its editor is open — the editor
  // stays open while moving on, for working through a batch.
  const [currentKey, setCurrentKey] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const chipRefs = useRef(new Map<string, HTMLButtonElement>());
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

  // The current question, falling back to the first one in view (after a
  // filter change, say).
  const current = visible.find((item) => item.key === currentKey) ?? visible[0];
  const currentIndex = current ? visible.indexOf(current) : -1;
  const prevItem = currentIndex > 0 ? visible[currentIndex - 1] : undefined;
  const nextItem = currentIndex >= 0 ? visible[currentIndex + 1] : undefined;

  // Show a question, optionally with its editor open, and bring the view
  // back to the top of the card if a long one was scrolled past.
  const goTo = (key: string, options?: { openEditor?: boolean }) => {
    setCurrentKey(key);
    if (options?.openEditor) setEditorOpen(true);
    requestAnimationFrame(() => {
      const view = document.getElementById("ai-question-view");
      if (view && view.getBoundingClientRect().top < 0) {
        view.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  };

  // Keep the current chip in sight in the strip.
  useEffect(() => {
    if (!current) return;
    chipRefs.current
      .get(current.key)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [current]);

  // Left / right arrow keys move between questions (in RTL, left is next),
  // except while typing in a field.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable=true]")) return;
      if (event.key === "ArrowLeft" && nextItem) goTo(nextItem.key);
      else if (event.key === "ArrowRight" && prevItem) goTo(prevItem.key);
      else return;
      event.preventDefault();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const handleRemove = (key: string) => {
    // Land on the neighbour rather than jumping back to the first question.
    const index = visible.findIndex((item) => item.key === key);
    const neighbour = visible[index + 1] ?? visible[index - 1];
    const removed = remove(key);
    if (!removed) return;
    setCurrentKey(neighbour?.key ?? null);
    toast("تم حذف السؤال", {
      action: {
        label: "تراجع",
        onClick: () => {
          insert(removed.item, removed.index);
          setCurrentKey(removed.item.key);
        },
      },
    });
  };

  const chipClass = (item: (typeof items)[number], isCurrent: boolean) =>
    isCurrent
      ? "border-blue-600 bg-blue-600 text-white dark:border-blue-700 dark:bg-blue-700"
      : item.saveError || isInvalid(item.key)
        ? "border-red-300 bg-red-50 text-red-700 hover:border-red-400 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        : item.edited
          ? "border-amber-300 bg-amber-50 text-amber-800 hover:border-amber-400 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
          : "border-zinc-200 bg-white text-zinc-600 hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-blue-500/40";

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
      if (first) goTo(first.key, { openEditor: true });
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
          className="rounded-full bg-blue-600 dark:bg-blue-700 px-6 py-2.5 font-semibold text-white transition hover:bg-blue-700 dark:hover:bg-blue-800"
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
              <Sparkles className="size-6 text-indigo-500 dark:text-indigo-400" />
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
              هكذا ستظهر كل معلومة في جلسة المراجعة. افتح الأسئلة تحت أي بطاقة لتعديلها، ثم احفظ لتُضاف إلى الدرس.
            </p>
          </div>

        </div>

        {/* Navigator: filters + a chip per question — sticks while scrolling */}
        <div className="sticky top-0 z-20 -mx-4 mb-6 border-b border-zinc-200 bg-zinc-100/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8 dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {filters.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition",
                filter === f.value
                  ? "border-blue-600 bg-blue-600 dark:bg-blue-700 text-white"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-blue-300 dark:hover:border-blue-500/40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
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
                  ? "border-red-600 bg-red-600 dark:bg-red-700 text-white"
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

          <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="الأسئلة">
            {visible.map((item) => {
              const isCurrent = item.key === current?.key;
              return (
                <button
                  key={item.key}
                  ref={(el) => {
                    if (el) chipRefs.current.set(item.key, el);
                    else chipRefs.current.delete(item.key);
                  }}
                  type="button"
                  role="tab"
                  aria-selected={isCurrent}
                  onClick={() => goTo(item.key)}
                  title={item.draft.title || item.draft.mcqText || undefined}
                  className={cn(
                    "flex h-9 min-w-9 shrink-0 items-center justify-center rounded-lg border px-2 text-sm font-semibold tabular-nums transition",
                    chipClass(item, isCurrent)
                  )}
                >
                  {numberByKey.get(item.key)}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm border border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/40" />
              يحتاج تعديل
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm border border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40" />
              معدّل
            </span>
            <span className="hidden sm:inline">استخدم الأسهم ← → للتنقل بين الأسئلة</span>
          </div>
        </div>

        {/* The current question */}
        <div className="pb-8">
          {current ? (
            <ReviewQuestionView
              key={current.key}
              item={current}
              number={numberByKey.get(current.key) ?? currentIndex + 1}
              total={items.length}
              errors={errorsByKey.get(current.key) ?? {}}
              editorOpen={editorOpen}
              disabled={isSaving}
              onToggleEditor={() => setEditorOpen((open) => !open)}
              onChange={(patch) => updateDraft(current.key, patch)}
              onRemove={() => handleRemove(current.key)}
              onPrev={prevItem ? () => goTo(prevItem.key) : undefined}
              onNext={nextItem ? () => goTo(nextItem.key) : undefined}
            />
          ) : (
            <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
              لا توجد أسئلة في هذا التصنيف.
            </p>
          )}
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
                    className="h-full rounded-full bg-blue-600 dark:bg-blue-700 transition-[width]"
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
            className="rounded-full bg-blue-600 dark:bg-blue-700 px-6 py-2.5 font-semibold text-white transition hover:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-60"
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
