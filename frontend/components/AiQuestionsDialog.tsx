"use client";

import { useState, type DragEvent } from "react";
import { toast } from "sonner";
import { FileText, Sparkles, UploadCloud, X } from "lucide-react";
import { useGenerateAiQuestions } from "@/app/hooks/useAddQuestion";
import { getApiErrorMessage } from "@/app/lib/api-error";
import { cn } from "@/app/lib/utils";

// Lesson material the AI reads: a PDF or a photo of the pages.
const ACCEPT = "application/pdf,image/*";
const isAccepted = (file: File) =>
  file.type === "application/pdf" || file.type.startsWith("image/");

interface AiQuestionsDialogProps {
  lessonId: number;
  onDone: () => void;
  onCancel: () => void;
}

// Upload lesson material to POST /uploads and let the AI turn it into
// questions. The response carries nothing we render, so on success the
// questions list is simply refetched.
export const AiQuestionsDialog = ({ lessonId, onDone, onCancel }: AiQuestionsDialogProps) => {
  const generate = useGenerateAiQuestions(String(lessonId));
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const pickFile = (picked: File | null | undefined) => {
    if (!picked) return;
    if (!isAccepted(picked)) {
      toast.error("الملف غير مدعوم. اختر ملف PDF أو صورة.");
      return;
    }
    setFile(picked);
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    pickFile(event.dataTransfer.files?.[0]);
  };

  const handleGenerate = () => {
    if (!file || generate.isPending) return;
    generate.mutate(file, {
      onSuccess: () => {
        toast.success("تم توليد الأسئلة بنجاح");
        onDone();
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });
  };

  // While generating, closing the popup would hide the progress but not
  // stop the request — keep it open until the answer comes back.
  const close = () => {
    if (!generate.isPending) onCancel();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={close}
    >
      <div
        dir="rtl"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.key === "Escape" && close()}
        className="w-full max-w-md overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-blue-50 shadow-xl shadow-indigo-500/10 dark:border-indigo-900/50 dark:from-indigo-950/40 dark:via-zinc-900 dark:to-blue-950/40"
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-l from-indigo-600 to-blue-400 text-white shadow-lg shadow-indigo-500/30">
              <Sparkles className={cn("size-5", generate.isPending && "animate-pulse")} />
            </span>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                توليد أسئلة بالذكاء الاصطناعي
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                ارفع ملف الدرس وسيُنشئ الذكاء الاصطناعي الأسئلة لك.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            disabled={generate.isPending}
            aria-label="إغلاق"
            className="rounded-full p-1.5 text-zinc-400 transition hover:bg-white/70 hover:text-zinc-700 disabled:opacity-40 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          {file ? (
            <div className="flex items-center gap-3 rounded-2xl border border-indigo-200 bg-white/80 px-4 py-3 dark:border-indigo-900 dark:bg-zinc-900/60">
              <FileText className="size-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
              <span className="flex-1 truncate text-sm text-zinc-800 dark:text-zinc-200" dir="auto">
                {file.name}
              </span>
              {!generate.isPending && (
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  aria-label="إزالة الملف"
                  className="rounded-full p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          ) : (
            <label
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={cn(
                "flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition",
                isDragging
                  ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40"
                  : "border-indigo-200 bg-white/60 hover:border-indigo-400 dark:border-indigo-900 dark:bg-zinc-900/40"
              )}
            >
              <UploadCloud className="size-8 text-indigo-500" />
              <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                اسحب الملف هنا أو اضغط للاختيار
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">PDF أو صورة</span>
              <input
                type="file"
                accept={ACCEPT}
                className="hidden"
                onChange={(event) => pickFile(event.target.files?.[0])}
              />
            </label>
          )}
        </div>

        <div className="px-6 pb-6">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!file || generate.isPending}
            className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-l from-indigo-600 to-blue-400 px-6 py-3 font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {generate.isPending && (
              <span className="absolute inset-y-0 -left-1/2 w-1/2 animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            )}
            <Sparkles className={cn("size-5", generate.isPending && "animate-spin")} />
            {generate.isPending ? "جاري توليد الأسئلة..." : "توليد الأسئلة"}
          </button>
        </div>
      </div>
    </div>
  );
};
