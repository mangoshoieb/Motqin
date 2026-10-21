"use client";

import { useEffect, useState, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileText, Sparkles, UploadCloud, X } from "lucide-react";
import { useGenerateQuestionsFromPdf } from "@/app/hooks/useAddQuestion";
import { useInformationLanguages } from "@/app/hooks/useLookups";
import { getApiErrorMessage } from "@/app/lib/api-error";
import { useAiQuestionsReviewStore } from "@/app/lib/ai-questions-review.store";
import { AUTO_QUESTION_LANGUAGE } from "@/app/constants/question.constants";
import { cn } from "@/app/lib/utils";

const isPdf = (file: File) =>
  file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

// What the waiting screen says while the AI works (~a minute). Each line
// shows for STEP_SECONDS; the last one stays until the answer arrives.
const WAITING_STEPS = [
  "جاري رفع الملف...",
  "جاري قراءة صفحات الملف...",
  "جاري استخراج المعلومات...",
  "جاري صياغة الأسئلة والخيارات...",
  "اللمسات الأخيرة...",
];
const STEP_SECONDS = 9;

const formatElapsed = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

// There's no real progress to report, so the bar eases toward 95% over the
// expected minute and never claims to be done before it is.
const fakeProgress = (seconds: number) => 95 * (1 - Math.exp(-seconds / 25));

interface PdfQuestionsDialogProps {
  lessonId: number;
  lessonTitle?: string;
  // Where the review page lives for this lesson.
  reviewHref: string;
  onCancel: () => void;
}

// Upload a PDF to POST /ai/fill-questions-from-pdf, then hand the generated
// questions to the review page — nothing is saved until the student
// confirms them there.
export const PdfQuestionsDialog = ({
  lessonId,
  lessonTitle,
  reviewHref,
  onCancel,
}: PdfQuestionsDialogProps) => {
  const router = useRouter();
  const generate = useGenerateQuestionsFromPdf();
  const startReview = useAiQuestionsReviewStore((state) => state.start);
  const { data: languages } = useInformationLanguages();

  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [language, setLanguage] = useState(AUTO_QUESTION_LANGUAGE);
  const [isDragging, setIsDragging] = useState(false);
  // Set once the questions are in hand, so the form doesn't flash back
  // while the review page loads.
  const [isLeaving, setIsLeaving] = useState(false);
  // Waiting-screen clock: when generation started, and the latest tick.
  const [startedAt, setStartedAt] = useState(0);
  const [now, setNow] = useState(0);
  const elapsed = startedAt ? Math.max(0, Math.floor((now - startedAt) / 1000)) : 0;

  const isWorking = generate.isPending || isLeaving;

  // Tick the waiting screen, and warn before a refresh / tab close throws
  // away a minute of AI work.
  useEffect(() => {
    if (!isWorking) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [isWorking]);

  const pickFile = (picked: File | null | undefined) => {
    if (!picked) return;
    if (!isPdf(picked)) {
      toast.error("الملف غير مدعوم. اختر ملف PDF.");
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
    if (!file || isWorking) return;
    const start = Date.now();
    setStartedAt(start);
    setNow(start);
    generate.mutate(
      { pdf: file, notes, language },
      {
        onSuccess: (generated) => {
          if (generated.length === 0) {
            toast.error("لم نتمكن من استخراج أسئلة من هذا الملف. جرّب ملفًا آخر.");
            return;
          }
          const stamp = Date.now();
          startReview(
            lessonId,
            generated.map(({ draft, pageNumber }, i) => ({
              key: `${stamp}-${i}`,
              draft,
              pageNumber,
              edited: false,
              saveError: null,
            }))
          );
          setIsLeaving(true);
          router.push(reviewHref);
        },
        onError: (error) => toast.error(getApiErrorMessage(error)),
      }
    );
  };

  // While the AI works the popup stays put — closing it would hide the
  // progress without stopping the request.
  const close = () => {
    if (!isWorking) onCancel();
  };

  const step = isLeaving
    ? "جاري فتح الأسئلة للمراجعة..."
    : WAITING_STEPS[Math.min(Math.floor(elapsed / STEP_SECONDS), WAITING_STEPS.length - 1)];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={close}
    >
      <div
        dir="rtl"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.key === "Escape" && close()}
        className="w-full max-w-lg overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-blue-50 shadow-xl shadow-indigo-500/10 dark:border-indigo-900/50 dark:from-indigo-950/40 dark:via-zinc-900 dark:to-blue-950/40"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 pt-6">
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-l from-indigo-600 to-blue-400 text-white shadow-lg shadow-indigo-500/30">
              <Sparkles className={cn("size-5", isWorking && "animate-pulse")} />
            </span>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                توليد أسئلة من PDF
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {lessonTitle
                  ? `ارفع ملف الدرس وسيُنشئ الذكاء الاصطناعي أسئلة "${lessonTitle}".`
                  : "ارفع ملف الدرس وسيُنشئ الذكاء الاصطناعي الأسئلة لك."}
              </p>
            </div>
          </div>
          {!isWorking && (
            <button
              type="button"
              onClick={close}
              aria-label="إغلاق"
              className="rounded-full p-1.5 text-zinc-400 transition hover:bg-white/70 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              <X className="size-5" />
            </button>
          )}
        </div>

        {isWorking ? (
          /* Waiting screen */
          <div className="flex flex-col items-center gap-4 px-6 py-8 text-center" aria-live="polite">
            <div className="relative flex size-20 items-center justify-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-indigo-400/20" />
              <span className="absolute inset-2 animate-pulse rounded-full bg-indigo-400/20" />
              <span className="relative flex size-14 items-center justify-center rounded-full bg-gradient-to-l from-indigo-600 to-blue-400 text-white shadow-lg shadow-indigo-500/30">
                <Sparkles className="size-6 animate-spin [animation-duration:3s]" />
              </span>
            </div>

            <div>
              <p className="font-bold text-zinc-900 dark:text-zinc-100">جاري توليد الأسئلة</p>
              <p key={step} className="mt-1 text-sm text-indigo-700 animate-in fade-in dark:text-indigo-300">
                {step}
              </p>
            </div>

            <div className="w-full">
              <div className="h-2 w-full overflow-hidden rounded-full bg-indigo-100 dark:bg-indigo-950">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-indigo-600 to-blue-400 transition-[width] duration-1000 ease-linear"
                  style={{ width: `${isLeaving ? 100 : fakeProgress(elapsed)}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span>قد يستغرق هذا حوالي دقيقة، لا تغلق الصفحة.</span>
                <span className="tabular-nums" dir="ltr">{formatElapsed(elapsed)}</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4 px-6 py-5">
              {/* PDF */}
              {file ? (
                <div className="flex items-center gap-3 rounded-2xl border border-indigo-200 bg-white/80 px-4 py-3 dark:border-indigo-900 dark:bg-zinc-900/60">
                  <FileText className="size-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
                  <span className="flex-1 truncate text-sm text-zinc-800 dark:text-zinc-200" dir="auto">
                    {file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    aria-label="إزالة الملف"
                    className="rounded-full p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
                  >
                    <X className="size-4" />
                  </button>
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
                    اسحب ملف PDF هنا أو اضغط للاختيار
                  </span>
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    className="hidden"
                    onChange={(event) => pickFile(event.target.files?.[0])}
                  />
                </label>
              )}

              {/* Language */}
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                لغة الأسئلة
                <select
                  value={language}
                  onChange={(event) => setLanguage(Number(event.target.value))}
                  className="mt-1 w-full cursor-pointer rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                >
                  {languages?.length ? (
                    languages.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.nameAr}
                      </option>
                    ))
                  ) : (
                    <option value={AUTO_QUESTION_LANGUAGE}>تلقائي</option>
                  )}
                </select>
                <span className="mt-1 block text-xs font-normal text-zinc-500 dark:text-zinc-400">
                  &quot;تلقائي&quot; يستخدم نفس لغة الملف.
                </span>
              </label>

              {/* Notes */}
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                ملاحظات للذكاء الاصطناعي (اختياري)
                <textarea
                  dir="auto"
                  rows={3}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="مثال: ركّز على القوانين والتعريفات، وتجاهل الأمثلة المحلولة."
                  className="mt-1 w-full resize-y rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                />
              </label>
            </div>

            <div className="flex items-center gap-3 px-6 pb-6">
              <button
                type="button"
                onClick={close}
                className="rounded-2xl border border-zinc-200 bg-white/70 px-5 py-3 text-zinc-600 transition hover:bg-white dark:border-zinc-700 dark:bg-transparent dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                لاحقًا
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!file}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-indigo-600 to-blue-400 px-6 py-3 font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Sparkles className="size-5" />
                توليد الأسئلة
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
