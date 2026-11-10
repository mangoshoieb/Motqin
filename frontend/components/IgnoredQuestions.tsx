"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ChevronDown, EyeOff, RotateCcw } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { getApiErrorMessage } from "@/app/lib/api-error";
import { useIgnoredQuestions, useRestoreQuestion } from "@/app/hooks/useIgnoredQuestions";

interface IgnoredQuestionsProps {
  lessonId: string;
  category: string;
}

// Foot of the lesson page: the system questions this student ignored in the
// active category (GET /questions/ignored), each with a restore button. Hidden
// entirely while there are none.
export const IgnoredQuestions = ({ lessonId, category }: IgnoredQuestionsProps) => {
  const { data: ignored } = useIgnoredQuestions(lessonId, category);
  const restore = useRestoreQuestion(lessonId);
  const [open, setOpen] = useState(false);

  if (!ignored?.length) return null;

  return (
    <section className="mt-8 rounded-2xl border border-dashed border-zinc-300 bg-white/60 dark:border-zinc-700 dark:bg-zinc-900/60">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-5 py-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300"
      >
        <EyeOff className="size-4 text-zinc-400" />
        <span className="flex-1 text-start">
          الأسئلة المتجاهلة <span className="tabular-nums text-zinc-400">({ignored.length})</span>
        </span>
        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
          {open ? "إخفاء" : "عرض"}
        </span>
        <ChevronDown className={cn("size-4 text-zinc-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="flex flex-col gap-3 border-t border-dashed border-zinc-300 px-5 pb-5 pt-4 dark:border-zinc-700">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            الأسئلة التي تستعيدها تعود إلى قائمة الدرس، وتُضاف إلى المراجعة الحالية.
          </p>

          {ignored.map((question) => {
            const title =
              question.title || question.infoCard?.title || question.mcqCard?.text || "سؤال بدون عنوان";
            const restoring = restore.isPending && restore.variables?.informationID === question.informationID;

            return (
              <div
                key={question.informationID}
                className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="min-w-0 flex-1 opacity-70">
                  <p className="truncate font-medium text-zinc-900 dark:text-zinc-100" dir="auto">
                    {title}
                  </p>
                  {question.infoCard?.explanation && (
                    <p className="mt-0.5 truncate text-sm text-zinc-500 dark:text-zinc-400" dir="auto">
                      {question.infoCard.explanation}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  disabled={restoring}
                  onClick={() =>
                    restore.mutate(question, {
                      onSuccess: () => toast.success("تمت استعادة السؤال"),
                      onError: (error) => toast.error(getApiErrorMessage(error)),
                    })
                  }
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-blue-200 px-3.5 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 disabled:opacity-50 dark:border-blue-900 dark:text-blue-300 dark:hover:bg-blue-950/40"
                >
                  <RotateCcw className="size-3.5" />
                  {restoring ? "جاري الاستعادة..." : "استعادة"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
